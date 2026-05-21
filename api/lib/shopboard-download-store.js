/**
 * One-time download token consumption (jti) for Shopboard Pi image gate.
 */

const MEM_JTI = {};

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
    return JSON.parse(text);
}

function pipelineResult(response, index) {
    if (Array.isArray(response)) return response[index] && response[index].result;
    if (response && Array.isArray(response.result)) return response.result[index];
    return undefined;
}

const jtiKey = (jti) => `sbdl:jti:${jti}`;

/**
 * Mark jti as used. Returns true only the first time for this jti within ttlSec.
 * @param {string} jti
 * @param {number} ttlSec
 */
export async function consumeDownloadJti(jti, ttlSec) {
    const ttl = Math.max(60, Math.min(ttlSec, 3600));
    const key = jtiKey(jti);

    if (hasUpstash()) {
        const r = await redisPipeline([['SET', key, '1', 'NX', 'EX', String(ttl)]]);
        const cell = pipelineResult(r, 0);
        return cell === 'OK';
    }

    const now = Math.floor(Date.now() / 1000);
    const row = MEM_JTI[key];
    if (row && row.exp > now) return false;
    MEM_JTI[key] = { exp: now + ttl };
    return true;
}
