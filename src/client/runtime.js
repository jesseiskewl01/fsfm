(() => {
  'use strict';
  document.documentElement.classList.add('js-ready');
  document.querySelectorAll('img').forEach((image) => {
    image.addEventListener('error', () => {
      image.classList.add('media-missing');
      image.closest('.media-frame')?.classList.add('is-missing');
      image.alt = image.alt || 'Image unavailable';
    }, { once: true });
  });
  document.querySelectorAll('a[href^="http"]:not([target])').forEach((link) => {
    if (link.hostname !== location.hostname) {
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    }
  });
})();
