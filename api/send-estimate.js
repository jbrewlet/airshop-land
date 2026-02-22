// Serverless function for sending ROI estimate emails via Resend
// Deploy to Vercel, Netlify Functions, or similar
//
// Environment variables:
// RESEND_API_KEY - Your Resend API key (required)
// ADMIN_EMAILS - Comma-separated admin emails to BCC (optional, defaults to team@airshopapp.com)

export default async function handler(req, res) {
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;

    if (!RESEND_API_KEY) {
        console.error('RESEND_API_KEY not configured');
        return res.status(500).json({ error: 'Email service not configured' });
    }

    try {
        const {
            email,
            emails,
            name,
            company,
            billingRate,
            monthlyLoss,
            yearlyLoss,
            hoursMonthly,
            hoursWeekly,
            quotesPerWeek,
            timePerQuote,
            wastedPerQuote,
            inventoryHours,
            stockoutDays
        } = req.body;

        // Accept email (form) or emails (array)
        const toEmails = Array.isArray(emails) && emails.length > 0
            ? emails
            : (email ? [email] : []);

        if (toEmails.length === 0) {
            return res.status(400).json({ error: 'At least one email is required' });
        }

        // Admin BCC
        const adminEmails = process.env.ADMIN_EMAILS
            ? process.env.ADMIN_EMAILS.split(',').map((e) => e.trim()).filter(Boolean)
            : ['team@airshopapp.com'];

        // Cal.com link prefilled with name and email
        const calParams = new URLSearchParams();
        if (name) calParams.set('name', name);
        calParams.set('email', toEmails[0]);
        const calUrl = `https://cal.com/airshop/demo?${calParams.toString()}`;

        // Build the email HTML (light theme, from Zapier template)
        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="x-apple-disable-message-reformatting">
<title>Your Lost Revenue Estimate</title>
<style type="text/css">
@media only screen and (max-width: 600px) {
  .email-wrapper { padding: 20px 10px; }
  .email-container { width: 100%; max-width: 100%; border-radius: 0; }
  .email-content { padding: 24px 20px; }
  .email-header { padding: 24px 20px; }
  .email-footer { padding: 0 20px 32px 20px; }
  .button-container { padding: 14px 32px; font-size: 14px; }
  .title-section { padding: 24px 20px; }
  .title-section h1 { font-size: 22px; }
  .big-number { font-size: 36px; }
}
</style>
</head>
<body style="margin: 0; padding: 0; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f2f2f2; color: #1a1a1a; -webkit-font-smoothing: antialiased;">
<table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
<tr>
<td align="center" class="email-wrapper" style="padding: 40px 20px;">
<table border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">

<!-- Header -->
<tr>
  <td align="center" class="email-header" style="background-color: #03366D; padding: 32px 20px;">
    <img src="https://airshopapp.com/AirShop_Dark.png" alt="AirShop" style="height: 32px; display: block; border: 0; max-width: 100%;" />
  </td>
</tr>

<!-- Title -->
<tr>
  <td align="center" class="title-section" style="padding: 40px 40px 0 40px;">
    <h1 style="margin: 0; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 26px; font-weight: 700; color: #1a1a1a; line-height: 1.3;">
      Your Lost Revenue Estimate
    </h1>
  </td>
</tr>

<!-- Content -->
<tr>
<td class="email-content" style="padding: 24px 40px 32px 40px;">

  <!-- Greeting -->
  <p style="font-family: Inter, -apple-system, sans-serif; margin: 0 0 20px 0; font-size: 17px; line-height: 1.6; color: #1a1a1a;">Hey&nbsp;&mdash;</p>
  
  <p style="font-family: Inter, -apple-system, sans-serif; margin: 0 0 28px 0; font-size: 17px; line-height: 1.6; color: #1a1a1a;">
    Here's your estimate, and how AirShop can help you get it back.
  </p>

  <!-- The Problem -->
  <div style="background-color: #f5f7fa; padding: 24px; border-radius: 8px; margin-bottom: 16px; text-align: center;">
    <p style="font-family: Inter, -apple-system, sans-serif; margin: 0 0 8px 0; font-size: 12px; font-weight: 700; color: #666666; text-transform: uppercase; letter-spacing: 0.1em;">
      You're Currently Losing
    </p>
    <p class="big-number" style="font-family: Inter, -apple-system, sans-serif; margin: 0 0 4px 0; font-size: 36px; font-weight: 700; color: #03366D; line-height: 1;">
      ${monthlyLoss}<span style="font-size: 16px; font-weight: 400; color: #666;">/month</span>
    </p>
    <p style="font-family: Inter, -apple-system, sans-serif; margin: 0; font-size: 14px; color: #666666;">
      ${hoursMonthly} hours/month · ${hoursWeekly} hrs/week
    </p>
  </div>
  
  <!-- The Solution -->
  <div style="background: linear-gradient(135deg, #FF5918 0%, #ff7a45 100%); padding: 28px; border-radius: 8px; margin-bottom: 28px; text-align: center;">
    <p style="font-family: Inter, -apple-system, sans-serif; margin: 0 0 8px 0; font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.85); text-transform: uppercase; letter-spacing: 0.1em;">
      With AirShop, You Could Recover
    </p>
    <p class="big-number" style="font-family: Inter, -apple-system, sans-serif; margin: 0; font-size: 48px; font-weight: 700; color: #ffffff; line-height: 1;">
      ${yearlyLoss}<span style="font-size: 18px; font-weight: 400; opacity: 0.8;">/year</span>
    </p>
    <p style="font-family: Inter, -apple-system, sans-serif; margin: 8px 0 0 0; font-size: 14px; color: rgba(255,255,255,0.9);">
      
    </p>
  </div>

  <!-- How AirShop Helps -->
  <p style="font-family: Inter, -apple-system, sans-serif; margin: 0 0 16px 0; font-size: 12px; font-weight: 700; color: #666666; text-transform: uppercase; letter-spacing: 0.1em;">
    How AirShop Helps You Recover This
  </p>
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 28px;">
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid rgba(0,0,0,0.05); font-family: Inter, -apple-system, sans-serif; font-size: 14px; color: #1a1a1a;">
        <strong style="color: #03366D;">Quote templates</strong> — Stop re-typing. Build quotes in minutes, not hours.
      </td>
    </tr>
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid rgba(0,0,0,0.05); font-family: Inter, -apple-system, sans-serif; font-size: 14px; color: #1a1a1a;">
        <strong style="color: #03366D;">Real-time inventory</strong> — Always know what's in stock, across every location.
      </td>
    </tr>
    <tr>
      <td style="padding: 12px 0; font-family: Inter, -apple-system, sans-serif; font-size: 14px; color: #1a1a1a;">
        <strong style="color: #03366D;">Low-stock alerts</strong> — Never miss a reorder. No more stockout surprises.
      </td>
    </tr>
  </table>

  <!-- Your inputs (collapsed) -->
  <details style="margin-bottom: 28px;">
    <summary style="font-family: Inter, -apple-system, sans-serif; font-size: 12px; font-weight: 700; color: #666666; text-transform: uppercase; letter-spacing: 0.1em; cursor: pointer; margin-bottom: 12px;">
      Your Estimate Details
    </summary>
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 12px;">
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid rgba(0,0,0,0.05); font-family: Inter, -apple-system, sans-serif; font-size: 13px; color: #666666;">Billing Rate</td>
        <td style="padding: 8px 0; border-bottom: 1px solid rgba(0,0,0,0.05); font-family: Inter, -apple-system, sans-serif; font-size: 13px; color: #1a1a1a; text-align: right;">$${billingRate}/hr</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid rgba(0,0,0,0.05); font-family: Inter, -apple-system, sans-serif; font-size: 13px; color: #666666;">Quotes per week</td>
        <td style="padding: 8px 0; border-bottom: 1px solid rgba(0,0,0,0.05); font-family: Inter, -apple-system, sans-serif; font-size: 13px; color: #1a1a1a; text-align: right;">${quotesPerWeek}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid rgba(0,0,0,0.05); font-family: Inter, -apple-system, sans-serif; font-size: 13px; color: #666666;">Wasted time per quote</td>
        <td style="padding: 8px 0; border-bottom: 1px solid rgba(0,0,0,0.05); font-family: Inter, -apple-system, sans-serif; font-size: 13px; color: #1a1a1a; text-align: right;">${wastedPerQuote} min</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid rgba(0,0,0,0.05); font-family: Inter, -apple-system, sans-serif; font-size: 13px; color: #666666;">Inventory tracking</td>
        <td style="padding: 8px 0; border-bottom: 1px solid rgba(0,0,0,0.05); font-family: Inter, -apple-system, sans-serif; font-size: 13px; color: #1a1a1a; text-align: right;">${inventoryHours} hrs/wk</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-family: Inter, -apple-system, sans-serif; font-size: 13px; color: #666666;">Stockout delays</td>
        <td style="padding: 8px 0; font-family: Inter, -apple-system, sans-serif; font-size: 13px; color: #1a1a1a; text-align: right;">${stockoutDays} day/mo</td>
      </tr>
    </table>
  </details>

  <!-- CTA -->
  <p style="font-family: Inter, -apple-system, sans-serif; margin: 0 0 20px 0; font-size: 17px; line-height: 1.6; color: #1a1a1a;">
    Ready to start recovering that ${yearlyLoss}? Let's talk.
  </p>
  
  <div style="text-align: center; margin-bottom: 32px;">
    <a href="${calUrl}" class="button-container" style="font-family: Inter, -apple-system, sans-serif; display: inline-block; background-color: #FF5918; color: #1a1a1a; padding: 16px 40px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; text-transform: uppercase; letter-spacing: 0.5px;">
      BOOK A DEMO
    </a>
  </div>

  <!-- Footer link -->
  <div style="border-top: 1px solid rgba(0,0,0,0.1); padding-top: 24px;">
    <p style="font-family: Inter, -apple-system, sans-serif; margin: 0 0 8px 0; font-size: 14px; line-height: 1.5; color: #666666;">
      Questions? Just reply to this email — we're happy to help.
    </p>
    <p style="font-family: Inter, -apple-system, sans-serif; margin: 0; font-size: 14px;">
      <a href="https://airshopapp.com" style="color: #3366CC; text-decoration: none;">airshopapp.com</a>
    </p>
  </div>

</td>
</tr>

<!-- Footer -->
<tr>
  <td class="email-footer" style="padding: 0 40px 40px 40px;">
    <p style="font-family: Inter, -apple-system, sans-serif; margin: 0; font-size: 12px; color: #666666; text-align: center; opacity: 0.6;">
      © 2026 AirShop Works Inc. All rights reserved.
    </p>
  </td>
</tr>

</table>
</td>
</tr>
</table>
</body>
</html>
        `;

        // Send email via Resend
        const resendResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'AirShop <team@airshopapp.com>',
                to: toEmails,
                subject: `Stop losing ${monthlyLoss}/month 🟧 AirShop`,
                html: emailHtml,
                bcc: adminEmails
            })
        });

        if (!resendResponse.ok) {
            const data = await resendResponse.json();
            console.error('Resend error:', data);
            throw new Error('Failed to send email via Resend');
        }

        const result = await resendResponse.json();

        // Add contact to Resend with LeadType for email series
        const LEADS_SEGMENT_ID = '20235748-374c-4d2f-b560-e5cb88f183fe';
        const contactEmail = toEmails[0].trim().toLowerCase();
        try {
            const createResponse = await fetch('https://api.resend.com/contacts', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${RESEND_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: contactEmail,
                    first_name: name || '',
                    unsubscribed: false,
                    properties: {
                        LeadType: 'Land Estimate'
                    },
                    segment_ids: [LEADS_SEGMENT_ID]
                })
            });

            if (createResponse.ok) {
                console.log('Contact added to leads segment:', contactEmail);
            } else {
                const errData = await createResponse.json().catch(() => ({}));
                if (createResponse.status === 409 || (errData.message && errData.message.includes('already'))) {
                    const addSegmentResponse = await fetch(
                        `https://api.resend.com/contacts/${encodeURIComponent(contactEmail)}/segments/${LEADS_SEGMENT_ID}`,
                        {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${RESEND_API_KEY}`,
                                'Content-Type': 'application/json'
                            }
                        }
                    );
                    if (addSegmentResponse.ok) {
                        console.log('Contact added to segment:', contactEmail);
                    } else {
                        console.error('Failed to add contact to segment:', await addSegmentResponse.text());
                    }
                } else {
                    console.error('Failed to add contact:', errData);
                }
            }
        } catch (audienceError) {
            // Don't fail the whole request if audience add fails
            console.error('Failed to add contact to audience:', audienceError);
        }

        // Log the lead
        console.log('Estimate sent:', {
            emails: toEmails,
            name,
            company,
            yearlyLoss,
            timestamp: new Date().toISOString()
        });

        return res.status(200).json({ success: true, id: result.id });

    } catch (error) {
        console.error('Error sending estimate:', error);
        return res.status(500).json({ error: 'Failed to send email' });
    }
}
