/**
 * POST license check-in (Shopboard cron + admin Refresh).
 *
 * Headers: Authorization: Bearer <access_token>
 * Body: { "device_id": "hex" }
 *
 * Mirrors the Pi's AIRSHOP_LICENSE_URL contract from shopboard/server/lib/airshop-license.ts.
 */

import { getBearerToken, normalizeTier } from './lib/shopboard-pair-utils.js';
import {
    getLicenseByAccessToken,
    persistTokenLicense,
} from './lib/shopboard-pair-store.js';

const TOKEN_SEC = Number(process.env.SHOPBOARD_PAIR_TOKEN_TTL_SEC || (86400 * 365));

function parseBody(rawBody) {
    if (rawBody == null) return {};
    if (typeof rawBody === 'object' && !Array.isArray(rawBody)) return rawBody;
    if (typeof rawBody === 'string') {
        try {
            return JSON.parse(rawBody);
        } catch {
            return {};
        }
    }
    return {};
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const token = getBearerToken(req.headers);
    if (!token) return res.status(401).json({ error: 'Missing bearer token' });

    const body = parseBody(req.body);
    const device_id = typeof body.device_id === 'string' ? body.device_id.trim() : '';
    if (!device_id) {
        return res.status(400).json({ error: 'device_id required' });
    }

    try {
        const snap = await getLicenseByAccessToken(token);
        if (!snap) {
            return res.status(401).json({ error: 'Unknown or revoked token' });
        }

        const tier = normalizeTier(snap.tier);
        /** Refresh sliding lease on successful check-ins */
        await persistTokenLicense(
            token,
            {
                licensed: Boolean(snap.licensed),
                tier,
                shop_name: snap.shop_name != null ? snap.shop_name : null,
                updates_until:
                    snap.updates_until != null ? snap.updates_until : null,
            },
            TOKEN_SEC
        );

        return res.status(200).json({
            licensed: Boolean(snap.licensed),
            tier,
            shop_name: snap.shop_name ?? null,
            updates_until: snap.updates_until ?? null,
        });
    } catch (e) {
        console.error('[shopboard-license-check]', e.message);
        return res.status(500).json({ error: 'License lookup failed' });
    }
}
