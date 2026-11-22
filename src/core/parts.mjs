/** FSFM part definitions — the shared source of truth.
 *
 *  Conversation term: "part". Code terms: "component", "effect", "chrome".
 *
 *  This module is the seed of the single definition layer (Roadmap Phase 5).
 *  Editor controls, validation, renderer registration and template allowances
 *  are derived from these definitions so they cannot drift apart.
 *
 *  [OpenCode, 2026-11-22]
 */
import { COMPONENTS as COMPONENT_REGISTRY } from '../components/registry.mjs';

/** Display metadata for every supported album-atmosphere mode. */
export const ATMOSPHERE_MODES = Object.freeze({
  full: {
    label: 'Full',
    description: 'The complete amber aurora: drifting curtains, blooms, horizon haze and stars.'
  },
  lite: {
    label: 'Lite',
    description: 'Same palette and movement with a reduced canvas workload: fewer stars, curtains and soft-passes.'
  },
  off: {
    label: 'Off',
    description: 'No animated canvas. The amber wallpaper, vignette and grain remain.'
  }
});

/** Page-level effects are parts too — they can be enabled on any template. */
export const EFFECTS = Object.freeze({
  albumAtmosphere: {
    label: 'Album atmosphere',
    category: 'effect',
    templates: ['album'],
    portableTo: ['homepage', 'album', 'vista-window', 'editorial'],
    path: 'appearance.effects.albumAtmosphere.mode',
    defaultForTemplate: { album: 'full' },
    default: 'off',
    modes: Object.freeze(Object.keys(ATMOSPHERE_MODES)),
    script: 'album-atmosphere.js',
    required: []
  }
});

/** The 18 visual parts. Re-exported here so all consumers share one import path.
 *  Field-level definitions are folded in during Phase 5; the contract is already
 *  authoritative for type, label, templates, singleton rules and required fields. */
export const COMPONENTS = COMPONENT_REGISTRY;

export const PART_CATEGORIES = Object.freeze(['component', 'effect', 'chrome']);

export function getComponent(type) {
  return COMPONENTS[type] ?? null;
}

export function getEffect(name) {
  return EFFECTS[name] ?? null;
}

export function getPart(type, category = 'component') {
  if (category === 'effect') return getEffect(type);
  if (category === 'component') return getComponent(type);
  return null;
}

/** Resolve an effect mode from a page record, falling back to the template default. */
export function resolveEffectMode(effectName, page) {
  const effect = getEffect(effectName);
  if (!effect) return 'off';
  const configured = page?.appearance?.effects?.[effectName];
  const requested = typeof configured === 'string' ? configured : configured?.mode;
  if (effect.modes.includes(requested)) return requested;
  return effect.defaultForTemplate[page?.template] ?? effect.default;
}
