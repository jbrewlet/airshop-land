# Sending Estimate Emails (Resend)

**Your site:** airshopapp.com on GitHub Pages. It stays there.

**Current setup:** Estimate sending uses **Zapier** → Resend. Form POSTs to a Zapier webhook; a Zap sends the email via Resend.

When someone clicks "Send My Estimate," the form POSTs to a URL. Two ways to do that:

- **Option A: Zapier** – No code, no extra host. Form POSTs to a Zapier webhook; a Zap sends the email via Resend.
- **Option B: Serverless (Vercel, etc.)** – Deploy **api/send-estimate.js** somewhere; form POSTs there.

---

# Option A: Zapier (no extra host)

You only need Zapier (and Resend for sending). No Vercel, no code to deploy.

## 1. Resend

1. [resend.com](https://resend.com) → API key, verify your sending domain.
2. You'll connect Resend to Zapier in the Zap (API key stays in Zapier).

## 2. Create the Zap

1. **Zapier** → Create Zap.
2. **Trigger:** **Webhooks by Zapier** → **Catch Hook**.
   - Choose "Trigger on a new request."
   - Copy the webhook URL Zapier gives you (e.g. `https://hooks.zapier.com/hooks/catch/12345/abcdef/`).
3. **Action:** **Resend** → **Send Email**.
   - Connect your Resend account (paste API key when asked).
   - Map fields from the webhook to the email:
     - **To:** use the first value from the `emails` array (e.g. `emails` → first item). If Zapier shows the raw array, you may need a Formatter step to get "first item" or use a single "To" field you build from the form.
     - **From:** your verified address (e.g. `hello@airshopapp.com`).
     - **Subject:** e.g. `Your Lost Revenue Estimate: {{yearlyLoss}}`
     - **Body:** use the webhook fields (`monthlyLoss`, `yearlyLoss`, `name`, `company`, etc.) to build the email (HTML or plain text). You can copy the content idea from **api/send-estimate.js** if you want the same layout.
4. (Optional) Add a **Filter** step before Resend: only continue if a secret field in the payload matches a value you set (so random POSTs to the webhook don't send emails). The form would need to send that secret; we can add it if you want.
5. Test the Zap (submit the form once), then turn it on.

## 3. Point the form at the webhook

In **index.html**, find where the form is submitted (search for `estimateApiUrl` or `send-estimate`). Set:

```javascript
const estimateApiUrl = 'https://hooks.zapier.com/hooks/catch/XXXXX/YYYYY/';
```

Use the exact URL from the Zapier "Catch Hook" step. Commit and push.

**Note:** That URL is in your front-end code, so anyone who inspects the page could POST to it. A Filter in Zapier (e.g. "only if `secret` equals …") or Zapier's task limits reduce abuse. For a lead magnet it's usually acceptable.

---

# Option B: Serverless (Vercel, Netlify, etc.)

Use this if you prefer to run **api/send-estimate.js** yourself (same HTML email, full control).

## 1. Resend

1. [resend.com](https://resend.com) → API key, verify sending domain.
2. In **api/send-estimate.js**, set `from` and `bcc` to your real addresses.

## 2. Deploy the API

- Deploy this repo (or the **api/** folder) to Vercel, Netlify Functions, or any host that runs Node and accepts HTTP.
- Set env var **RESEND_API_KEY** to your Resend API key.
- Note the URL of the deployed endpoint (e.g. `https://your-project.vercel.app/api/send-estimate`).

## 3. Point the form at that URL

In **index.html**, set:

```javascript
const estimateApiUrl = 'https://your-project.vercel.app/api/send-estimate';
```

Commit and push.

---

# Email List Signup (Landing Page)

The "Win more quotes, waste less time" form adds contacts to your Resend **leads** segment for the welcome sales series.

## How it works

- Form includes honeypot (`website`) and timing check—rejects spam without CAPTCHA.
- Form POSTs to a Zapier webhook; a Zap adds the contact to Resend with:
  - Segment: `20235748-374c-4d2f-b560-e5cb88f183fe` (leads)
  - Property: `LeadType: "landing_page_signup"`
- Resend triggers your welcome sales series based on the segment (configure in Resend dashboard).
- Email templates for the series can be managed from your app at github.com/jbrewlet/airshop.

## Zapier setup (no Vercel deployment)

**api/signup-lead.js** exists if you ever want to deploy to Vercel/Netlify instead; for now, use Zapier. If deployed, set `AIRSHOP_WEBHOOK_URL` to notify the airshop app when a lead signs up (e.g. `https://app.airshop.works/api/webhooks/landing-signup`).

1. **Zapier** → Create Zap.
2. **Trigger:** **Webhooks by Zapier** → **Catch Hook**.
   - Copy the webhook URL.
3. **Action:** **Resend** → **Create Contact** (or **Add Contact to Segment**).
   - Connect your Resend account.
   - Map `email` from the webhook payload.
   - Add to segment `20235748-374c-4d2f-b560-e5cb88f183fe`.
   - Set custom property `LeadType: "landing_page_signup"` if supported.
4. **Filter:** Only continue if `website` is empty (honeypot) and `form_load_time` indicates > 3 seconds since page load (optional; or handle in a later step).
5. Test the Zap, then turn it on.

## Point the form at the webhook

In **index.html**, search for `signupApiUrl` and set:

```javascript
const signupApiUrl = 'https://hooks.zapier.com/hooks/catch/XXXXX/YYYYY/';
```

Use the exact URL from the Zapier "Catch Hook" step.

## Resend setup

1. Create the **LeadType** contact property in Resend (Dashboard → Audiences → Properties) if not already created.
2. Configure your welcome sales series / broadcast for the leads segment in Resend.

---

## Summary

| What              | Estimate (current) | Signup (landing page) |
|-------------------|--------------------|------------------------|
| airshopapp.com    | GitHub Pages       | GitHub Pages           |
| Form POSTs to     | Zapier webhook     | Zapier webhook         |
| Sends/adds via    | Zapier → Resend    | Zapier → Resend        |
| Resend API key    | Stored in Zapier   | Stored in Zapier       |

**Estimate:** Zapier Catch Hook → Resend Send Email.  
**Signup:** Zapier Catch Hook → Resend Create Contact / Add to Segment.
