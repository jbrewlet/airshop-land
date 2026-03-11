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

  document.addEventListener(
    'click',
    function (e) {
      var el = e.target && e.target.closest ? e.target.closest('a[href]') : null;
      if (!el) return;

      var href = el.getAttribute('href') || '';
      var resolvedHref = '';
      try {
        resolvedHref = new URL(href, window.location.href).href;
      } catch (_) {
        return;
      }

      if (!/^https:\/\/airshop\.work\/onboarding(\/|\?|$)/i.test(resolvedHref)) return;

      var label = (el.textContent || '').trim().slice(0, 50) || 'start_free_trial';
      var params = {
        event_category: 'engagement',
        event_label: label,
        value: 1,
        send_to: 'G-LPM80C117C',
        debug_mode: isLocal,
        link_url: resolvedHref,
      };

      if (typeof window.gtag === 'function') {
        window.gtag('event', 'start_trial_cta_click', params);
      } else if (window.dataLayer) {
        window.dataLayer.push({
          event: 'start_trial_cta_click',
          event_category: 'engagement',
          event_label: label,
          value: 1,
          link_url: resolvedHref,
        });
      }
    },
    true
  );
})();
