import { escapeHtml, safeImageUrl, safeJsonForHtml } from './html.mjs';

export const CSS_WALLPAPER_BACKGROUNDS = Object.freeze({
  aurora: 'radial-gradient(ellipse at 18% 18%, rgba(53, 207, 174, .82), transparent 42%), radial-gradient(ellipse at 77% 23%, rgba(93, 123, 230, .74), transparent 44%), radial-gradient(ellipse at 50% 83%, rgba(25, 116, 139, .8), transparent 45%), linear-gradient(145deg, #06162d, #0b3046 52%, #171a45)'
});

export function wallpaperBackground(preset) {
  return preset && typeof preset.id === 'string' ? (CSS_WALLPAPER_BACKGROUNDS[preset.id] || '') : '';
}

const TEMPLATE_DEFAULTS = {
  homepage: 'vista-violet-haze',
  'vista-window': 'vista-violet-haze',
  editorial: 'aurora',
  album: 'album-amber'
};

export function resolveWallpaperConfig(page, catalogue) {
  const settings = page?.appearance?.wallpaper ?? {};
  const mode = settings.mode || 'template-default';
  const defaultId = TEMPLATE_DEFAULTS[page?.template] || 'vista-violet-haze';
  const presetIds = Array.isArray(settings.presets) ? settings.presets : [];
  const presets = (catalogue?.presets || []).filter((item) => presetIds.includes(item.id));
  const allowedPositions = new Set(['center','top','bottom','left','right','top left','top right','bottom left','bottom right']);
  const requestedPosition = String(settings.customPosition || settings.position || 'center').replaceAll('-', ' ');
  return {
    mode,
    preset: settings.preset || defaultId,
    presets: presets.map((item) => ({ id: item.id, imageUrl: safeImageUrl(item.imageUrl), kind: item.kind, palette: item.palette || {}, background: wallpaperBackground(item) })),
    customImage: safeImageUrl(settings.customImage),
    fit: (settings.customFit || settings.fit) === 'contain' ? 'contain' : 'cover',
    position: allowedPositions.has(requestedPosition) ? requestedPosition : 'center',
    initialSelection: settings.initialSelection === 'random' ? 'random' : (settings.initialSelection || settings.preset || defaultId),
    cycle: {
      enabled: Boolean(settings.cycle?.enabled),
      mode: settings.cycle?.mode === 'random' ? 'random' : 'sequential',
      intervalSeconds: Math.max(5, Math.min(3600, Number(settings.cycle?.intervalSeconds) || 30)),
      manualControl: Boolean(settings.cycle?.manualControl)
    },
    respectReducedMotion: page?.appearance?.effects?.respectReducedMotion !== false
  };
}

export function renderWallpaperLayer(page, catalogue) {
  const config = resolveWallpaperConfig(page, catalogue);
  const chosen = (catalogue?.presets || []).find((item) => item.id === config.preset);
  const initial = config.mode === 'custom' ? 'custom' : config.mode === 'cycle' ? (config.initialSelection === 'random' ? (config.presets[0]?.id || config.preset) : config.initialSelection) : (chosen?.id || config.preset);
  const initialPreset = (catalogue?.presets || []).find((item) => item.id === initial) || chosen;
  const initialImage = config.mode === 'custom' ? config.customImage : safeImageUrl(initialPreset?.imageUrl);
  const absoluteInitialImage = initialImage ? new URL(initialImage, 'https://fsfm.port82.net/').href : null;
  const initialBackground = config.mode === 'custom' ? '' : wallpaperBackground(initialPreset);
  const backgroundStyle = initialBackground ? `background-image:${initialBackground}` : absoluteInitialImage ? `background-image:url(&quot;${escapeHtml(absoluteInitialImage)}&quot;)` : '';
  const inlineStyle = backgroundStyle ? ` style="${backgroundStyle};background-size:${config.fit};background-position:${escapeHtml(config.position)};${config.fit === 'contain' ? 'background-repeat:no-repeat;' : ''}"` : '';
  const data = { ...config, catalog: (catalogue?.presets || []).map((item) => ({
    id: item.id, imageUrl: safeImageUrl(item.imageUrl), kind: item.kind, palette: item.palette || {}, background: wallpaperBackground(item)
  })) };
  const controls = config.cycle.manualControl && config.mode === 'cycle'
    ? '<button class="wallpaper-next" type="button" data-wallpaper-next aria-label="Change wallpaper">Change wallpaper</button>'
    : '';
  return `<div class="site-wallpaper" data-wallpaper-layer${inlineStyle} data-wallpaper-config="${escapeHtml(safeJsonForHtml(data))}" data-active-preset="${escapeHtml(initial)}" aria-hidden="true"></div>${controls}`;
}
