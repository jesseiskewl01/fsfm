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

/** Editor controls for every switchable page part. Declared part fields become
 *  a nested `content` object so studio editors and Tina see the same model. */
export function pagePartFieldsFor(template) {
  return Object.entries(PAGE_PARTS)
    .filter(([, definition]) => definition.templates.includes(template))
    .map(([name, definition]) => object(name, definition.label, [
      { type: 'boolean', name: 'enabled', label: 'Enabled', description: definition.description },
      ...(definition.fields?.length
        ? [object('content', 'Part content', definition.fields.map(toTinaField), 'Content owned by this part.')]
        : [])
    ], definition.description));
}

/** Effect controls. Boolean effects stay as direct toggles so the Tina schema
 *  matches the renderer's existing `appearance.effects` shape; mode effects get
 *  a nested object with the shared vocabulary. */
export function effectFields() {
  return Object.entries(EFFECTS).map(([name, definition]) => {
    if (definition.valueType === 'boolean') {
      return {
        type: 'boolean',
        name,
        label: definition.label,
        description: definition.description
      };
    }
    return object(
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
    );
  });
}

export { text, object as objectField };
