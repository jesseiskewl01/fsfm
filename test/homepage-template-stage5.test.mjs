import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderHomepage } from '../src/render/homepage.mjs';
import { renderPage } from '../src/render/page.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (name) => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));
const homepage = readJson('content/v13/homepage.json');
const site = readJson('content/v13/site.json');
const wallpapers = readJson('content/v13/wallpapers.json');
const pages = [homepage, readJson('content/v13/albums/the-early-bird.json')];
const html = renderHomepage(homepage, { site, pages, wallpapers });
const previewHtml = renderHomepage(homepage, { site, pages, wallpapers, preview: true });

const gadgets = [
  'gadget-clock', 'gadget-calendar', 'gadget-now-playing', 'gadget-photos',
  'gadget-dates', 'gadget-note', 'gadget-barrel-roll', 'gadget-bubbles',
  'gadget-radio', 'gadget-purble'
];

test('Homepage renders through the dedicated V13 Vista desktop shell', () => {
  assert.match(html, /<body class="template-homepage" data-template="homepage"/);
  assert.match(html, /class="taskbar"/);
  assert.match(html, /class="aero-window hero-window"/);
  assert.match(html, /id="fsfmBootScreen"/);
  assert.match(html, /id="wallA"/);
  assert.match(html, /id="wallB"/);
  assert.match(html, /id="bgCanvas"/);
  assert.doesNotMatch(html, /class="site-shell"/);
});

test('Homepage visible copy and section ordering are preserved', () => {
  const expected = [
    'Fake Space Fog Machine', 'jesse freaking scarsbrook', '@mirrorlesssmoke',
    "SEASON&#39;S GREETINGS", 'THE EARLY BIRD....', 'FAKE SPACE FOG MACHINE',
    'HOW GOES IT?', 'THANK YOU FOR LISTENING', 'HI GUY',
    'THE KINDA DEALS THAT MAKE Ü WANNA BOOGIE', 'ABOUT FSFM',
    'FSFM ON SPOTIFY', 'ON THE HORIZON', 'FIND FSFM',
    'Fake Space Fog Machine is a fully independent artist based in the United Kingdom who doesn&#39;t know how to write about himself in the third person.'
  ];
  for (const value of expected) assert.ok(html.includes(value), `Homepage output should include ${value}`);
  const order = ['id="home-marquee"', 'id="home-about"', 'id="home-spotify"', 'id="home-events"', 'id="home-social"'];
  const positions = order.map((token) => html.indexOf(token));
  assert.ok(positions.every((position) => position >= 0));
  assert.deepEqual(positions, [...positions].sort((a, b) => a - b));
});

test('All original Homepage desktop gadgets are included in the Homepage template only', () => {
  for (const id of gadgets) assert.ok(html.includes(`id="${id}"`), `Missing gadget ${id}`);
  const albumRecord = readJson('content/v13/albums/the-early-bird.json');
  const albumHtml = renderPage(albumRecord, { site, pages, wallpapers });
  assert.doesNotMatch(albumHtml, /id="fsfmGadgets"|id="gadget-clock"|id="gadget-radio"/);
  assert.match(fs.readFileSync(path.join(root, 'src/styles/homepage-vista.css'), 'utf8'), /@media \(min-width: 1320px\) and \(min-height: 700px\)/);
  assert.match(fs.readFileSync(path.join(root, 'src/styles/homepage-vista.css'), 'utf8'), /@media \(max-width: 1319px\), \(max-height: 699px\)/);
});

test('Radio remains user-initiated and Purble Place remains a deferred, dismissible overlay', () => {
  assert.match(html, /id="homeMusicAudio" preload="none" loop/);
  assert.doesNotMatch(html.match(/<audio[^>]*id="homeMusicAudio"[^>]*>/)?.[0] || '', /autoplay/i);
  assert.match(html, /id="purbleFrame" title="Purble Place game" src="about:blank" data-src="https:\/\/www\.play-games\.com\/iframe\/37376\.html"/);
  assert.match(html, /id="purbleCloseButton"/);
  assert.match(html, /Open Purble Place in a new tab/);
  assert.match(html, /id="barrelRollButton"/);
  assert.match(html, /id="bubbleRateSlider"[^>]*value="50"/);
  assert.match(html, /https:\/\/github\.com\/jesseiskewl01\/fsfm\/raw\/refs\/heads\/main\/audio\/groovy\.mp3/);
});

test('Featured release and shutdown behaviour use the CMS-configured values', () => {
  assert.match(html, /The Early Bird\.\.\.\./);
  assert.match(html, /Debut album/);
  assert.match(html, /OUT NOW\.\.\.\./);
  assert.match(html, /https:\/\/open\.spotify\.com\/album\/0clOFZSG1MHTVtK9DAjUOe/);
  assert.match(html, /https:\/\/open\.spotify\.com\/track\/2CnrJj6Jz4vSe5E1hsWtpg/);
  assert.match(html, /id="featuredAlbumCover" src="\/media\/images\/cover\.png"/);
});

test('Wallpaper runtime includes the four original Vista identities and both cycle modes', () => {
  for (const name of ['Violet Haze', 'Aqua Glass', 'Solar Flare', 'Rose Bloom']) assert.ok(html.includes(name));
  for (const preset of wallpapers.presets.filter((item) => item.family === 'vista')) assert.ok(html.includes(preset.imageUrl));
  const desktopScript = fs.readFileSync(path.join(root, 'src/client/homepage-desktop.js'), 'utf8');
  assert.match(desktopScript, /cycle\.mode === 'random'/);
  assert.match(desktopScript, /applyTheme\(currentTheme \+ 1\)/);
  assert.match(desktopScript, /cycleSettings\.enabled/);
  assert.match(desktopScript, /configuredBubbleLevel/);
  assert.doesNotMatch(desktopScript, /Number\(runtimeConfig\.bubbleDefault\) \|\| 50/);
  assert.ok(desktopScript.indexOf('var incoming = wallBack;') < desktopScript.indexOf('incoming.style.backgroundSize'));
});

test('Wallpaper and ambient effects respect reduced motion and visibility', () => {
  const css = fs.readFileSync(path.join(root, 'src/styles/homepage-vista.css'), 'utf8');
  const desktopScript = fs.readFileSync(path.join(root, 'src/client/homepage-desktop.js'), 'utf8');
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(desktopScript, /prefers-reduced-motion: reduce/);
  assert.match(desktopScript, /document\.hidden/);
  assert.match(desktopScript, /runtimeConfig\.effects\?\.backgroundEffects !== false/);
});

test('Homepage metadata is crawlable, canonical and correctly identified as a MusicGroup', () => {
  assert.match(html, /<title>Fake Space Fog Machine<\/title>/);
  assert.match(html, /name="description" content="Land of the free"/);
  assert.match(html, /name="robots" content="index, follow"/);
  assert.match(html, /rel="canonical" href="https:\/\/fsfm\.port82\.net\/"/);
  assert.match(html, /property="og:title" content="Fake Space Fog Machine"/);
  assert.match(html, /"@type":"MusicGroup"/);
  assert.match(html, /<main class="wrap" id="main-content">/);
  assert.match(previewHtml, /name="robots" content="noindex, nofollow"/);
});

test('Preview keeps the Spotify embed but avoids loading the live Bandsintown script', () => {
  assert.match(previewHtml, /src="https:\/\/open\.spotify\.com\/embed\/artist\//);
  assert.match(previewHtml, /Bandsintown event widget preview/);
  assert.doesNotMatch(previewHtml, /<script src="\/assets\/bandsintown\.js"/);
  assert.match(html, /<script src="\/assets\/bandsintown\.js" defer><\/script>/);
});

test('Homepage CMS configuration exposes content, visibility and gadget controls', () => {
  const config = fs.readFileSync(path.join(root, '.pages.yml'), 'utf8');
  for (const field of [
    'name: hero', 'name: photos', 'name: dates', 'name: stickyNote', 'name: funWidgets',
    'name: visibility', 'name: showClock', 'name: showCalendar', 'name: showFeaturedRelease',
    'name: showPhotos', 'name: showDates', 'name: showStickyNote', 'name: radioAudioUrl',
    'name: bubbleDefault', 'name: purblePlaceUrl', 'name: featuredRelease'
  ]) assert.ok(config.includes(field), `CMS config is missing ${field}`);
});

test('Marquee copy is present in generated HTML before client enhancement', () => {
  const messages = homepage.sections.find((section) => section.type === 'marquee').content.messages;
  for (const message of messages) assert.ok(html.includes(message.replaceAll('&', '&amp;').replaceAll("'", '&#39;')), `Static HTML should contain ${message}`);
  assert.match(html, /id="marqueeTrack" role="group"/);
  assert.match(html, /aria-hidden="true"/);
});

test('Homepage event window keeps one padding container and preview mode avoids third-party events', () => {
  const eventWindow = previewHtml.slice(previewHtml.indexOf('id="home-events"'), previewHtml.indexOf('id="home-social"'));
  assert.match(eventWindow, /class="window-body bit-container"><div class="component-fallback">Bandsintown event widget preview/);
  assert.doesNotMatch(eventWindow, /window-body bit-container"><div class="bit-container"/);
});

test('Homepage custom wallpaper options reach the desktop runtime and Aurora has its own preset background', () => {
  const customPage = {
    ...homepage,
    appearance: {
      ...homepage.appearance,
      wallpaper: { mode: 'custom', customImage: '/media/images/custom.webp', customFit: 'contain', customPosition: 'top-left', presets: homepage.appearance.wallpaper.presets }
    }
  };
  const customHtml = renderHomepage(customPage, { site, pages, wallpapers });
  assert.match(customHtml, /"fit":"contain","position":"top left"/);
  const auroraPage = {
    ...homepage,
    appearance: { ...homepage.appearance, wallpaper: { mode: 'preset', preset: 'aurora' } }
  };
  const auroraHtml = renderHomepage(auroraPage, { site, pages, wallpapers });
  assert.match(auroraHtml, /radial-gradient\(ellipse at 18% 18%/);
});


test('Homepage interface labels are CMS-editable and render from the canonical record', () => {
  const configured = {
    ...homepage,
    templateData: {
      ...homepage.templateData,
      desktopLabels: {
        ...homepage.templateData.desktopLabels,
        bootLoading: 'DESKTOP STARTING',
        bootCaption: 'WELCOME TO THE STRANGE INTERNET',
        shutdownTitle: 'See you later.',
        shutdownMessage: 'The desktop is powering down.',
        homeNavigationLabel: 'Start'
      },
      gadgets: {
        ...homepage.templateData.gadgets,
        labels: {
          ...homepage.templateData.gadgets.labels,
          clock: 'Local Time',
          pictureFrame: 'Photo Window',
          barrelRollButton: 'SPIN THE DESKTOP',
          bubbleFrequencyLabel: 'BUBBLE DENSITY',
          radioPlay: 'START RADIO',
          purblePlaceButton: 'LAUNCH GAME'
        }
      }
    }
  };
  const customized = renderHomepage(configured, { site, pages: [configured, ...pages.slice(1)], wallpapers });
  for (const value of [
    'DESKTOP STARTING', 'WELCOME TO THE STRANGE INTERNET', 'See you later.',
    'The desktop is powering down.', 'Start', 'Local Time', 'Photo Window',
    'SPIN THE DESKTOP', 'BUBBLE DENSITY', 'START RADIO', 'LAUNCH GAME'
  ]) assert.ok(customized.includes(value), `Customized Homepage should render ${value}`);
  const config = fs.readFileSync(path.join(root, '.pages.yml'), 'utf8');
  for (const field of [
    'name: desktopLabels', 'name: bootLoading', 'name: bootWelcome', 'name: bootReady',
    'name: bootCaption', 'name: shutdownTitle', 'name: shutdownMessage',
    'name: homeNavigationLabel', 'name: labels', 'name: clock', 'name: calendar',
    'name: pictureFrame', 'name: importantDates', 'name: stickyNote',
    'name: barrelRollButton', 'name: bubbleFrequencyLabel', 'name: radioPlay',
    'name: radioPause', 'name: purblePlaceButton'
  ]) assert.ok(config.includes(field), `CMS config is missing ${field}`);
});

test('Default build command targets V13 and the legacy builder is explicit', () => {
  const pkg = readJson('package.json');
  assert.equal(pkg.scripts.build, 'node scripts/build-v13.mjs');
  assert.equal(pkg.scripts['build:v13:stage5'], 'node scripts/build-v13-stage5.mjs');
  assert.equal(pkg.scripts['build:legacy'], 'node scripts/build-pages.mjs');
});
