# Latest Updates feed (`updates.json`)

End-to-end authoring, surfaces, CTAs, and deploy checks: **[latest-updates-guidance.md](./latest-updates-guidance.md)** (mirror in AirShop under `docs/features/`).

This file is consumed by:

- **`/updates/`** marketing page (`index.html`), same origin
- **AirShop** app dashboard via **`/api/airshop-latest`** (server fetch with caching)

## Root object

| Field           | Type   | Notes |
|----------------|--------|--------|
| `version`       | string | Schema revision (currently `"1"`). |
| `lastUpdated`   | string | Optional bookkeeping for editors. Not shown on the public `/updates/` page. |
| `items`         | array  | Updates, newest first recommended. |

## Item object

| Field          | Type    | Notes |
|----------------|---------|--------|
| `id`           | string  | Stable slug, used for analytics (`entity_id`). |
| `date`         | string  | `YYYY-MM-DD`. |
| `title`        | string  | Headline. |
| `summary`      | string  | Short teaser shown on home feed and marketing index. |
| `category`     | string  | Optional. Only used for substantive tags (`Fix`, `Improvement`). Omit for ordinary AirShop announcements; the public page does **not** show generic product labels. |
| `featured`     | boolean | If true, prefer for compact in-app teaser. |
| `helpsWith`    | string  | Optional legacy field (not shown on `/updates/`). Fold extra context into `summary` if needed. |
| `publicUrl`    | string  | Canonical “Learn more” URL. For substantive updates, use the static page path (`/updates/<slug>/`). Use **HTTPS** for other domains. The app resolves paths against `https://airshopapp.com`. Do **not** reuse the same URL as **`ctaUrl`**; see **[latest-updates-guidance.md](./latest-updates-guidance.md)**. |
| `ctaLabel`     | string  | Optional label for **`ctaUrl`**. Can supply the **only** button when **`publicUrl` is omitted**. |
| `ctaUrl`       | string  | Same rules as `publicUrl` (`/` paths or full `https://…`). In-app clicks use **`publicUrl`** first, then **`ctaUrl`**, then the public changelog URL. |
| `audiences`    | string array | Reserved for future segmented releases (marketing copy only). |
| `resendCampaignId` | string | Reserved future use: Resend broadcast id only. Never secrets. |
| `appArea`      | string  | Optional label: `Home`, `Quotes`, `Inventory`, etc. |
| `details`      | array   | Optional structured detail metadata for richer update pages or future generation. The AirShop app feed ignores this and keeps using `summary`. |

## `details` array (optional)

Each entry:

| Field      | Type   | Notes |
|------------|--------|--------|
| `heading`  | string | Optional section heading for richer update pages or future static generation. |
| `items`    | string array | Bullets shown under the heading. Keep them short enough to scan. |

## `media` array (optional)

Each entry:

| Field      | Type   | Notes |
|------------|--------|--------|
| `type`     | `"image"` \| `"gif"` \| `"video"` | GIFs use `gif` type; browsers still use `<img>` for remote GIF URLs. |
| `src`      | string | **`https://…`** for off-site assets, or **root-relative** (`/AirShop-OPG.png`), or **path-relative** (`../foo.png`). Same-site URLs work locally; AirShop dashboards resolve them against `https://airshopapp.com`. |
| `alt`      | string | Required for images and GIFs (accessibility). |
| `poster`   | string | Optional video poster (`https://…`, `/`, `./`, `../`). |
| `caption`  | string | Optional short caption shown under media. |

**Video:** Prefer short MP4/WebM URLs you host on the marketing CDN or Pages; `<video controls playsinline muted>` improves autoplay teaser behavior if you add a player later.
