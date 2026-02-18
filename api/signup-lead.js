// Serverless function for landing page email signup
// Adds contact to Resend leads segment with LeadType for welcome sales series
// Deploy to Vercel, Netlify Functions, or similar
//
// Environment variables:
// RESEND_API_KEY - Your Resend API key (required)
// AIRSHOP_WEBHOOK_URL - Optional. When set, POSTs { email } to this URL after adding contact (e.g. https://app.airshop.works/api/webhooks/landing-signup)

const LEADS_SEGMENT_ID = '20235748-374c-4d2f-b560-e5cb88f183fe';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;

    if (!RESEND_API_KEY) {
        console.error('RESEND_API_KEY not configured');
        return res.status(500).json({ error: 'Email service not configured' });
    }

    try {
        const { email, website, form_load_time } = req.body;

        if (!email || typeof email !== 'string') {
            return res.status(400).json({ error: 'Email is required' });
        }

        if (website && String(website).trim().length > 0) {
            return res.status(400).json({ error: 'Invalid submission' });
        }

        const loadTime = form_load_time ? parseInt(form_load_time, 10) : 0;
        const elapsed = Date.now() - loadTime;
        if (loadTime > 0 && elapsed < 3000) {
            return res.status(400).json({ error: 'Invalid submission' });
        }

        const trimmedEmail = email.trim().toLowerCase();
        if (!trimmedEmail) {
            return res.status(400).json({ error: 'Email is required' });
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail)) {
            return res.status(400).json({ error: 'Please enter a valid email address' });
        }

        // Create contact in Resend with LeadType and add to leads segment
        // Resend will trigger welcome series based on segment (configure in Resend dashboard)
        const createResponse = await fetch('https://api.resend.com/contacts', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: trimmedEmail,
                unsubscribed: false,
                properties: {
                    LeadType: 'landing_page_signup'
                },
                segment_ids: [LEADS_SEGMENT_ID]
            })
        });

        if (createResponse.ok) {
            console.log('Contact added to leads segment:', trimmedEmail);

            const webhookUrl = process.env.AIRSHOP_WEBHOOK_URL;
            if (webhookUrl) {
                try {
                    await fetch(webhookUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: trimmedEmail })
                    });
                } catch (webhookErr) {
                    console.error('Webhook notify failed:', webhookErr);
                }
            }

            return res.status(200).json({ success: true });
        }

        const errData = await createResponse.json().catch(() => ({}));

        // Contact may already exist - try adding to segment
        if (createResponse.status === 409 || (errData.message && errData.message.includes('already'))) {
            const addSegmentResponse = await fetch(
                `https://api.resend.com/contacts/${encodeURIComponent(trimmedEmail)}/segments/${LEADS_SEGMENT_ID}`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${RESEND_API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (addSegmentResponse.ok) {
                const webhookUrl = process.env.AIRSHOP_WEBHOOK_URL;
                if (webhookUrl) {
                    try {
                        await fetch(webhookUrl, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email: trimmedEmail })
                        });
                    } catch (webhookErr) {
                        console.error('Webhook notify failed:', webhookErr);
                    }
                }
                return res.status(200).json({ success: true });
            }
        }

        console.error('Resend error:', errData);
        return res.status(500).json({ error: 'Failed to add you to the list. Please try again.' });
    } catch (error) {
        console.error('Error in signup-lead:', error);
        return res.status(500).json({ error: 'Failed to sign up. Please try again.' });
    }
}
