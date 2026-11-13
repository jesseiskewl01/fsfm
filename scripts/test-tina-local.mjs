import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

const host = '127.0.0.1';
const port = Number(process.env.TINA_TEST_PORT || 3000);
const baseUrl = 'http://' + host + ':' + port;
const api = baseUrl + '/__fsfm/api';
const testDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fsfm-studio-auth-test-'));
let smokeAssetPath = '';
let smokeCreatedPagePath = '';
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
  requireStatus(await fetch(api + '/deploy/status'), 401, 'Unauthenticated deployment status');
  requireStatus(await fetch(api + '/deploy', { method: 'POST' }), 401, 'Unauthenticated live deployment');
  requireStatus(await fetch(api + '/content'), 401, 'Unauthenticated content index');
  requireStatus(await fetch(api + '/catalog'), 401, 'Unauthenticated component catalogue');
  requireStatus(await fetch(api + '/content/homepage'), 401, 'Unauthenticated homepage record');
  requireStatus(await fetch(api + '/content/site'), 401, 'Unauthenticated site settings');
  requireStatus(await fetch(api + '/content/wallpapers'), 401, 'Unauthenticated wallpaper catalogue');
  requireStatus(await fetch(api + '/lyrics/05-goodnight.lrc'), 401, 'Unauthenticated synced lyrics');
  requireStatus(await fetch(api + '/assets'), 401, 'Unauthenticated asset library');

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
  const crossOriginDeploy = await fetch(api + '/deploy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: loginCookie },
    body: JSON.stringify({ confirmation: 'PUBLISH FSFM LIVE' }),
  });
  requireStatus(crossOriginDeploy, 403, 'Cross-origin live deployment');

  const assetIndexResponse = await fetch(api + '/assets', { headers: authHeaders });
  if (!assetIndexResponse.ok || !(await assetIndexResponse.json()).images.some((asset) => asset.name === 'cover.png')) {
    throw new Error('Existing image assets were not listed by the Studio asset library.');
  }
  const assetFilename = 'fsfm-studio-smoke-' + path.basename(testDataDir).replace(/[^a-z0-9-]/gi, '').toLowerCase() + '.png';
  smokeAssetPath = path.join(process.cwd(), 'media', 'images', assetFilename);
  const invalidOriginAsset = await fetch(api + '/assets', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: loginCookie },
    body: JSON.stringify({ kind: 'image', filename: assetFilename, contentBase64: 'aGVsbG8=' }),
  });
  requireStatus(invalidOriginAsset, 403, 'Cross-origin asset upload');
  const assetUpload = await fetch(api + '/assets', {
    method: 'POST', headers: saveHeaders,
    body: JSON.stringify({
      kind: 'image',
      filename: assetFilename,
      contentBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/dL8AAAAASUVORK5CYII=',
    }),
  });
  requireStatus(assetUpload, 201, 'Authenticated local image upload');
  const uploadedAsset = await assetUpload.json();
  if (uploadedAsset.path !== '/media/images/' + assetFilename || !fs.existsSync(smokeAssetPath)) {
    throw new Error('Uploaded image was not saved to the local asset library.');
  }

  const createSmokePage = await fetch(api + '/content/create', {
    method: 'POST', headers: saveHeaders,
    body: JSON.stringify({
      template: 'editorial',
      name: 'FSFM Studio Activation Smoke Test',
      slug: 'fsfm-studio-activation-smoke-test',
      showInNavigation: true,
    }),
  });
  requireStatus(createSmokePage, 201, 'Create unpublished activation smoke-test page');
  const createdSmokePage = await createSmokePage.json();
  smokeCreatedPagePath = path.join(
    process.cwd(), 'content', 'v13', 'editorial-pages', 'fsfm-studio-activation-smoke-test.json',
  );
  if (!fs.existsSync(smokeCreatedPagePath)) throw new Error('Activation smoke-test page was not written locally.');

  const createdSmokePageResponse = await fetch(api + '/content/editorial-pages/fsfm-studio-activation-smoke-test', { headers: authHeaders });
  if (!createdSmokePageResponse.ok) throw new Error('Could not read the newly created activation smoke-test page.');
  const createdSmokePageData = await createdSmokePageResponse.json();
  if (createdSmokePageData.record.publishing?.published !== false) {
    throw new Error('New pages must start inactive.');
  }

  const activeSmokeRecord = JSON.parse(JSON.stringify(createdSmokePageData.record));
  activeSmokeRecord.publishing.published = true;
  const activateSmokePage = await fetch(api + '/content/editorial-pages/fsfm-studio-activation-smoke-test', {
    method: 'PUT', headers: saveHeaders,
    body: JSON.stringify({ revision: createdSmokePageData.revision, record: activeSmokeRecord }),
  });
  requireStatus(activateSmokePage, 200, 'Reactivate smoke-test page');
  const activatedSmokeData = await activateSmokePage.json();
  if (activatedSmokeData.record.publishing?.published !== true) {
    throw new Error('Reactivation did not persist the active publication state.');
  }

  const inactiveSmokeRecord = JSON.parse(JSON.stringify(activatedSmokeData.record));
  inactiveSmokeRecord.publishing.published = false;
  const deactivateSmokePage = await fetch(api + '/content/editorial-pages/fsfm-studio-activation-smoke-test', {
    method: 'PUT', headers: saveHeaders,
    body: JSON.stringify({ revision: activatedSmokeData.revision, record: inactiveSmokeRecord }),
  });
  requireStatus(deactivateSmokePage, 200, 'Deactivate smoke-test page');
  const deactivatedSmokeData = await deactivateSmokePage.json();
  if (deactivatedSmokeData.record.publishing?.published !== false) {
    throw new Error('Deactivation did not persist the inactive publication state.');
  }

  const contentIndexResponse = await fetch(api + '/content', { headers: authHeaders });
  if (!contentIndexResponse.ok) throw new Error('Authenticated content index failed.');
  const contentIndex = await contentIndexResponse.json();
  for (const key of ['homepage', 'albums/the-early-bird', 'vista-pages/vistatest']) {
    if (!contentIndex.items.some((item) => item.key === key)) throw new Error('Content index is missing ' + key + '.');
  }
  const catalogueResponse = await fetch(api + '/catalog', { headers: authHeaders });
  if (!catalogueResponse.ok) throw new Error('Component catalogue request failed.');
  const catalogue = await catalogueResponse.json();
  if (Object.keys(catalogue.components || {}).length !== 18) throw new Error('Studio catalogue should expose all 18 registered building blocks.');
  if (!['homepage', 'album', 'vista-window', 'editorial'].every((template) => catalogue.templates?.[template])) {
    throw new Error('Studio catalogue is missing one or more page templates.');
  }

  const homepageContent = await fetch(api + '/content/homepage', { headers: authHeaders });
  if (!homepageContent.ok) throw new Error('Homepage editor did not load.');
  const homepageData = await homepageContent.json();
  if (!homepageData.record.templateData.gadgets) throw new Error('Homepage editor did not receive the complete desktop gadget settings.');
  const siteContent = await fetch(api + '/content/site', { headers: authHeaders });
  if (!siteContent.ok) throw new Error('Site-wide settings did not load.');
  const siteData = await siteContent.json();
  if (!siteData.record.socialProfiles) throw new Error('Site-wide social profiles did not load.');
  const wallpaperContent = await fetch(api + '/content/wallpapers', { headers: authHeaders });
  if (!wallpaperContent.ok) throw new Error('Wallpaper catalogue did not load.');
  const wallpaperData = await wallpaperContent.json();
  if (!wallpaperData.record.presets?.length) throw new Error('Wallpaper presets did not load.');
  const vistaContent = await fetch(api + '/content/vista-pages/vistatest', { headers: authHeaders });
  if (!vistaContent.ok || (await vistaContent.json()).record.template !== 'vista-window') throw new Error('Vista page editor did not load.');
  const deactivateHomepage = JSON.parse(JSON.stringify(homepageData.record));
  deactivateHomepage.publishing.published = false;
  const homepageDeactivation = await fetch(api + '/content/homepage', {
    method: 'PUT', headers: saveHeaders,
    body: JSON.stringify({ revision: homepageData.revision, record: deactivateHomepage }),
  });
  requireStatus(homepageDeactivation, 422, 'Homepage deactivation protection');

  const invalidPageRecord = JSON.parse(JSON.stringify(homepageData.record));
  invalidPageRecord.identity.slug = 'attempted-route-change';
  const invalidPageSave = await fetch(api + '/content/homepage', {
    method: 'PUT', headers: saveHeaders,
    body: JSON.stringify({ revision: homepageData.revision, record: invalidPageRecord }),
  });
  requireStatus(invalidPageSave, 422, 'Generic page slug protection');

  const invalidSite = JSON.parse(JSON.stringify(siteData.record));
  invalidSite.siteName = '';
  const invalidSiteSave = await fetch(api + '/content/site', {
    method: 'PUT', headers: saveHeaders,
    body: JSON.stringify({ revision: siteData.revision, record: invalidSite }),
  });
  requireStatus(invalidSiteSave, 422, 'Global site settings validation');

  const lyricResponse = await fetch(api + '/lyrics/05-goodnight.lrc', { headers: authHeaders });
  if (!lyricResponse.ok) throw new Error('Synced lyrics editor could not read the existing LRC file.');
  const lyricData = await lyricResponse.json();
  if (!/\[\d{2}:\d{2}\.\d{2}\]/.test(lyricData.content)) throw new Error('Synced lyrics response does not contain timestamped LRC text.');
  const crossOriginLyrics = await fetch(api + '/lyrics/05-goodnight.lrc', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: loginCookie },
    body: JSON.stringify({ revision: lyricData.revision, content: lyricData.content }),
  });
  requireStatus(crossOriginLyrics, 403, 'Cross-origin synced lyrics save');
  const staleLyrics = await fetch(api + '/lyrics/05-goodnight.lrc', {
    method: 'PUT', headers: saveHeaders,
    body: JSON.stringify({ revision: 'stale-lyrics-revision', content: lyricData.content }),
  });
  requireStatus(staleLyrics, 409, 'Stale synced lyrics protection');

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
  console.log('  API:      authentication, content index, all page templates, 18 blocks, global settings and validation verified');
  console.log('  Lyrics:   protected LRC read, cross-origin and stale-revision checks verified');
  console.log('  Assets:   local image upload, signature validation, cross-origin protection and cleanup verified');
  console.log('  Pages:    create draft, activate, deactivate and homepage protection verified');
} catch (error) {
  console.error('[Tina smoke test]', error);
  process.exitCode = 1;
} finally {
  await stopChild();
  if (smokeAssetPath) fs.rmSync(smokeAssetPath, { force: true });
  if (smokeCreatedPagePath) fs.rmSync(smokeCreatedPagePath, { force: true });
  fs.rmSync(testDataDir, { recursive: true, force: true });
}
