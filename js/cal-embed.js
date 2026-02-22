/**
 * Cal.com popup-on-click embed for demo CTAs.
 * Opens scheduler in modal instead of new tab.
 * GA4 events: demo_cta_click (open), demo_booking_completed, demo_booking_rescheduled, demo_booking_cancelled.
 */
(function (C, A, L) {
  var p = function (a, ar) {
    a.q.push(ar);
  };
  var d = C.document;
  C.Cal =
    C.Cal ||
    function () {
      var cal = C.Cal;
      var ar = arguments;
      if (!cal.loaded) {
        cal.ns = {};
        cal.q = cal.q || [];
        d.head.appendChild(d.createElement('script')).src = A;
        cal.loaded = true;
      }
      if (ar[0] === L) {
        var api = function () {
          p(api, arguments);
        };
        var ns = ar[1];
        api.q = api.q || [];
        if (typeof ns === 'string') {
          cal.ns[ns] = cal.ns[ns] || api;
          p(cal.ns[ns], ar);
          p(cal, ['initNamespace', ns]);
        } else {
          p(cal, ar);
        }
        return;
      }
      p(cal, ar);
    };
})(window, 'https://app.cal.com/embed/embed.js', 'init');

Cal('init', 'demo', { origin: 'https://cal.com' });
Cal.ns['demo']('ui', {
  theme: 'dark',
  styles: { branding: { brandColor: '#FF5918' } },
});
Cal.ns['demo']('preload', { calLink: 'airshop/demo' });

function fireCalEvent(eventName, eventLabel, eventParams) {
  if (typeof gtag === 'function') {
    var isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    var params = {
      event_category: 'engagement',
      event_label: eventLabel,
      value: 1,
      send_to: 'G-LPM80C117C',
      debug_mode: isLocal,
    };
    if (eventParams) {
      for (var k in eventParams) params[k] = eventParams[k];
    }
    gtag('event', eventName, params);
  }
}

Cal.ns['demo']('on', {
  action: 'bookingSuccessfulV2',
  callback: function (e) {
    var d = e.detail && e.detail.data;
    fireCalEvent('demo_booking_completed', 'demo', d && d.startTime ? { booking_start: d.startTime } : null);
  },
});

Cal.ns['demo']('on', {
  action: 'rescheduleBookingSuccessfulV2',
  callback: function (e) {
    fireCalEvent('demo_booking_rescheduled', 'demo');
  },
});

Cal.ns['demo']('on', {
  action: 'bookingCancelled',
  callback: function () {
    fireCalEvent('demo_booking_cancelled', 'demo');
  },
});

document.addEventListener(
  'click',
  function (e) {
    var el = e.target.closest('[data-cal-link]');
    if (el) {
      e.preventDefault();
      var label = el.textContent.trim().slice(0, 50) || 'cal_demo';
      if (typeof gtag === 'function') {
        var isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        gtag('event', 'demo_cta_click', {
          event_category: 'engagement',
          event_label: label,
          value: 1,
          send_to: 'G-LPM80C117C',
          debug_mode: isLocal,
        });
      } else if (typeof window.dataLayer !== 'undefined') {
        window.dataLayer.push({
          event: 'demo_cta_click',
          event_category: 'engagement',
          event_label: label,
          value: 1,
        });
      }
    }
  },
  true
);
