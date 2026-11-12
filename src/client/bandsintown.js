(() => {
  if (!document.querySelector('.bit-widget-initializer')) return;
  const script = document.createElement('script');
  script.src = 'https://widgetv3.bandsintown.com/main.min.js';
  script.async = true;
  script.charset = 'utf-8';
  document.head.appendChild(script);
})();
