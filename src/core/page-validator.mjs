import fs from 'node:fs';
import path from 'node:path';
import { COMPONENTS } from '../components/registry.mjs';
import { TEMPLATES } from '../templates/registry.mjs';
import { routeForPage } from './page-routes.mjs';

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PRESET_IDS = new Set(['vista-violet-haze','vista-aqua-glass','vista-solar-flare','vista-rose-bloom','aurora','album-amber']);
const PRESENTATION_VARIANTS = new Set(['vista-window','vista-desktop','editorial','amber-editorial','amber-player','plain']);
const GROUP_LAYOUTS = new Set(['grid','stack','columns']);
const isRecord = value => value && typeof value === 'object' && !Array.isArray(value);
const getPath = (object, dotted) => dotted.split('.').reduce((value, key) => value?.[key], object);
const issue = (list, where, message) => list.push(`${where}: ${message}`);

export function validatePage(page, options = {}) {
  const problems = [];
  const where = options.label || page?.identity?.name || 'Unnamed page';
  if (!isRecord(page)) return [`${where}: page must be an object`];
  if (page.schemaVersion !== 1) issue(problems, where, 'schemaVersion must be 1');
  const template = TEMPLATES[page.template];
  if (!template) issue(problems, where, `unknown template "${page.template}"`);

  const identity = page.identity;
  if (!isRecord(identity)) issue(problems, where, 'identity object is required');
  else {
    if (!identity.name?.trim()) issue(problems, where, 'identity.name is required');
    try { routeForPage(page); } catch (error) { issue(problems, where, error.message); }
    if (page.template !== 'homepage' && !SLUG.test(identity.slug || '')) {
      issue(problems, where, 'identity.slug must use lowercase letters, numbers and hyphens');
    }
    if (!Number.isFinite(identity.order)) issue(problems, where, 'identity.order must be a number');
    const publishing = page.publishing;
    if (!isRecord(publishing)) issue(problems, where, 'publishing object is required');
    else {
      for (const key of ['published','showInNavigation']) {
        if (typeof publishing[key] !== 'boolean') issue(problems, where, `publishing.${key} must be true or false`);
      }
      if (publishing.showInNavigation && !publishing.navigationLabel?.trim()) issue(problems, where, 'navigationLabel is required when showInNavigation is enabled');
    }
    const appearance = page.appearance;
    if (!isRecord(appearance) || !isRecord(appearance.wallpaper)) issue(problems, where, 'appearance.wallpaper is required');
    else {
      const wallpaper = appearance.wallpaper;
      if (!['preset','custom','cycle','template-default'].includes(wallpaper.mode)) issue(problems, where, 'wallpaper.mode must be preset, custom, cycle or template-default');
      if (wallpaper.mode === 'preset' && !PRESET_IDS.has(wallpaper.preset)) issue(problems, where, `unknown wallpaper preset "${wallpaper.preset}"`);
      if (wallpaper.mode === 'custom' && !wallpaper.customImage) issue(problems, where, 'custom wallpaper requires customImage');
      if (wallpaper.mode === 'cycle') {
        if (!Array.isArray(wallpaper.presets) || wallpaper.presets.length === 0) issue(problems, where, 'wallpaper cycle needs at least one preset');
        for (const preset of wallpaper.presets || []) if (!PRESET_IDS.has(preset) || !preset.startsWith('vista-')) issue(problems, where, `invalid Vista cycle preset "${preset}"`);
        const cycle = wallpaper.cycle;
        if (!isRecord(cycle)) issue(problems, where, 'wallpaper.cycle settings are required');
        else {
          if (typeof cycle.enabled !== 'boolean') issue(problems, where, 'wallpaper.cycle.enabled must be boolean');
          if (!['sequential','random'].includes(cycle.mode)) issue(problems, where, 'wallpaper.cycle.mode must be sequential or random');
          if (!Number.isInteger(cycle.intervalSeconds) || cycle.intervalSeconds < 5 || cycle.intervalSeconds > 3600) issue(problems, where, 'wallpaper interval must be an integer between 5 and 3600 seconds');
        }
      }
    }
    const seo = page.seo;
    if (!isRecord(seo)) issue(problems, where, 'seo object is required');
    else {
      for (const key of ['title','description','canonical','socialImage']) if (typeof seo[key] !== 'string') issue(problems, where, `seo.${key} must be a string`);
      if (typeof seo.allowIndexing !== 'boolean') issue(problems, where, 'seo.allowIndexing must be boolean');
      if (seo.canonical && !/^https:\/\//i.test(seo.canonical)) issue(problems, where, 'canonical must be an HTTPS URL');
    }
  }

  if (['homepage', 'album'].includes(page.template) && !isRecord(page.templateData)) issue(problems, where, 'templateData object is required');
  else if (page.templateData !== undefined && !isRecord(page.templateData)) issue(problems, where, 'templateData must be an object when provided');
  if (!Array.isArray(page.sections)) issue(problems, where, 'sections must be an ordered array');
  else {
    const ids = new Set();
    const counts = new Map();
    for (const section of page.sections) {
      const sectionWhere = `${where} / ${section?.id || 'unnamed section'}`;
      if (!isRecord(section)) { issue(problems, where, 'every section must be an object'); continue; }
      if (!section.id || typeof section.id !== 'string') issue(problems, sectionWhere, 'section id is required');
      else if (ids.has(section.id)) issue(problems, sectionWhere, `duplicate section id "${section.id}"`);
      else ids.add(section.id);
      if (typeof section.enabled !== 'boolean') issue(problems, sectionWhere, 'enabled must be boolean');
      const component = COMPONENTS[section.type];
      if (!component) { issue(problems, sectionWhere, `unknown component type "${section.type}"`); continue; }
      if (template && !template.allowedComponentTypes.includes(section.type)) issue(problems, sectionWhere, `${section.type} is not available in the ${template.label} template`);
      if (!component.templates.includes(page.template)) issue(problems, sectionWhere, `${section.type} does not support the ${page.template} template`);
      counts.set(section.type, (counts.get(section.type) || 0) + 1);
      if (!isRecord(section.content)) issue(problems, sectionWhere, 'content object is required');
      const variant = section.presentation?.variant;
      if (variant && !PRESENTATION_VARIANTS.has(variant)) issue(problems, sectionWhere, `unknown presentation variant "${variant}"`);
      if (section.group?.id) {
        if (typeof section.group.id !== 'string' || !/^[a-z0-9_-]+$/i.test(section.group.id)) issue(problems, sectionWhere, 'layout group id must use letters, numbers, hyphens or underscores');
        if (!GROUP_LAYOUTS.has(section.group.layout || 'grid')) issue(problems, sectionWhere, 'layout group layout must be grid, stack or columns');
        const columns = Number(section.group.columns ?? 2);
        if (!Number.isInteger(columns) || columns < 1 || columns > 4) issue(problems, sectionWhere, 'layout group columns must be an integer between 1 and 4');
      }
      for (const required of component.required) {
        if (getPath(section, required) === undefined || getPath(section, required) === null || getPath(section, required) === '') issue(problems, sectionWhere, `required field ${required} is missing`);
      }
    }
    if (template) {
      for (const [type, min] of Object.entries(template.requiredComponents || {})) {
        const matching = page.sections.filter(section => section?.type === type);
        if (matching.length !== min) issue(problems, where, `${template.label} requires exactly ${min} ${type} component(s); found ${matching.length}`);
        if (matching.some(section => section.enabled !== true)) issue(problems, where, `${template.label} requires ${type} to remain enabled`);
      }
      for (const [type, component] of Object.entries(COMPONENTS)) {
        if (component.singleton && (counts.get(type) || 0) > 1 && !template.maximumComponents?.[type]) {
          issue(problems, where, `${template.label} allows only one ${type} component`);
        }
      }
      for (const [type, max] of Object.entries(template.maximumComponents || {})) {
        const count = counts.get(type) || 0;
        if (count > max) issue(problems, where, `${template.label} allows at most ${max} ${type} component(s); found ${count}`);
      }
      if (page.template === 'album') {
        const player = page.templateData?.player;
        if (!isRecord(player) || !Array.isArray(player.tracks) || (page.publishing?.published !== false && player.tracks.length === 0)) issue(problems, where, 'Published Album template requires at least one player track');
        else {
          const trackIds = new Set();
          player.tracks.forEach((track, index) => {
            const trackWhere = `${where} / track ${index + 1}`;
            if (!track.title?.trim()) issue(problems, trackWhere, 'track title is required');
            if (!track.id || trackIds.has(track.id)) issue(problems, trackWhere, 'track id is missing or duplicated');
            trackIds.add(track.id);
            const hasExternalAudio = typeof track.audioUrl === 'string' && track.audioUrl.trim().length > 0;
            const hasUploadedAudio = typeof track.audioFile === 'string' && track.audioFile.trim().length > 0;
            if (hasExternalAudio === hasUploadedAudio) issue(problems, trackWhere, 'provide exactly one audio source: an HTTPS audioUrl or an uploaded audioFile');
            if (hasExternalAudio && !/^https:\/\//i.test(track.audioUrl)) issue(problems, trackWhere, 'audioUrl must be HTTPS');
            if (hasUploadedAudio && (!track.audioFile.startsWith('/media/audio/') || track.audioFile.split(/[\/]/).includes('..'))) issue(problems, trackWhere, 'audioFile must be a safe path inside /media/audio/');
            if (!track.lyricsFile || path.isAbsolute(track.lyricsFile) || track.lyricsFile.split(/[\/]/).includes('..')) issue(problems, trackWhere, 'lyricsFile must be a safe repository-relative path');
            else if (options.root && !fs.existsSync(path.join(options.root, track.lyricsFile))) issue(problems, trackWhere, `lyrics file does not exist: ${track.lyricsFile}`);
            if (typeof track.instrumental !== 'boolean') issue(problems, trackWhere, 'instrumental flag must be boolean');
          });
        }
      }
    }
  }
  return problems;
}

export function validateSite(pages, options = {}) {
  const problems = [];
  const homes = pages.filter(page => page?.template === 'homepage');
  if (homes.length !== 1) issue(problems, 'Site', `exactly one Homepage record is required; found ${homes.length}`);
  const routeOwners = new Map();
  const slugOwners = new Map();
  for (const page of pages) {
    problems.push(...validatePage(page, options));
    const identity = page?.identity || {};
    try {
      const route = routeForPage(page);
      if (routeOwners.has(route)) issue(problems, 'Site', `route ${route} is shared by ${routeOwners.get(route)} and ${identity.name}`);
      routeOwners.set(route, identity.name || 'unnamed page');
    } catch { /* validatePage already reports invalid slugs/templates */ }
    if (page?.template !== 'homepage' && identity.slug) {
      if (slugOwners.has(identity.slug)) issue(problems, 'Site', `slug ${identity.slug} is shared by ${slugOwners.get(identity.slug)} and ${identity.name}`);
      slugOwners.set(identity.slug, identity.name || 'unnamed page');
    }
  }
  return problems;
}
