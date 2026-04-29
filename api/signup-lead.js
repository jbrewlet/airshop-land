// Serverless function for landing page email signup.
// Adds contact to Resend leads segment with LeadType and optional topic opt-in.
// Deploy to Vercel, Netlify Functions, or similar
//
// Environment variables:
// RESEND_API_KEY - Your Resend API key (required)
// RESEND_TOPIC_SHOPBOARD_ID - Required for Shopboard signups. Resend Topic ID to opt Shopboard leads into.
// AIRSHOP_WEBHOOK_URL - Optional. When set, POSTs { email } to this URL after adding contact (e.g. https://app.airshop.works/api/webhooks/landing-signup)

const LEADS_SEGMENT_ID = '20235748-374c-4d2f-b560-e5cb88f183fe';
const SHOPBOARD_TOPIC = 'Shopboard';

function parseRequestBody(body) {
    if (!body || typeof body !== 'string') {
        return body || {};
    }

    try {
        return JSON.parse(body);
    } catch {
        return Object.fromEntries(new URLSearchParams(body));
    }
}

function getTopicId(topic) {
    if (topic !== SHOPBOARD_TOPIC) {
        return '';
    }

    return process.env.RESEND_TOPIC_SHOPBOARD_ID || process.env.SHOPBOARD_RESEND_TOPIC_ID || '1f892393-5011-4fdf-8e04-c075199fa714';
}

async function optIntoTopic(email, topicId, resendApiKey) {
    if (!topicId) {
        return;
    }

    const topicResponse = await fetch(
        `https://api.resend.com/contacts/${encodeURIComponent(email)}/topics`,
        {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify([
                {
                    id: topicId,
                    subscription: 'opt_in'
                }
            ])
        }
    );

    if (!topicResponse.ok) {
        const errData = await topicResponse.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to update Resend topic');
    }
}

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
        const body = parseRequestBody(req.body);
        const { email, website, form_load_time, topic } = body;
        const leadType = body.leadType || (topic === SHOPBOARD_TOPIC ? 'shopboard_signup' : 'landing_page_signup');
        const topicId = getTopicId(topic);

        if (topic === SHOPBOARD_TOPIC && !topicId) {
            console.error('Shopboard Resend topic ID not configured');
            return res.status(500).json({ error: 'Email service not configured' });
        }

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

        // Create contact in Resend with LeadType and add to leads segment.
        // Resend will trigger welcome series based on segment/topic configuration.
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
                    LeadType: leadType
                },
                segment_ids: [LEADS_SEGMENT_ID],
                topics: topicId
                    ? [
                        {
                            id: topicId,
                            subscription: 'opt_in'
                        }
                    ]
                    : undefined
            })
        });

        if (createResponse.ok) {
            console.log('Contact added to leads segment:', trimmedEmail);
            await optIntoTopic(trimmedEmail, topicId, RESEND_API_KEY);

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

            const addSegmentErrData = addSegmentResponse.ok
                ? {}
                : await addSegmentResponse.json().catch(() => ({}));
            const alreadyInSegment = addSegmentResponse.status === 409 ||
                (addSegmentErrData.message && addSegmentErrData.message.includes('already'));

            if (addSegmentResponse.ok || alreadyInSegment) {
                await optIntoTopic(trimmedEmail, topicId, RESEND_API_KEY);

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
