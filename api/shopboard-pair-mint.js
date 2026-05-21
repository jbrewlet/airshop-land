/**
 * Mint a one-time pairing code (15-minute TTL). Shopboard exchanges it via shopboard-pair-redeem.
 *
 * Authenticated callers:
 *   Authorization: Bearer <SHOPBOARD_PAIR_MINT_SECRET>
 * or HTML form: mint_secret (same value).
 *
 * Optional: programmatic AirShop installs can POST JSON with Bearer and supply their own JWT:
 *   { "access_token": "...", "licensed": true, "tier": "airshop", "shop_name": "...", "updates_until": "..." }
 */

import crypto from 'crypto';

import {
    storePairingPayload,
} from './lib/shopboard-pair-store.js';
import {
    escapeHtml,
    generatePairDisplayCode,
    getBearerToken,
    mintSecretMatches,
    normalizeTier,
    parseJsonOrForm,
    requireRedisInProd,
} from './lib/shopboard-pair-utils.js';

const PAIR_SEC = Number(process.env.SHOPBOARD_PAIR_TTL_SEC || 900);

function syntheticAccessToken() {
    const raw = crypto.randomBytes(32).toString('base64url');
    return `sb_${raw}`;
}

async function mintOne(attrs) {
    const access_token =
        typeof attrs.access_token === 'string' && attrs.access_token.trim()
            ? attrs.access_token.trim()
            : syntheticAccessToken();

    const licensed = attrs.licensed === undefined ? true : Boolean(attrs.licensed);
    const tier = normalizeTier(attrs.tier);
    const shop_name =
        attrs.shop_name != null && String(attrs.shop_name).trim()
            ? String(attrs.shop_name).trim()
            : '';
    const updates_until =
        attrs.updates_until != null && String(attrs.updates_until).trim()
            ? String(attrs.updates_until).trim()
            : null;

    const payload = {
        access_token,
        licensed,
        tier,
        shop_name: shop_name || null,
        updates_until,
    };

    let displayCode = generatePairDisplayCode();
    displayCode = displayCode.toUpperCase();
    const norm = displayCode.replace(/-/g, '');
    await storePairingPayload(norm, payload, PAIR_SEC);
    return { displayCode, normalized: norm };
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const body = parseJsonOrForm(req.body);
    const bearerOk = mintSecretMatches(getBearerToken(req.headers));
    const formOk = mintSecretMatches(body.mint_secret);
    if (!bearerOk && !formOk) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!requireRedisInProd(res)) return;

    if (!PAIR_SEC || !Number.isFinite(PAIR_SEC) || PAIR_SEC < 60 || PAIR_SEC > 3600) {
        return res.status(500).json({ error: 'Invalid SHOPBOARD_PAIR_TTL_SEC' });
    }

    try {
        const merged = {
            access_token: body.access_token,
            licensed: body.licensed !== undefined ? body.licensed : true,
            tier: body.tier,
            shop_name: body.shop_name,
            updates_until: body.updates_until,
        };

        const wantsHtml =
            typeof body.format === 'string' && body.format.toLowerCase() === 'html';

        const { displayCode } = await mintOne(merged);

        if (wantsHtml) {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            return res
                .status(200)
                .send(`<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Pairing code</title></head><body style="font-family:system-ui;padding:24px;line-height:1.5;"><h1>Pairing code</h1><p>Enter this code on your Shopboard (wizard or admin AirShop pairing) within <strong>${escapeHtml(String(PAIR_SEC / 60))}</strong> minutes:</p><p style="font-size:1.5rem;letter-spacing:0.06em;"><strong>${escapeHtml(displayCode)}</strong></p><p>This page is operator-only.</p></body></html>`);
        }

        const exp = Math.floor(Date.now() / 1000) + PAIR_SEC;
        return res.status(200).json({
            code: displayCode,
            expires_at: exp,
            expires_in_sec: PAIR_SEC,
        });
    } catch (e) {
        console.error('[shopboard-pair-mint]', e.message);
        return res.status(500).json({ error: 'Mint failed' });
    }
}
