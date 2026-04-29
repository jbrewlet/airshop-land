(function() {
    var API_URL = 'https://airshop.work/api/leads/shopboard-signup';
    var modal = document.getElementById('shopboard-signup-modal');
    var form = document.getElementById('shopboard-signup-form');
    var messageEl = document.getElementById('shopboard-signup-message');
    var emailInput = document.getElementById('shopboard-signup-email');
    var closeButtons = document.querySelectorAll('[data-shopboard-signup-close]');
    var triggerButtons = document.querySelectorAll('[data-shopboard-signup-open]');
    var lastActiveElement = null;
    var formLoadTime = Date.now();

    if (!modal || !form || !messageEl || !emailInput || !triggerButtons.length) return;

    function openModal() {
        lastActiveElement = document.activeElement;
        modal.hidden = false;
        document.body.classList.add('shopboard-signup-open');
        messageEl.textContent = '';
        messageEl.className = 'shopboard-signup-message';
        formLoadTime = Date.now();
        window.setTimeout(function() {
            emailInput.focus();
        }, 0);
    }

    function closeModal() {
        modal.hidden = true;
        document.body.classList.remove('shopboard-signup-open');

        if (lastActiveElement && typeof lastActiveElement.focus === 'function') {
            lastActiveElement.focus();
        }
    }

    triggerButtons.forEach(function(button) {
        button.addEventListener('click', openModal);
    });

    closeButtons.forEach(function(button) {
        button.addEventListener('click', closeModal);
    });

    modal.addEventListener('click', function(event) {
        if (event.target === modal) {
            closeModal();
        }
    });

    document.addEventListener('keydown', function(event) {
        if (modal.hidden) {
            return;
        }

        if (event.key === 'Escape') {
            closeModal();
        }

        if (event.key !== 'Tab') {
            return;
        }

        var focusable = modal.querySelectorAll('button, input, [href], select, textarea, [tabindex]:not([tabindex="-1"])');
        if (!focusable.length) {
            return;
        }

        var first = focusable[0];
        var last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
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
            messageEl.className = 'shopboard-signup-message error';
            return;
        }

        submitBtn.disabled = true;
        messageEl.textContent = '';
        messageEl.className = 'shopboard-signup-message';

        try {
            var response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email,
                    website: honeypot ? honeypot.value : '',
                    form_load_time: formLoadTime,
                    leadType: 'shopboard_signup',
                    topic: 'Shopboard'
                })
            });

            var data = await response.json().catch(function() {
                return {};
            });

            if (!response.ok) {
                throw new Error(data.error || 'Something went wrong');
            }

            messageEl.textContent = 'You are on the Shopboard update list.';
            messageEl.className = 'shopboard-signup-message success';
            form.reset();
        } catch (err) {
            messageEl.textContent = err.message || 'Failed to sign up. Please try again.';
            messageEl.className = 'shopboard-signup-message error';
        } finally {
            submitBtn.disabled = false;
        }
    });
})();
