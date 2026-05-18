# Latest Updates: guidance

**Mirror:** keep this document aligned with the same file in **AirShop**: `docs/features/latest-updates-guidance.md`.

We ship product notes as **static update pages** plus a **single JSON feed**. The feed powers the AirShop app card and the public `/updates/` index; each substantive update should also have a crawlable page at `/updates/<slug>/`. There are **no Supabase-backed changelog posts**.

## Responsibilities by repo

| Piece | Repository | Location |
|-------|------------|----------|
| **Source of truth** (feed JSON) | **airshop-land** | `updates/updates.json` |
| Public **/updates/** index + post pages | **airshop-land** | `updates/index.html`, `updates/<slug>/index.html`, `updates/updates.css` |
| Field reference (tables) | **airshop-land** | `updates/README-SCHEMA.md` |
| In-app **AirShop Latest** card | **AirShop** | `src/routes/Home/AirShopLatestUpdates/index.tsx` |
| Validated feed API | **AirShop** | `src/app/api/airshop-latest/route.ts` |
| Zod schema (must match JSON) | **AirShop** | `src/schemas/airshopLatestUpdates.ts` |
| Marketing URL resolution | **AirShop** | `src/constants/airshopLatestUpdates.ts` |

## Surfaces

1. **Marketing:** `https://airshopapp.com/updates/` reads `updates.json` in the browser (with cache-busting query on the fetch URL in `index.html`) and links to static update pages for SEO.
2. **App (authenticated home):** `GET /api/airshop-latest` fetches the **same** upstream JSON, validates it, and returns it to the dashboard teaser. Fetches use **Next.js `revalidate` 300s** (see `route.ts`). Override the upstream URL locally or in staging with **`AIRSHOP_LATEST_UPDATES_FEED_URL`** (see **AirShop** `.env.example`).

## Content model (feed, not article CMS)

- Each item is **`title` + `summary`** plus optional **`media`**, **`publicUrl`**, **`ctaUrl`** / **`ctaLabel`**, etc. For substantive updates, set **`publicUrl`** to the canonical static page under `/updates/<slug>/`.
- **`featured`** biases ordering in the compact in-app list.
- Prefer **short, direct copy**; avoid redundant category labels and insider phrasing. Tone is product-facing.

## URLs, paths, and HTTPS

- In JSON, use **root-relative** paths (`/updates/`, `/some-asset.png`) for same-site links and assets so GitHub Pages previews work; use **https** for external sites (e.g. docs).
- The app turns relative marketing paths into absolute URLs with **`resolveAirshopMarketingHref`** (origin **`https://airshopapp.com`**; path-relative entries resolve against **`/updates/`**).

## Buttons and links (avoid duplicates)

**Marketing page**

- If **`publicUrl` and `ctaUrl` resolve to the same place**, only **one** button is shown (label prefers **`ctaLabel`**, else “Learn more”).
- If **`publicUrl` points at the current `/updates/` page**, the primary “Learn more” is **hidden** so we do not circular-link.
- If **`publicUrl` is omitted** but **`ctaUrl` + `ctaLabel`** are set, a **single** labeled button is shown.
- Static update post pages should end with the shared **`update-post-cta`** block: “See how this fits your shop,” with **Open AirShop** and **Book a walkthrough** actions.

**In-app row click**

- Opens: **`publicUrl`** if set, else **`ctaUrl`**, else **`/updates/`** on the marketing origin (see `AirShopLatestUpdates`).

**Editorial rule:** do **not** repeat the same HTTPS URL in **`publicUrl`** and **`ctaUrl`**. Use **`ctaUrl` + `ctaLabel`** for a single outbound CTA, or **`publicUrl`** alone for a single “Learn more”.

## Media

- **`media`** is optional. Use **purposeful** visuals (UI capture, diagram, short video). Avoid using **OG / social preview images** (e.g. logo slabs) as timeline art unless that is the story.
- **`alt`** is required for accessibility on images and GIFs (enforced by schema expectations and good practice).

## Publishing checklist (airshop-land)

1. Create or edit the static page under **`updates/<slug>/index.html`** with canonical URL, meta tags, article JSON-LD, and any video embeds near the top when relevant.
2. Edit **`updates/updates.json`** (keep **`id`** stable across edits; use **`lastUpdated`** for bookkeeping; point **`publicUrl`** at the static page).
3. Add the static page to **`sitemap.xml`** with a real `lastmod`.
4. After JSON or page script changes, **bump** the `?v=` query on the `fetch('./updates.json?...')` URL in **`updates/index.html`** so browsers and CDNs pick up changes.
5. If **`updates.css`** changed, bump its `?v=` on each updated `<link>` as well.
6. Merge / deploy **airshop-land**; verify **`/updates/`**, post pages, sitemap, and JSON in production.
7. Expect the **AirShop** API cache to reflect upstream within the **revalidate** window (or after redeploy if you changed app code).

If the JSON fails Zod validation in the app, the API returns 502; the dashboard should still load (empty / retry messaging per app behavior).

## Related docs

- **AirShop:** `docs/features/latest-updates-release-workflow.md` (planned Resend broadcasts; optional for the feed).
- **airshop-land:** [`README-SCHEMA.md`](./README-SCHEMA.md) (field-by-field reference).
