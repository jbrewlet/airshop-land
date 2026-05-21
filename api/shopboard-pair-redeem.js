/**
 * Public endpoint: exchange pairing code for a Shopboard access token (Pi / browser).
 * POST JSON: { "code": "XXXX-XXXX", "device_id": "hex" }
 */

import {
    consumePairingPayload,
    persistTokenLicense,
} from './lib/shopboard-pair-store.js';
import {
    normalizePairCode,
    normalizeTier,
    parseJsonOrForm,
    requireRedisInProd,
} from './lib/shopboard-pair-utils.js';

const TOKEN_SEC = Number(process.env.SHOPBOARD_PAIR_TOKEN_TTL_SEC || (86400 * 365));

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!requireRedisInProd(res)) return;

    const body = parseJsonOrForm(req.body);
    const codeRaw = typeof body.code === 'string' ? body.code.trim() : '';
    const norm = normalizePairCode(codeRaw);
    if (!norm) {
        return res.status(400).json({ error: 'Invalid or missing pairing code' });
    }
    const device_id = typeof body.device_id === 'string' ? body.device_id.trim() : '';
    if (!device_id || device_id.length > 512) {
        return res.status(400).json({ error: 'device_id required (from Shopboard wizard)' });
    }

    try {
        const payload = await consumePairingPayload(norm);
        if (!payload || typeof payload.access_token !== 'string') {
            return res.status(400).json({ error: 'Invalid or expired pairing code' });
        }

        const licensePayload = {
            licensed: payload.licensed !== undefined ? Boolean(payload.licensed) : true,
            tier: normalizeTier(payload.tier),
            shop_name: payload.shop_name != null ? payload.shop_name : null,
            updates_until: payload.updates_until != null ? payload.updates_until : null,
        };

        await persistTokenLicense(payload.access_token, licensePayload, TOKEN_SEC);

        return res.status(200).json({
            access_token: payload.access_token,
            licensed: licensePayload.licensed,
            tier: licensePayload.tier,
            shop_name: licensePayload.shop_name,
            updates_until: licensePayload.updates_until,
        });
    } catch (e) {
        console.error('[shopboard-pair-redeem]', e.message);
        return res.status(500).json({ error: 'Pairing redemption failed' });
    }
}
