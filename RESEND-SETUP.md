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
2. In **api/send-estimate.js**, `from` and default `bcc` are `team@airshopapp.com`; override BCC with `ADMIN_EMAILS` env if needed.

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

The "Get the Guide" form adds contacts to your Resend **leads** segment and sends the welcome email.

## How it works

- Form includes honeypot (`website`)—rejects spam without CAPTCHA.
- Form POSTs directly to **AirShop API** at `https://airshop.work/api/leads/guide-signup`.
- The API creates the contact in Resend, adds to LEADS segment, opts into Lead Guide Series topic, sends welcome email, and records the send in DB.
- Form fields: `email` (required), `firstName` (optional), `lastName` (optional).
- Logic lives in **js/guide-signup.js**; loaded by index.html and all blog pages.

## Rollback

If needed, revert the form to POST to the Zapier webhook. The API continues to support `?source=zapier` for backward compatibility.

---

## Send Estimate (AirShop API)

When you add `POST /api/leads/send-estimate` to the AirShop API, point the form there instead of Zapier. See **AIRSHOP-API-SEND-ESTIMATE-SPEC.md** for the full implementation spec.

- **From:** team@airshopapp.com
- **Subject:** Stop losing {{monthlyLoss}}/month 🟧 AirShop
- **BCC:** Admin emails (ADMIN_EMAILS env or team@airshopapp.com)
- **Body:** Light-theme HTML template in api/send-estimate.js

---

## Summary

| What              | Estimate (current) | Estimate (after API) | Signup (landing page) |
|-------------------|--------------------|----------------------|------------------------|
| airshopapp.com    | GitHub Pages       | GitHub Pages         | GitHub Pages           |
| Form POSTs to     | Zapier webhook     | AirShop API          | AirShop API            |
| Sends/adds via    | Zapier → Resend    | AirShop API → Resend | AirShop API → Resend   |
| Resend API key    | Stored in Zapier   | In AirShop API env   | In AirShop API env     |

**Estimate (current):** Zapier Catch Hook → Resend Send Email.  
**Estimate (after):** Form → `https://airshop.work/api/leads/send-estimate` → Resend.  
**Signup:** Form → `https://airshop.work/api/leads/guide-signup` → Resend (contact, segment, topic, welcome email).
