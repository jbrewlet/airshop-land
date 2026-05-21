/**
 * Ephemeral pairing codes + persisted Shopboard bearer tokens for license check-in.
 * Production: Upstash Redis REST (recommended on Vercel).
 * Fallback: in-memory singleton (warm Lambdas only; not suitable for multi-instance).
 */

import crypto from 'crypto';

const MEM_PAIR = {};
const MEM_TOK = {};

const hasUpstash = () =>
    Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

async function redisPipeline(commandArrays) {
    const baseRaw = process.env.UPSTASH_REDIS_REST_URL || '';
    const token = process.env.UPSTASH_REDIS_REST_TOKEN || '';
    const base = baseRaw.replace(/\/?$/, '');
    const res = await fetch(`${base}/pipeline`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(commandArrays),
    });
    const text = await res.text();
    if (!res.ok) {
        throw new Error(`Redis pipeline HTTP ${res.status}: ${text.slice(0, 200)}`);
    }
    try {
        return JSON.parse(text);
    } catch {
        throw new Error('Redis pipeline invalid JSON');
    }
}

function pipelineResult(response, index) {
    if (Array.isArray(response)) return response[index] && response[index].result;
    if (response && Array.isArray(response.result)) return response.result[index];
    return undefined;
}

function memoryPairSet(code, json, ttlSec) {
    const exp = Math.floor(Date.now() / 1000) + ttlSec;
    MEM_PAIR[code] = { json, exp };
}

function memoryPairGetDel(code) {
    const row = MEM_PAIR[code];
    if (!row) return null;
    delete MEM_PAIR[code];
    if (Math.floor(Date.now() / 1000) > row.exp) return null;
    return row.json;
}

function memoryTokSet(key, json, ttlSec) {
    const exp = Math.floor(Date.now() / 1000) + ttlSec;
    MEM_TOK[key] = { json, exp };
}

function memoryTokGet(key) {
    const row = MEM_TOK[key];
    if (!row) return null;
    if (Math.floor(Date.now() / 1000) > row.exp) {
        delete MEM_TOK[key];
        return null;
    }
    return row.json;
}

const pairKey = (code) => `sbpair:code:${code}`;
const tokKey = (hashHex) => `sbpair:tok:${hashHex}`;

export function tokenHash(accessToken) {
    return crypto.createHash('sha256').update(accessToken, 'utf8').digest('hex');
}

/**
 * @param {string} codeNormalized
 * @param {object} payload — JSON-serializable license + token bundle (stored until redeem)
 * @param {number} ttlSec — pairing code TTL (900 = 15 min)
 */
export async function storePairingPayload(codeNormalized, payload, ttlSec) {
    const raw = JSON.stringify(payload);
    if (hasUpstash()) {
        await redisPipeline([['SET', pairKey(codeNormalized), raw, 'EX', String(ttlSec)]]);
        return;
    }
    memoryPairSet(pairKey(codeNormalized), raw, ttlSec);
}

/**
 * Atomically consume pairing code if present and unexpired.
 * @returns {object | null} parsed payload
 */
export async function consumePairingPayload(codeNormalized) {
    const k = pairKey(codeNormalized);
    if (hasUpstash()) {
        const r = await redisPipeline([[ 'GETDEL', k ]]);
        const cell = pipelineResult(r, 0);
        if (cell == null || cell === '') return null;
        try {
            return JSON.parse(String(cell));
        } catch {
            return null;
        }
    }
    const raw = memoryPairGetDel(k);
    if (!raw) return null;
    try {
        return JSON.parse(String(raw));
    } catch {
        return null;
    }
}

/** Persist bearer token lookup for license API (long TTL). */
export async function persistTokenLicense(accessToken, licensePayload, ttlSec) {
    const key = tokKey(tokenHash(accessToken));
    const raw = JSON.stringify(licensePayload);
    if (hasUpstash()) {
        await redisPipeline([['SET', key, raw, 'EX', String(ttlSec)]]);
        return;
    }
    memoryTokSet(key, raw, ttlSec);
}

/** @returns {object | null} */
export async function getLicenseByAccessToken(accessToken) {
    const key = tokKey(tokenHash(accessToken));
    if (hasUpstash()) {
        const r = await redisPipeline([[ 'GET', key ]]);
        const cell = pipelineResult(r, 0);
        if (cell == null || cell === '') return null;
        try {
            return JSON.parse(String(cell));
        } catch {
            return null;
        }
    }
    const raw = memoryTokGet(key);
    if (!raw) return null;
    try {
        return JSON.parse(String(raw));
    } catch {
        return null;
    }
}

export function storeBackedByRedis() {
    return hasUpstash();
}
