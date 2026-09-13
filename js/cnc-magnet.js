/**
 * CNC tool tags email magnet. Slides up after scroll, POSTs to AirShop.
 */
(function() {
    var card = document.getElementById('cnc-magnet');
    var form = document.getElementById('cnc-magnet-form');
    var messageEl = document.getElementById('cnc-magnet-message');
    var emailInput = document.getElementById('cnc-magnet-email');
    var closeButtons = document.querySelectorAll('[data-cnc-magnet-close]');

    if (!card || !form || !messageEl || !emailInput) return;

    var STORAGE_DISMISS = 'airshop-cnc-magnet-dismissed';
    var STORAGE_SUBMIT = 'airshop-cnc-magnet-submitted';
    var MIN_MS = 8000;
    var MIN_SCROLL = 0.4;
    var formLoadTime = Date.now();
    var shown = false;
    var readyAt = Date.now() + MIN_MS;

    function apiUrl() {
        if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
            return 'http://localhost:3000/api/leads/cnc-tool-tags-signup';
        }
        return 'https://airshop.work/api/leads/cnc-tool-tags-signup';
    }

    function alreadyDone() {
        try {
            return Boolean(
                window.localStorage.getItem(STORAGE_DISMISS) ||
                window.localStorage.getItem(STORAGE_SUBMIT)
            );
        } catch (err) {
            return false;
        }
    }

    function persist(key) {
        try {
            window.localStorage.setItem(key, '1');
        } catch (err) {
            /* ignore quota / private mode */
        }
    }

    function hide() {
        card.classList.remove('is-visible');
        card.setAttribute('hidden', '');
    }

    function show() {
        if (shown || alreadyDone()) return;
        shown = true;
        card.removeAttribute('hidden');
        window.setTimeout(function() {
            card.classList.add('is-visible');
        }, 20);
    }

    function dismiss() {
        persist(STORAGE_DISMISS);
        hide();
    }

    function scrollProgress() {
        var doc = document.documentElement;
        var max = Math.max(doc.scrollHeight - window.innerHeight, 1);
        return window.scrollY / max;
    }

    function maybeShow() {
        if (shown || alreadyDone()) return;
        if (Date.now() < readyAt) return;
        if (scrollProgress() < MIN_SCROLL) return;
        show();
    }

    if (alreadyDone()) {
        hide();
        return;
    }

    window.addEventListener('scroll', maybeShow, { passive: true });
    window.setTimeout(maybeShow, MIN_MS);

    closeButtons.forEach(function(button) {
        button.addEventListener('click', dismiss);
    });

    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && card.classList.contains('is-visible')) {
            dismiss();
        }
    });

    form.addEventListener('submit', async function(event) {
        event.preventDefault();

        var submitBtn = form.querySelector('button[type="submit"]');
        var honeypot = form.querySelector('input[name="website"]');
        var email = emailInput.value.trim();

        if (honeypot && honeypot.value.trim()) {
            return;
        }

        if (!email) {
            messageEl.textContent = 'Please enter your email.';
            messageEl.className = 'cnc-magnet-message error';
            return;
        }

        submitBtn.disabled = true;
        messageEl.textContent = '';
        messageEl.className = 'cnc-magnet-message';

        try {
            var response = await fetch(apiUrl(), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email,
                    website: honeypot ? honeypot.value : '',
                    form_load_time: formLoadTime,
                    leadType: 'cnc_tool_tags'
                })
            });

            var data = await response.json().catch(function() {
                return {};
            });

            if (!response.ok) {
                throw new Error(data.error || 'Something went wrong');
            }

            messageEl.textContent = 'Check your inbox.';
            messageEl.className = 'cnc-magnet-message success';
            form.reset();
            persist(STORAGE_SUBMIT);
            window.setTimeout(hide, 1800);
        } catch (err) {
            messageEl.textContent = err.message || 'Failed to sign up. Please try again.';
            messageEl.className = 'cnc-magnet-message error';
        } finally {
            submitBtn.disabled = false;
        }
    });
})();
