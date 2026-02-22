/**
 * Guide signup form - POSTs to AirShop API
 * Replaces Zapier webhook flow. API handles contact creation, segment, topic, welcome email.
 */
(function() {
    const API_URL = 'https://airshop.work/api/leads/guide-signup';

    const form = document.getElementById('email-signup-form');
    const messageEl = document.getElementById('signup-message');

    if (!form || !messageEl) return;

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const emailInput = document.getElementById('signup-email');
        const submitBtn = form.querySelector('button[type="submit"]');
        const honeypot = form.querySelector('input[name="website"]');
        const firstNameInput = form.querySelector('input[name="firstName"]');
        const lastNameInput = form.querySelector('input[name="lastName"]');

        const email = emailInput ? emailInput.value.trim() : '';
        const firstName = firstNameInput ? firstNameInput.value.trim() : '';
        const lastName = lastNameInput ? lastNameInput.value.trim() : '';

        if (honeypot && honeypot.value.trim()) {
            return;
        }

        if (!email) {
            messageEl.textContent = 'Please enter your email.';
            messageEl.className = 'email-signup-message error';
            return;
        }

        submitBtn.disabled = true;
        messageEl.textContent = '';
        messageEl.className = 'email-signup-message';

        try {
            const params = new URLSearchParams();
            params.append('email', email);
            if (firstName) params.append('firstName', firstName);
            if (lastName) params.append('lastName', lastName);

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params.toString()
            });

            const data = await response.json().catch(() => ({}));

            if (response.ok) {
                messageEl.textContent = 'Check your inbox for the guide.';
                messageEl.className = 'email-signup-message success';
                form.reset();
            } else {
                throw new Error(data.error || 'Something went wrong');
            }
        } catch (err) {
            messageEl.textContent = err.message || 'Failed to sign up. Please try again.';
            messageEl.className = 'email-signup-message error';
        } finally {
            submitBtn.disabled = false;
        }
    });
})();
