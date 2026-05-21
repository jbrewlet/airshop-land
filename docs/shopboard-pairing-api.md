# Shopboard pairing API (airshopapp.com)

Serverless routes under `api/` implement **mint → redeem → license check** for AirShop Shopboard. Codes are **single-use** and default to a **15-minute** TTL; bearer tokens issued at redeem are stored for license lookup (Redis recommended).

## Environment variables

| Name | Required | Description |
|------|----------|-------------|
| `SHOPBOARD_PAIR_MINT_SECRET` | Yes | Shared secret — `Authorization: Bearer …` **or** form field `mint_secret` when minting |
| `UPSTASH_REDIS_REST_URL` | Production | Upstash Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Production | Upstash REST token |
| `SHOPBOARD_PAIR_ALLOW_MEMORY` | No | Set to `1` only for demos when Redis is unavailable (not for real traffic) |
| `SHOPBOARD_PAIR_TTL_SEC` | No | Pairing code lifetime (default `900` = 15 minutes) |
| `SHOPBOARD_PAIR_TOKEN_TTL_SEC` | No | Token record TTL used by redeem + license refresh (default 365 days) |

## Routes (HTTP)

### `POST /api/shopboard-pair-mint`

Creates a pairing code. Auth: Bearer **or** `mint_secret` in JSON / form body (same value as `SHOPBOARD_PAIR_MINT_SECRET`).

JSON body (optional fields):

```json
{
  "access_token": "optional_jwt_if_core_app_issues_token",
  "licensed": true,
  "tier": "airshop",
  "shop_name": "My shop",
  "updates_until": "2027-12-31"
}
```

Success:

```json
{ "code": "ABCD-EFGH", "expires_at": 1710000000, "expires_in_sec": 900 }
```

HTML response: append `"format":"html"` to a **trusted** programmatic call, or use the `/shopboard/account.html` operator form (`format=html` hidden field).

### `POST /api/shopboard-pair-redeem`

Public **from the Pi**. Body:

```json
{ "code": "ABCD-EFGH", "device_id": "hex_from_shopboard" }
```

Success (Shopboard-compatible):

```json
{
  "access_token": "…",
  "licensed": true,
  "tier": "airshop",
  "shop_name": "My shop",
  "updates_until": "2027-12-31"
}
```

### `POST /api/shopboard-license-check`

Headers: `Authorization: Bearer <access_token>`  
Body: `{ "device_id": "hex" }`

Response mirrors Shopboard’s `AIRSHOP_LICENSE_URL` contract: `licensed`, `tier`, `shop_name`, `updates_until`.

## Operator UI

`/shopboard/account.html` — operator fallback on the marketing site (mint secret entered per session). The signed-in AirShop app at **airshop.work** uses **Settings → Integrations → Shopboard** (`/settings/integrations/shopboard`).

## License tiers

Only two tiers exist:

| Tier | Meaning |
|------|---------|
| `personal` | Free / hobby use |
| `airshop` | Paid AirShop plan (commercial use) |

Any unrecognized tier value normalizes to `personal`.

## Operational notes

- **Never** expose `SHOPBOARD_PAIR_MINT_SECRET` in static client-side scripts.
- Prefer **Redis** so mint/redeem stay consistent across all regions and cold starts.

## Pi image download

Large `.img` files should **not** live in Supabase. Host on **GitHub** (Releases asset recommended — Pi images are multi‑GB; avoid committing to the Pages tree).

| Name | App | Description |
|------|-----|-------------|
| `SHOPBOARD_DOWNLOAD_SECRET` | AirShop + airshop-land | Shared HMAC secret for download tokens |
| `SHOPBOARD_IMAGE_URL` | airshop-land only | Full HTTPS URL to the `.img.xz` release asset (e.g. GitHub Releases). Never set on AirShop. |
| `SHOPBOARD_DOWNLOAD_GATE_URL` | AirShop (optional) | Defaults to `https://airshopapp.com/api/shopboard-download` |

Flow:

1. User clicks **Download Pi image** in AirShop (`GET /api/shopboard/download`) — session required.
2. AirShop mints `{ exp, jti, sub, org_id }` + HMAC, redirects to `/api/shopboard-download?t=…` on airshopapp.com.
3. Gate verifies signature, expiry, and **one-time `jti`** (Upstash Redis recommended), then `302` to `SHOPBOARD_IMAGE_URL`.

Sharing the gate URL works only once and expires in ~15 minutes. The GitHub asset URL may appear in the browser network tab after redirect — keep it unlisted (Releases only, not linked from marketing) and rotate release assets if needed.
