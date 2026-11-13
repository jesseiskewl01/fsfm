import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

const host = '127.0.0.1';
const port = Number(process.env.TINA_TEST_PORT || 3000);
const baseUrl = 'http://' + host + ':' + port;
const api = baseUrl + '/__fsfm/api';
const testDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fsfm-studio-auth-test-'));
const args = [
  '--yes',
  '@tinacms/cli@4.0.5',
  'dev',
  '--noTelemetry',
  '-c',
  'node scripts/dev-tina-preview.mjs',
];
const child = spawn('npx', args, {
  cwd: process.cwd(),
  env: { ...process.env, HOST: host, PORT: String(port), FSFM_STUDIO_DATA_DIR: testDataDir },
  stdio: 'inherit',
  detached: process.platform !== 'win32',
});

let childExit = null;
let stopping = false;
child.once('error', (error) => { childExit = { code: 1, signal: null, error }; });
child.once('exit', (code, signal) => { childExit = { code, signal }; });

async function stopChild() {
  if (!stopping) {
    stopping = true;
    try {
      if (child.pid && process.platform !== 'win32') process.kill(-child.pid, 'SIGTERM');
      else child.kill('SIGTERM');
    } catch {
      // The process may already have exited.
    }
  }
  if (!childExit) {
    await Promise.race([
      new Promise((resolve) => child.once('exit', resolve)),
      new Promise((resolve) => setTimeout(resolve, 2500)),
    ]);
  }
}

async function check(url, expectedText, headers = {}) {
  const response = await fetch(url, { redirect: 'manual', headers });
  if (!response.ok) throw new Error(url + ' returned HTTP ' + response.status);
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
    if (childExit) throw new Error('Tina dev process exited before the preview was ready (' + JSON.stringify(childExit) + ').');
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

function requireStatus(response, status, description) {
  if (response.status !== status) {
    throw new Error(description + ' returned HTTP ' + response.status + ', expected ' + status + '.');
  }
}

function sessionCookie(response) {
  const value = response.headers.get('set-cookie') || '';
  if (!value.includes('HttpOnly') || !value.includes('SameSite=Strict')) {
    throw new Error('Studio session cookie is missing required security attributes.');
  }
  const cookie = value.split(';', 1)[0];
  if (!cookie.startsWith('fsfm_studio_session=')) throw new Error('Authentication response did not set a session cookie.');
  return cookie;
}

try {
  await waitForServer();
  const admin = await check(baseUrl + '/admin/index.html', 'Tina');
  const homepage = await check(baseUrl + '/', 'Fake Space Fog Machine');
  const album = await check(baseUrl + '/albums/the-early-bird/', 'The Early Bird');

  const studioRedirect = await fetch(baseUrl + '/studio/', { redirect: 'manual' });
  requireStatus(studioRedirect, 302, 'Unauthenticated Studio page');
  if (studioRedirect.headers.get('location') !== '/studio/login.html') throw new Error('Studio did not redirect unauthenticated users to login.');
  const loginPage = await check(baseUrl + '/studio/login.html', 'Create your Studio password');

  const health = await fetch(api + '/health');
  if (!health.ok || !(await health.json()).ok) throw new Error('Studio API health check failed.');
  const status = await fetch(api + '/auth/status');
  if (!status.ok || (await status.json()).configured) throw new Error('Test authentication profile should initially be unconfigured.');

  requireStatus(await fetch(api + '/albums'), 401, 'Unauthenticated album list');
  requireStatus(await fetch(api + '/albums/the-early-bird'), 401, 'Unauthenticated album detail');

  const wrongOriginSetup = await fetch(api + '/auth/setup', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: 'test-password-long-enough' }),
  });
  requireStatus(wrongOriginSetup, 403, 'Cross-origin first-run setup');

  const weakSetup = await fetch(api + '/auth/setup', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Origin: baseUrl },
    body: JSON.stringify({ password: 'too-short' }),
  });
  requireStatus(weakSetup, 422, 'Weak first-run password');

  const setup = await fetch(api + '/auth/setup', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Origin: baseUrl },
    body: JSON.stringify({ password: 'smoke-test-password-long-enough' }),
  });
  requireStatus(setup, 201, 'First-run password setup');
  const setupCookie = sessionCookie(setup);

  if (!(await (await fetch(api + '/auth/status')).json()).configured) throw new Error('Setup did not persist authentication state.');
  const secondSetup = await fetch(api + '/auth/setup', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Origin: baseUrl },
    body: JSON.stringify({ password: 'another-smoke-test-password' }),
  });
  requireStatus(secondSetup, 409, 'Second first-run setup');

  const studioWithSession = await check(baseUrl + '/studio/', 'FSFM STUDIO', { Cookie: setupCookie });
  const wrongPassword = await fetch(api + '/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Origin: baseUrl },
    body: JSON.stringify({ password: 'not-the-password' }),
  });
  requireStatus(wrongPassword, 401, 'Incorrect Studio password');

  requireStatus(await fetch(api + '/auth/logout', {
    method: 'POST', headers: { Origin: baseUrl, Cookie: setupCookie },
  }), 200, 'Studio logout');
  requireStatus(await fetch(api + '/albums', { headers: { Cookie: setupCookie } }), 401, 'Revoked session');

  const login = await fetch(api + '/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Origin: baseUrl },
    body: JSON.stringify({ password: 'smoke-test-password-long-enough' }),
  });
  requireStatus(login, 200, 'Correct Studio password');
  const loginCookie = sessionCookie(login);
  const authHeaders = { Cookie: loginCookie };
  const saveHeaders = { 'Content-Type': 'application/json', Origin: baseUrl, Cookie: loginCookie };

  const albums = await fetch(api + '/albums', { headers: authHeaders });
  if (!albums.ok || !(await albums.json()).albums.some((item) => item.id === 'the-early-bird')) {
    throw new Error('Authenticated album list did not return The Early Bird.');
  }
  const albumResponse = await fetch(api + '/albums/the-early-bird', { headers: authHeaders });
  if (!albumResponse.ok) throw new Error('Authenticated album detail request failed.');
  const recordData = await albumResponse.json();
  const saveUrl = api + '/albums/the-early-bird';

  const crossSiteSave = await fetch(saveUrl, {
    method: 'PUT', headers: { 'Content-Type': 'application/json', Cookie: loginCookie },
    body: JSON.stringify({ revision: recordData.revision, record: recordData.record }),
  });
  requireStatus(crossSiteSave, 403, 'Save without same-origin header');

  const staleSave = await fetch(saveUrl, {
    method: 'PUT', headers: saveHeaders,
    body: JSON.stringify({ revision: 'deliberately-stale-revision', record: recordData.record }),
  });
  requireStatus(staleSave, 409, 'Stale revision protection');

  const changedSlug = JSON.parse(JSON.stringify(recordData.record));
  changedSlug.identity.slug = 'not-the-original-slug';
  const slugSave = await fetch(saveUrl, {
    method: 'PUT', headers: saveHeaders,
    body: JSON.stringify({ revision: recordData.revision, record: changedSlug }),
  });
  requireStatus(slugSave, 422, 'Album slug protection');

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const failed = await fetch(api + '/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Origin: baseUrl },
      body: JSON.stringify({ password: 'incorrect-password-for-lockout-test' }),
    });
    requireStatus(failed, 401, 'Failed login attempt ' + (attempt + 1));
  }
  const locked = await fetch(api + '/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Origin: baseUrl },
    body: JSON.stringify({ password: 'incorrect-password-for-lockout-test' }),
  });
  requireStatus(locked, 429, 'Login rate limit');
  if (!locked.headers.get('retry-after')) throw new Error('Login lockout did not provide a Retry-After header.');

  const authConfig = fs.readFileSync(path.join(testDataDir, 'auth.json'), 'utf8');
  if (authConfig.includes('smoke-test-password-long-enough')) throw new Error('Authentication file contains the raw test password.');

  console.log('');
  console.log('TinaCMS + FSFM Studio local smoke test passed:');
  console.log('  Admin:    HTTP ' + admin.status + ', ' + admin.bytes + ' bytes');
  console.log('  Homepage: HTTP ' + homepage.status + ', ' + homepage.bytes + ' bytes');
  console.log('  Album:    HTTP ' + album.status + ', ' + album.bytes + ' bytes');
  console.log('  Login:    HTTP ' + loginPage.status + ', ' + loginPage.bytes + ' bytes');
  console.log('  Studio:   HTTP ' + studioWithSession.status + ', ' + studioWithSession.bytes + ' bytes');
  console.log('  API:      protected; password hashing, session, logout, lockout and CSRF verified');
} catch (error) {
  console.error('[Tina smoke test]', error);
  process.exitCode = 1;
} finally {
  await stopChild();
  fs.rmSync(testDataDir, { recursive: true, force: true });
}
