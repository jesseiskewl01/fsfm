'use strict';
(function() {
  var layer = document.getElementById('fsfmGadgets');
  if (!layer || !window.matchMedia('(min-width: 1320px) and (min-height: 700px)').matches) return;

  var STORAGE_KEY = 'fsfm_gadget_positions_v1';
  var gadgetConfig = {};
  try { gadgetConfig = JSON.parse((document.getElementById('fsfmGadgetConfig') || {}).textContent || '{}'); } catch (e) { gadgetConfig = {}; }
  var widgets = Array.prototype.slice.call(layer.querySelectorAll('.fsfm-gadget'));
  var positions = {};
  var defaultPositions = {
    'gadget-clock': [16, 82],
    'gadget-now-playing': [16, 286],
    'gadget-dates': [16, 440],
    'gadget-calendar': [0, 82],
    'gadget-photos': [0, 335],
    'gadget-note': [0, 532],
    'gadget-barrel-roll': [16, 625],
    'gadget-bubbles': [210, 82],
    'gadget-radio': [210, 235],
    'gadget-purble': [0, 680]
  };
  Object.keys(gadgetConfig.positions || {}).forEach(function(id) {
    var pos = gadgetConfig.positions[id];
    if (Array.isArray(pos) && pos.length >= 2 && Number.isFinite(Number(pos[0])) && Number.isFinite(Number(pos[1]))) defaultPositions[id] = [Number(pos[0]), Number(pos[1])];
  });

  function clampWidget(widget, x, y) {
    var maxX = Math.max(8, window.innerWidth - widget.offsetWidth - 8);
    var maxY = Math.max(48, window.innerHeight - widget.offsetHeight - 8);
    return { x: Math.min(Math.max(8, x), maxX), y: Math.min(Math.max(48, y), maxY) };
  }
  function applyPosition(widget, x, y) {
    var p = clampWidget(widget, x, y);
    widget.style.left = p.x + 'px';
    widget.style.top = p.y + 'px';
    positions[widget.id] = [p.x, p.y];
  }
  try {
    positions = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {};
  } catch (e) { positions = {}; }
  widgets.forEach(function(widget) {
    var saved = positions[widget.id];
    var fallback = defaultPositions[widget.id] || [16, 90];
    var x = saved && Number.isFinite(saved[0]) ? saved[0] : fallback[0];
    var y = saved && Number.isFinite(saved[1]) ? saved[1] : fallback[1];
    if (['gadget-calendar','gadget-photos','gadget-note','gadget-purble'].indexOf(widget.id) !== -1) {
      if (!(saved && Number.isFinite(saved[0]))) x = window.innerWidth - widget.offsetWidth - 16;
    }
    applyPosition(widget, x, y);
  });
  function savePositions() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(positions)); } catch (e) {}
  }
  widgets.forEach(function(widget) {
    var handle = widget.querySelector('[data-drag-handle]');
    if (!handle) return;
    var drag = null;
    handle.addEventListener('pointerdown', function(event) {
      if (event.button !== 0 || event.target.closest('button,select,a,input')) return;
      var rect = widget.getBoundingClientRect();
      drag = { pointerId:event.pointerId, startX:event.clientX, startY:event.clientY, left:rect.left, top:rect.top };
      widget.style.zIndex = '80';
      widgets.forEach(function(other) { if (other !== widget) other.style.zIndex = '35'; });
      try { handle.setPointerCapture(event.pointerId); } catch (e) {}
      event.preventDefault();
    });
    handle.addEventListener('pointermove', function(event) {
      if (!drag || event.pointerId !== drag.pointerId) return;
      applyPosition(widget, drag.left + event.clientX - drag.startX, drag.top + event.clientY - drag.startY);
    });
    function endDrag(event) {
      if (!drag || (event && event.pointerId !== drag.pointerId)) return;
      drag = null; savePositions();
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
      event.preventDefault(); applyPosition(widget, x, y); savePositions();
    });
  });
  window.addEventListener('resize', function() {
    widgets.forEach(function(widget) {
      var rect = widget.getBoundingClientRect();
      applyPosition(widget, rect.left, rect.top);
    });
    savePositions();
  });

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
      if (widget) widget.hidden = cmsData.funWidgets[key] === false;
    });
  }
  renderCalendar();
  applyCMSData(cmsData);
  var photoPrevious = document.getElementById('photoPrevious');
  var photoNext = document.getElementById('photoNext');
  if (photoPrevious) photoPrevious.addEventListener('click', function() { window.__fsfmPhotoIndex = (window.__fsfmPhotoIndex || 0)-1; renderPhotos(); });
  if (photoNext) photoNext.addEventListener('click', function() { window.__fsfmPhotoIndex = (window.__fsfmPhotoIndex || 0)+1; renderPhotos(); });

})();
