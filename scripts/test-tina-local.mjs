import { spawn } from 'node:child_process';

const host = '127.0.0.1';
const port = Number(process.env.TINA_TEST_PORT || 3000);
const baseUrl = 'http://' + host + ':' + port;
const command = 'npx';
const args = [
  '--yes',
  '@tinacms/cli@4.0.5',
  'dev',
  '--noTelemetry',
  '-c',
  'node scripts/dev-tina-preview.mjs',
];

const child = spawn(command, args, {
  cwd: process.cwd(),
  env: { ...process.env, HOST: host, PORT: String(port) },
  stdio: 'inherit',
  detached: process.platform !== 'win32',
});

let childExit = null;
let stopping = false;

child.once('error', (error) => {
  childExit = { code: 1, signal: null, error };
});

child.once('exit', (code, signal) => {
  childExit = { code, signal };
});

function stopChild() {
  if (stopping) return;
  stopping = true;

  try {
    if (child.pid && process.platform !== 'win32') {
      process.kill(-child.pid, 'SIGTERM');
    } else {
      child.kill('SIGTERM');
    }
  } catch {
    // The process may already have exited.
  }
}

async function check(url, expectedText) {
  const response = await fetch(url, { redirect: 'manual' });
  if (!response.ok) {
    throw new Error(url + ' returned HTTP ' + response.status);
  }

  const body = await response.text();
  if (expectedText && !body.includes(expectedText)) {
    throw new Error(url + ' did not contain expected text: ' + expectedText);
  }

  return { status: response.status, bytes: body.length };
}

async function waitForServer() {
  const deadline = Date.now() + 90_000;
  let lastError = 'server has not started';

  while (Date.now() < deadline) {
    if (childExit) {
      throw new Error(
        'Tina dev process exited before the preview was ready (' +
          JSON.stringify(childExit) +
          ').',
      );
    }

    try {
      await check(baseUrl + '/admin/index.html', 'Tina');
      return;
    } catch (error) {
      lastError = error.message;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  throw new Error('Timed out waiting for Tina admin: ' + lastError);
}

try {
  await waitForServer();

  const admin = await check(baseUrl + '/admin/index.html', 'Tina');
  const homepage = await check(baseUrl + '/', 'Fake Space Fog Machine');
  const album = await check(baseUrl + '/albums/the-early-bird/', 'The Early Bird');
  const studio = await check(baseUrl + '/studio/', 'FSFM STUDIO');
  const healthResponse = await fetch(baseUrl + '/__fsfm/api/health');
  if (!healthResponse.ok || !(await healthResponse.json()).ok) {
    throw new Error('Studio API health check failed.');
  }
  const albumsResponse = await fetch(baseUrl + '/__fsfm/api/albums');
  if (!albumsResponse.ok) throw new Error('Studio album API failed.');
  const albumsData = await albumsResponse.json();
  if (!albumsData.albums.some((item) => item.id === 'the-early-bird')) {
    throw new Error('Studio album API did not return The Early Bird.');
  }

  console.log('');
  console.log('TinaCMS + FSFM Studio local smoke test passed:');
  console.log('  Admin:    HTTP ' + admin.status + ', ' + admin.bytes + ' bytes');
  console.log('  Homepage: HTTP ' + homepage.status + ', ' + homepage.bytes + ' bytes');
  console.log('  Album:    HTTP ' + album.status + ', ' + album.bytes + ' bytes');
  console.log('  Studio:   HTTP ' + studio.status + ', ' + studio.bytes + ' bytes');
  console.log('  API:      HTTP ' + healthResponse.status + ', ' + albumsData.albums.length + ' album(s) indexed');
} catch (error) {
  console.error('[Tina smoke test]', error);
  process.exitCode = 1;
} finally {
  stopChild();
}
