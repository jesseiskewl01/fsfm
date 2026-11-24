'use strict';
(function() {
  var layer = document.getElementById('fsfmGadgets');
  if (!layer || !window.matchMedia('(min-width: 1180px) and (min-height: 600px)').matches) return;

  var STORAGE_KEY = 'fsfm_gadget_positions_v2';
  var LEGACY_STORAGE_KEY = 'fsfm_gadget_positions_v1';
  var HITBOX_PADDING = 8;
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

  function clampWidget(widget, x, y) {
    var maxX = Math.max(8, window.innerWidth - widget.offsetWidth - 8);
    var maxY = Math.max(48, window.innerHeight - widget.offsetHeight - 8);
    return { x: Math.min(Math.max(8, x), maxX), y: Math.min(Math.max(48, y), maxY) };
  }

  function computeDesktopLayout() {
    var hero = document.querySelector('.hero-window');
    var heroRect = hero ? hero.getBoundingClientRect() : null;
    var viewportWidth = window.innerWidth;
    var viewportHeight = window.innerHeight;
    var heroTop = heroRect ? heroRect.top : 82;
    var topRow = Math.max(72, Math.round(heroTop));
    var middleRow = Math.max(topRow + 196, Math.round(heroTop + 196));
    var lowerRow = Math.max(middleRow + 196, Math.round(heroTop + 392));
    var mainWidth = 184;
    var leftOuter = 16;
    var leftInner = 46;
    var rightOuter = viewportWidth - mainWidth - 16;
    var rightInner = viewportWidth - mainWidth - 46;

    // Gradated framing requested by Jesse [OpenCode, 2026-11-22]:
    // 1==[hero]==4  (clock / calendar)
    // =2=[hero]=5=  (featured / photo) - stepped inward
    // 3==[hero]==6  (dates / note)
    return {
      'gadget-clock': [leftOuter, topRow],
      'gadget-now-playing': [leftInner, middleRow],
      'gadget-dates': [leftOuter, lowerRow],
      'gadget-calendar': [rightOuter, topRow],
      'gadget-photos': [rightInner, middleRow],
      'gadget-note': [rightOuter, lowerRow]
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

  // Widgets collide using a padded hitbox, not just the visible rectangle.
  function boxAt(widget, x, y) {
    return { x:x - HITBOX_PADDING, y:y - HITBOX_PADDING, width:widget.offsetWidth + (HITBOX_PADDING * 2), height:widget.offsetHeight + (HITBOX_PADDING * 2) };
  }
  function liveBox(widget) {
    var rect = widget.getBoundingClientRect();
    return { x:rect.left - HITBOX_PADDING, y:rect.top - HITBOX_PADDING, width:rect.width + (HITBOX_PADDING * 2), height:rect.height + (HITBOX_PADDING * 2) };
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
      occupied.push(boxAt(widget, point[0], point[1]));
    });

    bonusIds.forEach(function(id) {
      var widget = widgetById[id], point = layout[id];
      if (!widget || widget.hidden || !point) return;
      var candidate = boxAt(widget, point[0], point[1]);
      var attempts = 0;
      while (occupied.some(function(other) { return boxesOverlap(candidate, other, 12); }) && attempts < 24) {
        candidate.y += 20;
        if (candidate.y + candidate.height > window.innerHeight - 8) {
          candidate.y = Math.max(48, point[1] - 36);
          candidate.x += 24;
        }
        if (candidate.x + candidate.width > window.innerWidth - 8) {
          candidate.x = Math.max(8, point[0] - 24);
        }
        attempts += 1;
      }
      layout[id] = [candidate.x + HITBOX_PADDING, candidate.y + HITBOX_PADDING];
      occupied.push(candidate);
    });
    return layout;
  }

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

  // A held widget nudges any widget it hits. [OpenCode, 2026-11-24]
  function pushOverlappingWidgets(held, dx, dy) {
    if (!dx && !dy) return;
    var gap = 4;
    var pushX = Math.abs(dx) >= Math.abs(dy) ? dx : 0;
    var pushY = pushX ? 0 : dy;
    for (var pass = 0; pass < 3; pass += 1) {
      var heldBox = liveBox(held);
      var moved = false;
      widgets.forEach(function(other) {
        if (other === held || other.hidden || !other.querySelector('[data-drag-handle]')) return;
        var rect = other.getBoundingClientRect();
        var box = liveBox(other);
        if (!boxesOverlap(heldBox, box, gap)) return;
        var stored = positions[other.id] || [rect.left, rect.top];
        applyPosition(other, stored[0] + pushX, stored[1] + pushY);
        customPositions[other.id] = true;
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
    savePositions();
  }
  window.addEventListener('resize', function() {
    if (resizeFrame) cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(reflowDesktopWidgets);
  }, { passive: true });

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function() {
      if (resizeFrame) cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(reflowDesktopWidgets);
    });
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
