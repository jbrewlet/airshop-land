# Repo Separation: airshop-land vs AirShop

## Overview

| Repo | URL | Host | Purpose |
|------|-----|------|---------|
| **airshop-land** | airshopapp.com | GitHub Pages | Marketing landing page (static) |
| **AirShop** | airshop.work | Vercel | App + API (Next.js) |

---

## airshop-land (`/Users/jbrw/airshop-land`)

**What lives here:** Static marketing site only. No backend, no serverless.

### Contains

- **index.html** — Landing page with ROI calculator, hero, features, CTA
- **blog/** — Blog articles (static HTML)
- **js/guide-signup.js** — Form handler: POSTs to `https://airshop.work/api/leads/guide-signup`
- **js/cal-embed.js**, **js/ga.js**, **js/load-footer.js** — Client-side scripts
- **footer.html**, **CNAME**, **sitemap.xml** — Site config
- **api/send-estimate.js**, **api/signup-lead.js** — Reference/fallback serverless functions (not deployed by airshop-land)
- **RESEND-SETUP.md** — Setup docs (Zapier vs API options)
- **AIRSHOP-API-SEND-ESTIMATE-SPEC.md** — Spec for the send-estimate API (in AirShop)

### ROI Calculator Form (index.html)

- Collects: email, name, company, billingRate, monthlyLoss, yearlyLoss, etc.
- **POSTs to:** `https://airshop.work/api/leads/send-estimate` (AirShop API)
- No Resend, no env vars, no backend logic — just `fetch()` to the API

### Guide Signup Form ("Get the Guide" — index.html + blog pages)

- Collects: email, firstName, lastName (honeypot: website)
- **POSTs to:** `https://airshop.work/api/leads/guide-signup` (AirShop API)
- Handler: **js/guide-signup.js** (loaded by index.html and all blog pages)
- No Resend, no env vars — just `fetch()` to the API

### api/send-estimate.js — Reference / Fallback Only

- **Not deployed by airshop-land.** GitHub Pages cannot run serverless functions.
- **Purpose:** Reference implementation and optional fallback (Option B in RESEND-SETUP.md).
- If you deploy it to Vercel/Netlify separately, you’d point the form at that URL instead of airshop.work.
- **Current setup:** Form points at `airshop.work` → this file is unused in production.
- **Use it for:** Copying the email template/layout when updating the AirShop API.

### api/signup-lead.js — Reference / Fallback Only

- **Not deployed by airshop-land.** Same as api/send-estimate.js.
- **Purpose:** Standalone serverless option (e.g. if you didn’t use the AirShop API).
- **Current setup:** Guide signup form POSTs to `airshop.work` → this file is unused in production.

---

## AirShop (`/Users/jbrw/AirShop`)

**What lives here:** Full app + all backend logic.

### Contains

- **POST /api/leads/send-estimate** — Handles ROI estimate form:
  - Sends email via Resend
  - Adds contact to LEADS segment with LeadType: Land Estimate
  - Records in `subscription_email_sends`
- **POST /api/leads/guide-signup** — Handles “Get the Guide” form:
  - Adds contact to LEADS segment, opts into Lead Guide Series topic
  - Sends welcome email (lead_welcome_1)
  - Records in `subscription_email_sends`
- **src/helpers/SendEstimateEmailTemplate.ts** — Email template (should match api/send-estimate.js layout)
- **src/lib/resend.ts** — Resend client, segments, contact creation
- All env vars: `RESEND_API_KEY`, `RESEND_SEGMENT_LEADS`, `ADMIN_EMAILS`, etc.

---

## Data Flow

```
airshop-land (airshopapp.com)          AirShop (airshop.work)
────────────────────────────          ────────────────────────

ROI Calculator Form
  └─ fetch(POST) ──────────────────────► /api/leads/send-estimate
                                            ├─ Resend: send email
                                            ├─ Resend: add contact (LEADS, LeadType: Land Estimate)
                                            └─ Supabase: subscription_email_sends

"Get the Guide" Form (email-signup-form)
  └─ fetch(POST) ──────────────────────► /api/leads/guide-signup
                                            ├─ Resend: add contact to LEADS, opt into topic
                                            ├─ Resend: send welcome email (lead_welcome_1)
                                            └─ Supabase: subscription_email_sends
```

---

## Summary

| Concern | airshop-land | AirShop |
|---------|--------------|---------|
| HTML/CSS/JS for landing page | ✅ | ❌ |
| ROI calculator form UI | ✅ | ❌ |
| Guide signup form UI (email-signup-form) | ✅ | ❌ |
| Form POST target | URL only (`airshop.work`) | Receives POST |
| Email sending | ❌ | ✅ |
| Resend contacts/segments | ❌ | ✅ |
| Email template | Reference in api/send-estimate.js | SendEstimateEmailTemplate.ts |
| Env vars (RESEND_API_KEY, etc.) | ❌ | ✅ |

**Rule of thumb:** airshop-land = frontend only. AirShop = backend + app.
