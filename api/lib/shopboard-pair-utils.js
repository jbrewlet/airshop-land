import crypto from 'crypto';
import { storeBackedByRedis } from './shopboard-pair-store.js';

const PAIR_CHARSET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

/** @returns {string} display form XXXX-XXXX */
export function generatePairDisplayCode() {
    const buf = crypto.randomBytes(8);
    let raw = '';
    for (let i = 0; i < 8; i++) {
        raw += PAIR_CHARSET[buf[i] % PAIR_CHARSET.length];
    }
    return `${raw.slice(0, 4)}-${raw.slice(4)}`;
}

/** Normalize user input → 8 alphanumeric chars or null */
export function normalizePairCode(input) {
    const s = String(input || '')
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '');
    return s.length === 8 ? s : null;
}

const TIERS = new Set(['personal', 'airshop']);

export function normalizeTier(raw) {
    const t = String(raw || 'personal').toLowerCase();
    return TIERS.has(t) ? t : 'personal';
}

/**
 * @param {Record<string,string|undefined>} headers
 */
export function getBearerToken(headers) {
    const raw = headers && headers.authorization;
    if (!raw || typeof raw !== 'string') return '';
    const m = raw.match(/^Bearer\s+(.+)$/i);
    return m ? m[1].trim() : '';
}

export function timingSafeEqualStr(a, b) {
    try {
        const x = Buffer.from(String(a || ''), 'utf8');
        const y = Buffer.from(String(b || ''), 'utf8');
        if (x.length === 0 || x.length !== y.length) return false;
        return crypto.timingSafeEqual(x, y);
    } catch {
        return false;
    }
}

export function mintSecretMatches(candidate) {
    const expected = (process.env.SHOPBOARD_PAIR_MINT_SECRET || '').trim();
    if (!expected || !candidate) return false;
    return timingSafeEqualStr(candidate.trim(), expected);
}

export function requireRedisInProd(res) {
    const prod =
        process.env.VERCEL_ENV === 'production' ||
        process.env.NODE_ENV === 'production';
    const allowMemory = /^(1|true|yes|on)$/i.test(
        (process.env.SHOPBOARD_PAIR_ALLOW_MEMORY || '').trim()
    );
    if (prod && !storeBackedByRedis() && !allowMemory) {
        res.status(503).json({
            error:
                'Pairing store not configured — set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN (recommended), or SHOPBOARD_PAIR_ALLOW_MEMORY=1 only for demos',
        });
        return false;
    }
    return true;
}

export function parseJsonOrForm(rawBody) {
    if (rawBody == null) return {};
    if (typeof rawBody === 'object' && !Array.isArray(rawBody)) return rawBody;
    if (typeof rawBody === 'string') {
        try {
            return JSON.parse(rawBody);
        } catch {
            return Object.fromEntries(new URLSearchParams(rawBody));
        }
    }
    return {};
}

export function escapeHtml(s) {
    return String(s || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
