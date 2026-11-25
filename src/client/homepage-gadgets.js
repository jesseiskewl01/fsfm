'use strict';

// A small Vista-style reset icon at the bottom of the gadget area. It clears
// only saved gadget positions, never content or settings. [Jesse + OpenCode, 2026-11-24]
(function() {
  var STORAGE_KEY = 'fsfm_gadget_positions_v2';
  var LEGACY_STORAGE_KEY = 'fsfm_gadget_positions_v1';
  function installResetButton() {
    var host = document.querySelector('.fsfm-gadgets-extras');
    if (!host || document.getElementById('fsfmGadgetReset')) return;
    var bar = document.createElement('div');
    bar.className = 'fsfm-gadget-reset';
    bar.innerHTML = '<button type="button" id="fsfmGadgetReset" class="gadget-reset-button" aria-label="Reset gadget positions" title="Reset gadget positions"><span aria-hidden="true">↺</span></button>';
    host.appendChild(bar);
    var button = document.getElementById('fsfmGadgetReset');
    button.addEventListener('click', function() {
      try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(LEGACY_STORAGE_KEY);
      } catch (e) {}
      window.dispatchEvent(new CustomEvent('fsfm:reset-gadgets'));
      button.classList.add('is-resetting');
      window.setTimeout(function() { button.classList.remove('is-resetting'); }, 600);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installResetButton);
  else installResetButton();
})();

// Spotify's black embed has its own rounded edge. Its exposed corners need the
// two-tone player colors, so paint them at runtime without touching saved HTML.
// [Jesse + OpenCode, 2026-11-24]
(function() {
  var EMBED_URL = 'https://open.spotify.com/embed/artist/2PcGMMcKTObTrK7XVw9GSX?utm_source=generator&theme=0&si=5263054ac6d0459f';
  var CORNERS = [
    { name: 'tl', color: '#1F1F1F', css: 'left:0;top:0' },
    { name: 'tr', color: '#1F1F1F', css: 'right:0;top:0' },
    { name: 'bl', color: '#121212', css: 'left:0;bottom:0' },
    { name: 'br', color: '#121212', css: 'right:0;bottom:0' }
  ];
  function installSpotifyCorners() {
    var body = document.querySelector('.spotify-window-body');
    var iframe = body && body.querySelector('iframe');
    if (!body || !iframe) return;
    if (iframe.getAttribute('src') !== EMBED_URL) iframe.setAttribute('src', EMBED_URL);
    iframe.setAttribute('style', 'border-radius:12px');
    body.style.background = 'linear-gradient(#1F1F1F 0 50%, #121212 50% 100%)';
    Array.prototype.slice.call(body.querySelectorAll('.fsfm-spotify-corner')).forEach(function(node) { node.remove(); });
    CORNERS.forEach(function(corner) {
      var square = document.createElement('div');
      square.className = 'fsfm-spotify-corner';
      square.setAttribute('data-corner', corner.name);
      square.setAttribute('style', 'position:absolute;width:15px;height:15px;pointer-events:none;z-index:2;background:' + corner.color + ';' + corner.css);
      body.appendChild(square);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installSpotifyCorners);
  else installSpotifyCorners();
})();

(function() {
  var layer = document.getElementById('fsfmGadgets');
  if (!layer) return;
  // CSS still hides gadgets on small screens, but the viewport can grow after
  // load. Keep the runtime alive and lay out whenever desktop space exists.
  // [Jesse + OpenCode, 2026-11-24]
  var desktopQuery = window.matchMedia('(min-width: 1180px) and (min-height: 600px)');

  var STORAGE_KEY = 'fsfm_gadget_positions_v2';
  var LEGACY_STORAGE_KEY = 'fsfm_gadget_positions_v1';
  var gadgetConfig = {};
  try { gadgetConfig = JSON.parse((document.getElementById('fsfmGadgetConfig') || {}).textContent || '{}'); } catch (e) { gadgetConfig = {}; }
  var widgets = Array.prototype.slice.call(layer.querySelectorAll('.fsfm-gadget'));
  var positions = {};
  var customPositions = {};
  var storedPositions = {};
  var storedV2 = false;

  try {
    var currentSave = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (currentSave && currentSave.version === 2) {
      storedPositions = currentSave.positions || {};
      customPositions = currentSave.custom || {};
      storedV2 = true;
    } else {
      storedPositions = JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY) || '{}') || {};
    }
  } catch (e) { storedPositions = {}; customPositions = {}; }

  var COLLISION_GAP = 12;
  var REGION_GAP = 16;
  var COLUMN_GAP = 24;
  var ROW_GAP = 32;

  function clampWidget(widget, x, y) {
    var maxX = Math.max(8, window.innerWidth - widget.offsetWidth - 8);
    var maxY = Math.max(48, window.innerHeight - widget.offsetHeight - 8);
    return { x: Math.min(Math.max(8, x), maxX), y: Math.min(Math.max(48, y), maxY) };
  }

  function computeDesktopLayout() {
    // Widgets live in the gutters between the website edges and the hero edges.
    // [Jesse + OpenCode, 2026-11-24]
    var hero = document.querySelector('.hero-window') || document.querySelector('.wrap');
    var heroRect = hero ? hero.getBoundingClientRect() : null;
    var viewportWidth = document.documentElement.clientWidth || window.innerWidth;
    var viewportHeight = window.innerHeight;
    var mainWidth = 184;
    var edge = 8;
    var heroLeft = heroRect ? Math.round(heroRect.left) : Math.round(viewportWidth * 0.27);
    var heroRight = heroRect ? Math.round(heroRect.right) : Math.round(viewportWidth * 0.73);
    var leftRegion = { start:edge, end:Math.max(edge + mainWidth, heroLeft - REGION_GAP) };
    var rightRegion = { start:Math.min(viewportWidth - edge - mainWidth, heroRight + REGION_GAP), end:viewportWidth - edge };

    function columnsFor(region) {
      var width = region.end - region.start;
      if (width >= (mainWidth * 2) + COLUMN_GAP + (edge * 2)) {
        var start = region.start + Math.floor((width - (mainWidth * 2) - COLUMN_GAP) / 2);
        return [start, start + mainWidth + COLUMN_GAP];
      }
      return [region.start + Math.max(0, Math.floor((width - mainWidth) / 2))];
    }

    var leftColumns = columnsFor(leftRegion);
    var rightColumns = columnsFor(rightRegion);
    var leftPaired = leftColumns.length > 1;
    var rightPaired = rightColumns.length > 1;
    var topRow = viewportHeight < 720 ? 48 : 72;
    function height(id, fallback) {
      var widget = widgetById[id];
      return widget ? widget.offsetHeight : fallback;
    }
    var clockHeight = height('gadget-clock', 191);
    var nowHeight = height('gadget-now-playing', 127);
    var datesHeight = height('gadget-dates', 85);
    var calendarHeight = height('gadget-calendar', 241);
    var photosHeight = height('gadget-photos', 183);
    var noteHeight = height('gadget-note', 124);

    // Three shared rows: outside / inside / outside on each side. Clock and dates
    // hug the left gutter, featured release steps toward the hero; calendar and
    // sticky note hug the right gutter, picture steps toward the hero.
    // [Jesse + OpenCode, 2026-11-24]
    var rowHeights = [
      Math.max(clockHeight, calendarHeight),
      Math.max(nowHeight, photosHeight),
      Math.max(datesHeight, noteHeight)
    ];
    var stackedHeight = rowHeights[0] + rowHeights[1] + rowHeights[2];
    var availableHeight = Math.max(0, viewportHeight - 8 - topRow);
    var rowGap = ROW_GAP;
    if (stackedHeight + rowGap * 2 > availableHeight) {
      // A small vertical stagger is safe only when the two columns are separate;
      // their 24px horizontal gap still clears the 12px collision gap.
      var minGap = leftPaired && rightPaired ? -4 : COLLISION_GAP;
      rowGap = Math.max(minGap, Math.floor((availableHeight - stackedHeight) / 2));
    }
    var rows = [
      topRow,
      topRow + rowHeights[0] + rowGap,
      topRow + rowHeights[0] + rowHeights[1] + rowGap * 2
    ];
    var leftOuter = leftColumns[0];
    var leftInner = leftColumns[leftPaired ? 1 : 0];
    var rightInner = rightColumns[0];
    var rightOuter = rightColumns[rightPaired ? 1 : 0];

    return {
      'gadget-clock': [leftOuter, rows[0]],
      'gadget-now-playing': [leftInner, rows[1]],
      'gadget-dates': [leftOuter, rows[2]],
      'gadget-calendar': [rightOuter, rows[0]],
      'gadget-photos': [rightInner, rows[1]],
      'gadget-note': [rightOuter, rows[2]]
    };
  }

  var legacyDefaults = {
    'gadget-clock': { x: 16, y: 82 },
    'gadget-now-playing': { x: 16, y: 286 },
    'gadget-dates': { x: 16, y: 440 },
    'gadget-calendar': { side: 'right', y: 82 },
    'gadget-photos': { side: 'right', y: 335 },
    'gadget-note': { side: 'right', y: 532 },
    'gadget-barrel-roll': { x: 16, y: 625 },
    'gadget-bubbles': { x: 210, y: 82 },
    'gadget-radio': { x: 210, y: 235 },
    'gadget-purble': { side: 'right', y: 680 }
  };

  function isLegacyDefault(widget, saved) {
    var legacy = legacyDefaults[widget.id];
    if (!legacy || !Array.isArray(saved) || !Number.isFinite(saved[0]) || !Number.isFinite(saved[1])) return false;
    var expectedX = legacy.side === 'right' ? window.innerWidth - widget.offsetWidth - 16 : legacy.x;
    return Math.abs(saved[0] - expectedX) <= 8 && Math.abs(saved[1] - legacy.y) <= 8;
  }

  var widgetById = {};
  widgets.forEach(function(widget) { widgetById[widget.id] = widget; });

  var defaultPositions = computeDesktopLayout();
  Object.keys(gadgetConfig.positions || {}).forEach(function(id) {
    var pos = gadgetConfig.positions[id];
    if (Array.isArray(pos) && pos.length >= 2 && Number.isFinite(Number(pos[0])) && Number.isFinite(Number(pos[1]))) {
      defaultPositions[id] = [Number(pos[0]), Number(pos[1])];
    }
  });
  resolveWidgetCollisions(defaultPositions);

  function boxesOverlap(a, b, gap) {
    var spacing = Number(gap) || 0;
    return a.x < b.x + b.width + spacing &&
      a.x + a.width + spacing > b.x &&
      a.y < b.y + b.height + spacing &&
      a.y + a.height + spacing > b.y;
  }

  function resolveWidgetCollisions(layout) {
    var occupied = [];
    var primaryIds = [
      'gadget-clock', 'gadget-now-playing', 'gadget-dates',
      'gadget-calendar', 'gadget-photos', 'gadget-note'
    ];
    var bonusIds = [
      'gadget-barrel-roll', 'gadget-bubbles', 'gadget-radio', 'gadget-purble'
    ];

    primaryIds.forEach(function(id) {
      var widget = widgetById[id], point = layout[id];
      if (!widget || widget.hidden || !point) return;
      occupied.push({ x:point[0], y:point[1], width:widget.offsetWidth, height:widget.offsetHeight });
    });

    bonusIds.forEach(function(id) {
      var widget = widgetById[id], point = layout[id];
      if (!widget || widget.hidden || !point) return;
      var candidate = { x:point[0], y:point[1], width:widget.offsetWidth, height:widget.offsetHeight };
      var attempts = 0;
      while (occupied.some(function(other) { return boxesOverlap(candidate, other, COLLISION_GAP); }) && attempts < 24) {
        candidate.y += 24;
        if (candidate.y + candidate.height > window.innerHeight - 8) {
          candidate.y = Math.max(48, point[1] - 36);
          candidate.x += 24;
        }
        if (candidate.x + candidate.width > window.innerWidth - 8) {
          candidate.x = Math.max(8, point[0] - 24);
        }
        attempts += 1;
      }
      layout[id] = [candidate.x, candidate.y];
      occupied.push(candidate);
    });
    return layout;
  }

  if (desktopQuery.matches) {
    widgets.forEach(function(widget) {
      var saved = storedPositions[widget.id];
      if (storedV2) {
        customPositions[widget.id] = customPositions[widget.id] === true;
      } else {
        customPositions[widget.id] = !!(saved && !isLegacyDefault(widget, saved));
      }
      var configured = gadgetConfig.positions && gadgetConfig.positions[widget.id];
      var fallback = defaultPositions[widget.id] || [16, 90];
      var useSaved = customPositions[widget.id] && saved && Number.isFinite(saved[0]) && Number.isFinite(saved[1]);
      var x = useSaved ? saved[0] : (configured ? Number(configured[0]) : fallback[0]);
      var y = useSaved ? saved[1] : (configured ? Number(configured[1]) : fallback[1]);
      applyInitialPosition(widget, x, y);
    });

    settleWidgets(null);
  }

  function applyInitialPosition(widget, x, y) {
    var p = clampWidget(widget, x, y);
    widget.style.left = p.x + 'px';
    widget.style.top = p.y + 'px';
    positions[widget.id] = [p.x, p.y];
  }

  function applyPosition(widget, x, y) {
    var p = clampWidget(widget, x, y);
    widget.style.left = p.x + 'px';
    widget.style.top = p.y + 'px';
    positions[widget.id] = [p.x, p.y];
  }

  function savePositions() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        version: 2,
        positions: positions,
        custom: customPositions
      }));
    } catch (e) {}
  }

  // Keep the held widget where the user dropped it, then move everything else
  // until no two visible widgets share the same space. [Jesse + OpenCode, 2026-11-24]
  function settleWidgets(anchor) {
    var movable = widgets.filter(function(widget) {
      return !widget.hidden && !!widget.querySelector('[data-drag-handle]');
    });
    movable.sort(function(a, b) {
      if (a === anchor) return -1;
      if (b === anchor) return 1;
      var ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
      return ra.top - rb.top || ra.left - rb.left;
    });

    var placed = [];
    movable.forEach(function(widget) {
      var rect = widget.getBoundingClientRect();
      var box = { x:rect.left, y:rect.top, width:rect.width, height:rect.height };
      var originalX = box.x, originalY = box.y;
      var attempts = 0;
      while (placed.some(function(other) { return boxesOverlap(box, other, COLLISION_GAP); }) && attempts < 48) {
        var blocker = placed.filter(function(other) { return boxesOverlap(box, other, COLLISION_GAP); })[0];
        var candidates = [
          { x:box.x, y:blocker.y + blocker.height + COLLISION_GAP },
          { x:box.x, y:blocker.y - box.height - COLLISION_GAP },
          { x:blocker.x + blocker.width + COLLISION_GAP, y:box.y },
          { x:blocker.x - box.width - COLLISION_GAP, y:box.y },
          { x:box.x, y:box.y + 24 },
          { x:box.x + 24, y:box.y },
          { x:box.x, y:box.y - 24 },
          { x:box.x - 24, y:box.y }
        ];
        var best = null;
        candidates.forEach(function(candidate) {
          var point = clampWidget(widget, candidate.x, candidate.y);
          var trial = { x:point.x, y:point.y, width:box.width, height:box.height };
          if (placed.some(function(other) { return boxesOverlap(trial, other, COLLISION_GAP); })) return;
          var distance = Math.abs(point.x - originalX) + Math.abs(point.y - originalY);
          if (!best || distance < best.distance) best = { x:point.x, y:point.y, distance:distance };
        });
        if (best) {
          box.x = best.x;
          box.y = best.y;
        } else {
          var fallback = clampWidget(widget, box.x, box.y + 24);
          box.x = fallback.x;
          box.y = fallback.y;
        }
        attempts += 1;
      }
      applyPosition(widget, box.x, box.y);
      placed.push({ x:box.x, y:box.y, width:box.width, height:box.height });
    });
  }

  // A held widget nudges a hit widget by the smallest amount that clears it,
  // along the drag direction. The soft glow and settle still apply on release.
  // [Jesse + OpenCode, 2026-11-24]
  function pushOverlappingWidgets(held, dx, dy) {
    if (!dx && !dy) return;
    var gap = COLLISION_GAP;
    for (var pass = 0; pass < 2; pass += 1) {
      var heldRect = held.getBoundingClientRect();
      var heldBox = { x:heldRect.left, y:heldRect.top, width:heldRect.width, height:heldRect.height };
      var moved = false;
      widgets.forEach(function(other) {
        if (other === held || other.hidden || !other.querySelector('[data-drag-handle]')) return;
        var rect = other.getBoundingClientRect();
        var box = { x:rect.left, y:rect.top, width:rect.width, height:rect.height };
        if (!boxesOverlap(heldBox, box, gap)) return;
        var stored = positions[other.id] || [rect.left, rect.top];
        var clearX = dx > 0 ? heldBox.x + heldBox.width + gap - box.x : box.x + box.width + gap - heldBox.x;
        var clearY = dy > 0 ? heldBox.y + heldBox.height + gap - box.y : box.y + box.height + gap - heldBox.y;
        var nx = stored[0], ny = stored[1];
        if (Math.abs(dx) >= Math.abs(dy) && clearX > 0) nx += dx > 0 ? clearX : -clearX;
        else if (clearY > 0) ny += dy > 0 ? clearY : -clearY;
        else if (clearX > 0) nx += dx > 0 ? clearX : -clearX;
        if (nx === stored[0] && ny === stored[1]) return;
        applyPosition(other, nx, ny);
        // A pushed widget is not a user-placed widget: reflow may restore it.
        other.classList.add('gadget-pushed');
        if (other._pushTimer) clearTimeout(other._pushTimer);
        other._pushTimer = setTimeout(function() { other.classList.remove('gadget-pushed'); other._pushTimer = null; }, 240);
        moved = true;
      });
      if (!moved) break;
    }
  }

  widgets.forEach(function(widget) {
    var handle = widget.querySelector('[data-drag-handle]');
    if (!handle) return;
    var drag = null;
    handle.addEventListener('pointerdown', function(event) {
      if (event.button !== 0 || event.target.closest('button,select,a,input')) return;
      var rect = widget.getBoundingClientRect();
      drag = { pointerId:event.pointerId, startX:event.clientX, startY:event.clientY, lastX:event.clientX, lastY:event.clientY, left:rect.left, top:rect.top };
      widget.classList.add('is-dragging');
      widget.style.zIndex = '80';
      widgets.forEach(function(other) { if (other !== widget) other.style.zIndex = '35'; });
      try { handle.setPointerCapture(event.pointerId); } catch (e) {}
      event.preventDefault();
    });
    handle.addEventListener('pointermove', function(event) {
      if (!drag || event.pointerId !== drag.pointerId) return;
      customPositions[widget.id] = true;
      var dx = event.clientX - drag.lastX, dy = event.clientY - drag.lastY;
      drag.lastX = event.clientX; drag.lastY = event.clientY;
      applyPosition(widget, drag.left + event.clientX - drag.startX, drag.top + event.clientY - drag.startY);
      pushOverlappingWidgets(widget, dx, dy);
    });
    function endDrag(event) {
      if (!drag || (event && event.pointerId !== drag.pointerId)) return;
      drag = null;
      widget.classList.remove('is-dragging');
      settleWidgets(widget);
      savePositions();
    }
    handle.addEventListener('pointerup', endDrag);
    handle.addEventListener('pointercancel', endDrag);
    handle.addEventListener('keydown', function(event) {
      var step = event.shiftKey ? 30 : 10;
      var rect = widget.getBoundingClientRect();
      var x = rect.left, y = rect.top;
      if (event.key === 'ArrowLeft') x -= step;
      else if (event.key === 'ArrowRight') x += step;
      else if (event.key === 'ArrowUp') y -= step;
      else if (event.key === 'ArrowDown') y += step;
      else return;
      event.preventDefault();
      customPositions[widget.id] = true;
      var beforeX = rect.left, beforeY = rect.top;
      applyPosition(widget, x, y);
      pushOverlappingWidgets(widget, x - beforeX, y - beforeY);
      settleWidgets(widget);
      savePositions();
    });
  });

  var resizeFrame = 0;
  function reflowDesktopWidgets() {
    resizeFrame = 0;
    defaultPositions = computeDesktopLayout();
    Object.keys(gadgetConfig.positions || {}).forEach(function(id) {
      var pos = gadgetConfig.positions[id];
      if (Array.isArray(pos) && pos.length >= 2 && Number.isFinite(Number(pos[0])) && Number.isFinite(Number(pos[1]))) {
        defaultPositions[id] = [Number(pos[0]), Number(pos[1])];
      }
    });
    resolveWidgetCollisions(defaultPositions);
    widgets.forEach(function(widget) {
      if (customPositions[widget.id]) {
        var rect = widget.getBoundingClientRect();
        applyPosition(widget, rect.left, rect.top);
      } else {
        var target = defaultPositions[widget.id] || [16, 90];
        applyPosition(widget, target[0], target[1]);
      }
    });
    settleWidgets(null);
    // Reflow is layout repair, not a user move: never persist clamped positions.
  }
  // The reset icon clears storage first; restore the computed spawn points
  // without writing them back. [Jesse + OpenCode, 2026-11-24]
  window.addEventListener('fsfm:reset-gadgets', function() {
    customPositions = {};
    storedPositions = {};
    storedV2 = false;
    reflowDesktopWidgets();
  });
  function scheduleDesktopReflow() {
    if (!desktopQuery.matches) return;
    if (resizeFrame) cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(reflowDesktopWidgets);
  }
  window.addEventListener('resize', scheduleDesktopReflow, { passive: true });
  if (desktopQuery.addEventListener) desktopQuery.addEventListener('change', scheduleDesktopReflow);
  else if (desktopQuery.addListener) desktopQuery.addListener(scheduleDesktopReflow);

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(scheduleDesktopReflow);
  }

  // Clock
  function updateClock() {
    var now = new Date();
    var seconds = now.getSeconds(), minutes = now.getMinutes(), hours = now.getHours() % 12;
    var hour = document.getElementById('clockHour');
    var minute = document.getElementById('clockMinute');
    var second = document.getElementById('clockSecond');
    if (hour) hour.setAttribute('transform', 'rotate(' + (hours * 30 + minutes * .5) + ')');
    if (minute) minute.setAttribute('transform', 'rotate(' + (minutes * 6 + seconds * .1) + ')');
    if (second) second.setAttribute('transform', 'rotate(' + (seconds * 6) + ')');
    var digital = document.getElementById('clockDigital');
    if (digital) digital.textContent = now.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'});
  }
  updateClock(); window.setInterval(updateClock, 1000);

  // CMS data: this file is edited by Pages CMS, not by visitors' browsers.
  var cmsData = Object.assign({ photos:[], dates:[], stickyNote:{text:''}, funWidgets:{showBarrelRoll:true,showBubbleSlider:true,showMusicPlayer:true,showPurblePlace:true}, visibility:{} }, gadgetConfig);
  function safeLocalImage(path) {
    if (typeof path !== 'string' || !path.trim()) return null;
    var raw = path.trim();
    try {
      var base = new URL(document.baseURI);
      var url = new URL(raw, base);
      if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
      if (url.origin !== base.origin && !/^https?:\/\//i.test(raw)) return null;
      return url.href;
    } catch (e) { return null; }
  }
  function parseLocalDate(value) {
    if (typeof value !== 'string') return null;
    var match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
    if (!match) return null;
    var d = new Date(Number(match[1]), Number(match[2])-1, Number(match[3]));
    return Number.isNaN(d.getTime()) ? null : d;
  }
  var events = [];
  var calendarMonth = new Date(); calendarMonth.setDate(1);
  function renderCalendar() {
    var monthLabel = document.getElementById('calendarMonth');
    var daysNode = document.getElementById('calendarDays');
    if (!monthLabel || !daysNode) return;
    monthLabel.textContent = calendarMonth.toLocaleDateString(undefined, {month:'long',year:'numeric'});
    var year = calendarMonth.getFullYear(), month = calendarMonth.getMonth();
    var firstDay = new Date(year, month, 1).getDay();
    var count = new Date(year, month + 1, 0).getDate();
    var previousCount = new Date(year, month, 0).getDate();
    var eventKeys = {};
    events.forEach(function(event) { if (event.dateObj) eventKeys[event.dateObj.getFullYear()+'-'+event.dateObj.getMonth()+'-'+event.dateObj.getDate()] = true; });
    var today = new Date();
    var cells = [];
    for (var i=0; i<42; i++) {
      var day, d, outside = false;
      if (i < firstDay) { day = previousCount - firstDay + i + 1; d = new Date(year, month-1, day); outside = true; }
      else if (i >= firstDay + count) { day = i - firstDay - count + 1; d = new Date(year, month+1, day); outside = true; }
      else { day = i - firstDay + 1; d = new Date(year, month, day); }
      var key = d.getFullYear()+'-'+d.getMonth()+'-'+d.getDate();
      var classes = 'calendar-day' + (outside ? ' is-outside' : '') + (!outside && d.toDateString() === today.toDateString() ? ' is-today' : '') + (eventKeys[key] ? ' has-event' : '');
      cells.push('<span class="'+classes+'">'+day+'</span>');
    }
    daysNode.innerHTML = cells.join('');
  }
  Array.prototype.forEach.call(document.querySelectorAll('[data-calendar-step]'), function(button) {
    button.addEventListener('click', function() { calendarMonth.setMonth(calendarMonth.getMonth() + Number(button.getAttribute('data-calendar-step'))); renderCalendar(); });
  });
  function renderPhotos() {
    var image = document.getElementById('gadgetPhoto');
    var empty = document.getElementById('photoEmpty');
    var counter = document.getElementById('photoCounter');
    var photos = Array.isArray(cmsData.photos) ? cmsData.photos.map(safeLocalImage).filter(Boolean) : [];
    window.__fsfmPhotos = photos;
    var index = window.__fsfmPhotoIndex || 0;
    if (!photos.length) {
      if (image) { image.hidden = true; image.removeAttribute('src'); }
      if (empty) empty.hidden = true;
      var photoWidget = document.getElementById('gadget-photos');
      if (photoWidget) photoWidget.hidden = true;
      var controls = document.querySelector('#gadget-photos .photo-controls');
      if (controls) controls.hidden = true;
      if (counter) { counter.textContent = ''; counter.hidden = true; }
      return;
    }
    var photoWidget = document.getElementById('gadget-photos');
    if (photoWidget && !(cmsData.visibility && cmsData.visibility.showPhotos === false)) photoWidget.hidden = false;
    var controls = document.querySelector('#gadget-photos .photo-controls');
    if (controls) controls.hidden = false;
    if (counter) counter.hidden = false;
    index = ((index % photos.length) + photos.length) % photos.length;
    window.__fsfmPhotoIndex = index;
    if (image) { image.src = photos[index]; image.hidden = false; }
    if (empty) empty.hidden = true;
    if (counter) counter.textContent = (index+1)+' / '+photos.length;
  }
  function renderDates() {
    var node = document.getElementById('gadgetDateList');
    if (!node) return;
    var list = (Array.isArray(cmsData.dates) ? cmsData.dates : []).map(function(item) {
      return {title:String(item && item.title || 'Untitled event'), description:String(item && item.description || ''), dateObj:parseLocalDate(item && item.date), rawDate:String(item && item.date || '')};
    }).filter(function(item) { return item.dateObj; }).sort(function(a,b) { return a.dateObj - b.dateObj; });
    events = list; renderCalendar();
    var today = new Date(); today.setHours(0,0,0,0);
    var upcoming = list.filter(function(item) { return item.dateObj >= today; }).slice(0,3);
    if (!upcoming.length) upcoming = list.slice(-3).reverse();
    if (!upcoming.length) {
      node.innerHTML = '';
      var datesWidget = document.getElementById('gadget-dates');
      if (datesWidget) datesWidget.hidden = true;
      return;
    }
    var datesWidget = document.getElementById('gadget-dates');
    if (datesWidget && !(cmsData.visibility && cmsData.visibility.showDates === false)) datesWidget.hidden = false;
    node.innerHTML = upcoming.map(function(item) {
      var day = item.dateObj.toLocaleDateString(undefined,{day:'2-digit'});
      var mon = item.dateObj.toLocaleDateString(undefined,{month:'short'}).toUpperCase();
      var description = item.description ? '<small>'+escapeHTML(item.description)+'</small>' : '';
      return '<div class="gadget-date-item"><div class="gadget-date-chip"><strong>'+day+'</strong><small>'+mon+'</small></div><div class="gadget-date-copy"><strong>'+escapeHTML(item.title)+'</strong>'+description+'</div></div>';
    }).join('');
  }
  function escapeHTML(value) { return String(value).replace(/[&<>"']/g, function(ch) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]; }); }
  function applyCMSData(data) {
    if (!data || typeof data !== 'object') return;
    cmsData = Object.assign(cmsData, data);
    cmsData.funWidgets = Object.assign({showBarrelRoll:true,showBubbleSlider:true,showMusicPlayer:true,showPurblePlace:true}, data.funWidgets || {});
    renderPhotos(); renderDates();
    var note = document.getElementById('gadgetStickyText');
    var noteText = cmsData.stickyNote && typeof cmsData.stickyNote.text === 'string' ? cmsData.stickyNote.text : '';
    if (note) { note.textContent = noteText; note.hidden = !noteText.trim(); }
    var noteWidget = document.getElementById('gadget-note');
    if (noteWidget) noteWidget.hidden = !noteText.trim();

    var widgetFlags = {
      showBarrelRoll:'gadget-barrel-roll', showBubbleSlider:'gadget-bubbles',
      showMusicPlayer:'gadget-radio', showPurblePlace:'gadget-purble'
    };
    var visibilityFlags = Object.assign({showClock:true,showCalendar:true,showFeaturedRelease:true,showPhotos:true,showDates:true,showStickyNote:true}, cmsData.visibility || {});
    var allFlags = {showClock:'gadget-clock',showCalendar:'gadget-calendar',showFeaturedRelease:'gadget-now-playing',showPhotos:'gadget-photos',showDates:'gadget-dates',showStickyNote:'gadget-note'};
    Object.keys(allFlags).forEach(function(key){var node=document.getElementById(allFlags[key]);if(node && visibilityFlags[key]===false)node.hidden=true;});
    Object.keys(widgetFlags).forEach(function(key) {
      var widget = document.getElementById(widgetFlags[key]);
      // The saved flag used to hide this only on desktop while small screens
      // skipped this script entirely. Keep the button available everywhere.
      if (widget) widget.hidden = key === 'showBarrelRoll' ? false : cmsData.funWidgets[key] === false;
    });
  }
  renderCalendar();
  applyCMSData(cmsData);
  var photoPrevious = document.getElementById('photoPrevious');
  var photoNext = document.getElementById('photoNext');
  if (photoPrevious) photoPrevious.addEventListener('click', function() { window.__fsfmPhotoIndex = (window.__fsfmPhotoIndex || 0)-1; renderPhotos(); });
  if (photoNext) photoNext.addEventListener('click', function() { window.__fsfmPhotoIndex = (window.__fsfmPhotoIndex || 0)+1; renderPhotos(); });

})();
