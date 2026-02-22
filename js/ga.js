/**
 * GA4 setup - single source for config. Load in head before other scripts.
 */
(function () {
  var isLocal =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    dataLayer.push(arguments);
  }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', 'G-LPM80C117C', {
    debug_mode: isLocal,
    cookie_domain: isLocal ? 'none' : 'auto',
  });

  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=G-LPM80C117C';
  document.head.appendChild(s);
})();
