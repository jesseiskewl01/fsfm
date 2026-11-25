/** Renders page-level effect parts from shared definitions.
 *  Nothing here is keyed off `page.template` except the safe default mode.
 *  [OpenCode, 2026-11-22]
 */
import { ATMOSPHERE_MODES, EFFECTS, resolveEffectMode } from '../core/parts.mjs';
import { escapeHtml } from './html.mjs';

const CSS_LAYERS = '<div class="bloom-vignette" aria-hidden="true"></div><div class="album-grain" aria-hidden="true"></div>';

export function resolveAtmosphere(page) {
  const definition = EFFECTS.albumAtmosphere;
  const mode = resolveEffectMode('albumAtmosphere', page);
  const configured = page?.appearance?.effects?.albumAtmosphere !== undefined;
  // The effect is "active" when the template traditionally owns it or an
  // editor has explicitly configured it. This keeps unrelated templates
  // byte-for-byte unchanged while still making the part portable.
  const active = definition.templates.includes(page?.template) || configured;
  return {
    mode,
    active,
    enabled: active && mode !== 'off',
    definition,
    label: ATMOSPHERE_MODES[mode].label
  };
}

/** The atmosphere is a portable part: any page may opt in via
 *  appearance.effects.albumAtmosphere.mode. No config means the historical
 *  behaviour (album pages on, everything else untouched). */
export function renderAtmosphere(page) {
  const { mode, active } = resolveAtmosphere(page);
  if (!active) return { html: '', scripts: [], mode, active };
  if (mode === 'off') return { html: CSS_LAYERS, scripts: [], mode, active };
  const canvas = `<canvas id="nebulaCanvas" class="album-atmosphere" data-atmosphere-mode="${escapeHtml(mode)}" aria-hidden="true"></canvas>`;
  return {
    html: canvas + CSS_LAYERS,
    scripts: [EFFECTS.albumAtmosphere.script],
    mode,
    active
  };
}
