// Serverless function for sending ROI estimate emails via Resend
// Deploy to Vercel, Netlify Functions, or similar
//
// Environment variable required:
// RESEND_API_KEY - Your Resend API key

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

        // Validate emails array
        if (!emails || !Array.isArray(emails) || emails.length === 0) {
            return res.status(400).json({ error: 'At least one email is required' });
        }

        // Build the email HTML
        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #1a1a1a; color: #e0e0e0;">
    <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 32px;">
            <img src="https://airshop.works/AirShop_Dark.svg" alt="AirShop" style="height: 32px; margin-bottom: 16px;">
            <h1 style="margin: 0; font-size: 24px; color: #ffffff;">Your Lost Revenue Estimate</h1>
        </div>
        
        <!-- Main Results -->
        <div style="background: linear-gradient(165deg, rgba(3,54,109,0.3), rgba(34,34,34,0.2)); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 24px; margin-bottom: 24px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
                <div style="text-align: center; flex: 1;">
                    <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 8px;">Monthly Lost Revenue</div>
                    <div style="font-size: 32px; font-weight: bold; color: #4fd1c5;">${monthlyLoss}</div>
                    <div style="font-size: 14px; color: #888; margin-top: 4px;">${hoursMonthly} hrs/month wasted</div>
                </div>
            </div>
            <div style="text-align: center; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1);">
                <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #ff5918; margin-bottom: 8px;">Yearly Opportunity Cost</div>
                <div style="font-size: 40px; font-weight: bold; color: #ff5918;">${yearlyLoss}</div>
                <div style="font-size: 14px; color: #888; margin-top: 4px;">That's a new machine.</div>
            </div>
        </div>
        
        <!-- Breakdown -->
        <div style="background: rgba(0,0,0,0.3); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <h3 style="margin: 0 0 16px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #888;">Your Estimates</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 8px 0; color: #aaa; border-bottom: 1px solid rgba(255,255,255,0.05);">Billing Rate</td>
                    <td style="padding: 8px 0; text-align: right; color: #fff; border-bottom: 1px solid rgba(255,255,255,0.05);">$${billingRate}/hr</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #aaa; border-bottom: 1px solid rgba(255,255,255,0.05);">Quotes per week</td>
                    <td style="padding: 8px 0; text-align: right; color: #fff; border-bottom: 1px solid rgba(255,255,255,0.05);">${quotesPerWeek}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #aaa; border-bottom: 1px solid rgba(255,255,255,0.05);">Time per quote</td>
                    <td style="padding: 8px 0; text-align: right; color: #fff; border-bottom: 1px solid rgba(255,255,255,0.05);">${timePerQuote} min</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #aaa; border-bottom: 1px solid rgba(255,255,255,0.05);">Wasted time per quote</td>
                    <td style="padding: 8px 0; text-align: right; color: #fff; border-bottom: 1px solid rgba(255,255,255,0.05);">${wastedPerQuote} min</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #aaa; border-bottom: 1px solid rgba(255,255,255,0.05);">Inventory tracking</td>
                    <td style="padding: 8px 0; text-align: right; color: #fff; border-bottom: 1px solid rgba(255,255,255,0.05);">${inventoryHours} hrs/wk</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #aaa;">Stockout delays</td>
                    <td style="padding: 8px 0; text-align: right; color: #fff;">${stockoutDays} day/mo</td>
                </tr>
            </table>
        </div>
        
        <!-- CTA -->
        <div style="text-align: center; margin-bottom: 32px;">
            <p style="color: #aaa; margin-bottom: 20px;">Ready to stop losing money?</p>
            <a href="https://cal.com/airshop/demo" style="display: inline-block; background: #ff5918; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: bold; font-size: 16px;">Book a Demo</a>
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.1);">
            <p style="color: #666; font-size: 12px; margin: 0;">
                AirShop — Quoting & inventory for shops that make things.
            </p>
            <p style="color: #666; font-size: 12px; margin: 8px 0 0 0;">
                <a href="https://airshop.works" style="color: #888; text-decoration: none;">airshop.works</a>
            </p>
        </div>
    </div>
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
                from: 'AirShop <hello@airshop.works>',
                to: emails,
                subject: `Your Lost Revenue Estimate: ${yearlyLoss}/year`,
                html: emailHtml,
                // Also send a copy to AirShop for lead tracking
                bcc: ['leads@airshop.works']
            })
        });

        if (!resendResponse.ok) {
            const errorData = await resendResponse.json();
            console.error('Resend error:', errorData);
            throw new Error('Failed to send email via Resend');
        }

        const result = await resendResponse.json();
        
        // Add contact to Resend Audience for email list
        const AUDIENCE_ID = '20235748-374c-4d2f-b560-e5cb88f183fe';
        try {
            await fetch(`https://api.resend.com/audiences/${AUDIENCE_ID}/contacts`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${RESEND_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: emails[0],
                    first_name: name || '',
                    unsubscribed: false
                })
            });
            console.log('Contact added to audience:', emails[0]);
        } catch (audienceError) {
            // Don't fail the whole request if audience add fails
            console.error('Failed to add contact to audience:', audienceError);
        }
        
        // Log the lead
        console.log('Estimate sent:', {
            emails,
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
