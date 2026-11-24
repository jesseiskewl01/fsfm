/** Plain-JSON control catalogue shared by Studio and Tina.
 *
 *  This is a browser-safe projection of `parts.mjs`: no functions, no class
 *  instances, no secrets. Anything an editor can see is declared here once.
 *
 *  [OpenCode, 2026-11-22]
 */
import {
  ALL_PARTS,
  CHROME_PARTS,
  EFFECTS,
  GROUP_LAYOUTS,
  PAGE_PARTS,
  PART_CATEGORIES,
  PRESENTATION_BACKGROUNDS,
  PRESENTATION_PADDINGS,
  PRESENTATION_VARIANTS,
  SHELL_PARTS,
  listParts
} from './parts.mjs';
import { TEMPLATES } from '../templates/registry.mjs';

function plain(part) {
  return {
    name: part.type || part.name,
    label: part.label,
    category: part.category,
    description: part.description || '',
    templates: [...(part.templates || [])],
    ...(part.path ? { path: part.path } : {}),
    ...(part.default !== undefined ? { default: part.default } : {}),
    ...(part.fields ? { fields: part.fields } : {}),
    ...(part.modes ? { modes: part.modes } : {}),
    ...(part.valueType ? { valueType: part.valueType } : {}),
    ...(part.singleton ? { singleton: true } : {}),
    ...(part.required ? { required: [...part.required] } : {})
  };
}

const asRecord = (source) => Object.fromEntries(Object.entries(source).map(([name, part]) => [name, plain(part)]));

/** The complete, serialisable definition of every editor control. */
export function partCatalogue() {
  return {
    categories: [...PART_CATEGORIES],
    parts: listParts().map(plain),
    chromeParts: asRecord(CHROME_PARTS),
    shellParts: asRecord(SHELL_PARTS),
    effects: asRecord(EFFECTS),
    pageParts: asRecord(PAGE_PARTS),
    templates: Object.fromEntries(Object.entries(TEMPLATES).map(([name, template]) => [name, {
      label: template.label,
      allowedComponentTypes: [...template.allowedComponentTypes],
      requiredComponents: { ...template.requiredComponents },
      maximumComponents: { ...template.maximumComponents }
    }])),
    vocabularies: {
      presentationVariants: [...PRESENTATION_VARIANTS],
      presentationPaddings: [...PRESENTATION_PADDINGS],
      presentationBackgrounds: [...PRESENTATION_BACKGROUNDS],
      groupLayouts: [...GROUP_LAYOUTS]
    },
    total: Object.keys(ALL_PARTS).length
  };
}
