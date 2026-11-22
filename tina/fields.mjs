/** Tina field definitions derived from the shared part catalogue.
 *  No field vocabulary is written here by hand — `src/core/parts.mjs` owns it.
 *  [OpenCode, 2026-11-22]
 */
import {
  COMPONENTS,
  EFFECTS,
  GROUP_LAYOUTS,
  PAGE_PARTS,
  PRESENTATION_BACKGROUNDS,
  PRESENTATION_PADDINGS,
  PRESENTATION_VARIANTS,
  allowedComponentsFor
} from '../src/core/parts.mjs';

const text = (name, label) => ({ type: 'string', name, label });
const object = (name, label, fields, description) => ({
  type: 'object',
  name,
  label,
  fields,
  ...(description ? { description } : {})
});

/** Convert one part field into the equivalent Tina field. */
export function toTinaField(field) {
  const base = {
    name: field.name,
    label: field.label,
    ...(field.required ? { required: true } : {}),
    ...(field.description ? { description: field.description } : {})
  };
  switch (field.type) {
    case 'textarea':
      return { ...base, type: 'string', ui: { component: 'textarea' } };
    case 'url':
    case 'string':
      return { ...base, type: 'string' };
    case 'number':
      return { ...base, type: 'number', ...(field.min !== undefined ? { min: field.min } : {}), ...(field.max !== undefined ? { max: field.max } : {}) };
    case 'boolean':
      return { ...base, type: 'boolean' };
    case 'image':
      return { ...base, type: 'image' };
    case 'select':
      return { ...base, type: 'string', options: [...field.options] };
    case 'object':
      return object(field.name, field.label, (field.fields || []).map(toTinaField), field.description);
    case 'array': {
      if (field.itemType === 'object') {
        return {
          ...base,
          type: 'object',
          list: true,
          fields: (field.itemFields || []).map(toTinaField),
          ui: { itemProps: (item) => ({ label: item?.label || item?.title || 'New item' }) }
        };
      }
      return { ...base, type: field.itemType === 'image' ? 'image' : 'string', list: true };
    }
    default:
      return { ...base, type: 'string' };
  }
}

/** One content field per distinct field name across the template's parts. */
export function unionContentFields(template) {
  const seen = new Map();
  for (const type of allowedComponentsFor(template)) {
    for (const field of COMPONENTS[type]?.fields || []) {
      if (!seen.has(field.name)) seen.set(field.name, toTinaField(field));
    }
  }
  return [...seen.values()];
}

export const sectionTypesFor = (template) => allowedComponentsFor(template);

export const presentationOptions = PRESENTATION_VARIANTS.filter(Boolean);
export const presentationPaddingOptions = [...PRESENTATION_PADDINGS];
export const presentationBackgroundOptions = [...PRESENTATION_BACKGROUNDS];

export const groupLayoutOptions = [...GROUP_LAYOUTS];

/** Editor toggles for every switchable page part, grouped by definition. */
export function pagePartFieldsFor(template) {
  return Object.entries(PAGE_PARTS)
    .filter(([, definition]) => definition.templates.includes(template))
    .map(([name, definition]) => object(name, definition.label, [
      { type: 'boolean', name: 'enabled', label: 'Enabled', description: definition.description }
    ], definition.description));
}

/** Effect controls, including the aurora's full / lite / off choice. */
export function effectFields() {
  return Object.entries(EFFECTS).map(([name, definition]) => object(
    name,
    definition.label,
    [{
      type: 'string',
      name: 'mode',
      label: 'Mode',
      options: [...definition.modes],
      description: definition.description
    }],
    definition.description
  ));
}

export { text, object as objectField };
