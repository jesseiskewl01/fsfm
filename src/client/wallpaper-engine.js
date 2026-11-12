(() => {
  'use strict';
  const layer = document.querySelector('[data-wallpaper-layer]');
  if (!layer) return;

  let config;
  try { config = JSON.parse(layer.getAttribute('data-wallpaper-config') || '{}'); }
  catch { return; }

  const catalogue = Array.isArray(config.catalog) ? config.catalog : [];
  const selected = Array.isArray(config.presets) && config.presets.length
    ? config.presets.map((p) => catalogue.find((item) => item.id === p.id)).filter(Boolean)
    : catalogue;
  const findPreset = (id) => catalogue.find((item) => item.id === id);
  let activeIndex = Math.max(0, selected.findIndex((item) => item.id === layer.dataset.activePreset));
  let timer = null;
  let pageVisible = !document.hidden;

  function safeImageUrl(value) {
    try {
      const url = new URL(value, document.baseURI);
      return url.protocol === 'https:' || url.origin === location.origin ? url.href : null;
    } catch { return null; }
  }

  function applyPreset(preset) {
    if (!preset) return;
    layer.dataset.activePreset = preset.id;
    const imageUrl = safeImageUrl(preset.imageUrl);
    layer.style.backgroundImage = preset.background || (imageUrl ? `url("${imageUrl}")` : '');
    layer.style.backgroundSize = config.fit === 'contain' ? 'contain' : 'cover';
    layer.style.backgroundPosition = config.position || 'center';
    if (config.fit === 'contain') layer.style.backgroundRepeat = 'no-repeat';
    layer.dataset.wallpaperKind = preset.kind || 'image';
    const palette = preset.palette || {};
    for (const [key, value] of Object.entries(palette)) {
      if (typeof value === 'string' && (/^#[0-9a-f]{3,8}$/i.test(value.trim()) || /^\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}(?:\s*,\s*(?:0|1|0?\.\d+))?$/.test(value.trim()))) {
        layer.style.setProperty(`--wallpaper-${key}`, value.includes(',') ? `rgb(${value})` : value);
      }
    }
  }

  function nextPreset() {
    if (selected.length < 2) return;
    if (config.cycle?.mode === 'random') {
      const choices = selected.map((_, i) => i).filter((i) => i !== activeIndex);
      activeIndex = choices[Math.floor(Math.random() * choices.length)];
    } else {
      activeIndex = (activeIndex + 1) % selected.length;
    }
    applyPreset(selected[activeIndex]);
  }

  function stop() {
    if (timer) window.clearInterval(timer);
    timer = null;
  }

  function start() {
    stop();
    const reduceMotion = config.respectReducedMotion !== false && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (!config.cycle?.enabled || selected.length < 2 || reduceMotion || !pageVisible) return;
    const seconds = Math.max(5, Math.min(3600, Number(config.cycle.intervalSeconds) || 30));
    timer = window.setInterval(nextPreset, seconds * 1000);
  }

  if (config.mode === 'custom') {
    const customUrl = safeImageUrl(config.customImage);
    if (customUrl) {
      layer.dataset.activePreset = 'custom';
      layer.style.backgroundImage = `url("${customUrl}")`;
      layer.style.backgroundSize = config.fit === 'contain' ? 'contain' : 'cover';
      layer.style.backgroundPosition = config.position || 'center';
      layer.style.backgroundRepeat = 'no-repeat';
    }
  } else if (config.mode === 'cycle') {
    if (config.initialSelection === 'random' && selected.length) activeIndex = Math.floor(Math.random() * selected.length);
    else {
      const idx = selected.findIndex((item) => item.id === config.initialSelection);
      if (idx >= 0) activeIndex = idx;
    }
    applyPreset(selected[activeIndex]);
  } else {
    const preset = findPreset(config.preset) || findPreset(layer.dataset.activePreset);
    applyPreset(preset);
  }

  document.querySelectorAll('[data-wallpaper-next]').forEach((button) => {
    button.addEventListener('click', nextPreset);
  });
  document.addEventListener('visibilitychange', () => {
    pageVisible = !document.hidden;
    if (pageVisible) start(); else stop();
  });
  start();
})();
