/**
 * Validates a short-lived HMAC-signed download token (minted by AirShop after login),
 * enforces one-time use via jti, then redirects to SHOPBOARD_IMAGE_URL.
 *
 * Host the .img on GitHub (Releases asset or unlisted Pages path) — not Supabase.
 * The image URL stays in this env var only; users receive a one-time gate link.
 *
 * Environment (airshop-land / Vercel):
 *   SHOPBOARD_DOWNLOAD_SECRET — shared with AirShop (required)
 *   SHOPBOARD_IMAGE_URL       — HTTPS URL to the .img.xz on GitHub CDN (required)
 *   UPSTASH_REDIS_REST_*      — recommended for one-time jti across serverless instances
 */

import crypto from 'crypto';
import { consumeDownloadJti } from './lib/shopboard-download-store.js';

function verifyToken(token, secret) {
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payloadB64, sigB64] = parts;
  const expectedMac = crypto.createHmac('sha256', secret).update(payloadB64).digest();

  let sigBuf;
  try {
    sigBuf = Buffer.from(sigB64, 'base64url');
  } catch {
    return null;
  }

  if (sigBuf.length !== expectedMac.length || !crypto.timingSafeEqual(sigBuf, expectedMac)) {
    return null;
  }

  let payload;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
  } catch {
    return null;
  }

  const exp = Number(payload.exp);
  if (!Number.isFinite(exp) || Math.floor(Date.now() / 1000) > exp) return null;
  if (!payload.jti || typeof payload.jti !== 'string') return null;

  return payload;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secret = process.env.SHOPBOARD_DOWNLOAD_SECRET;
  const imageUrl = process.env.SHOPBOARD_IMAGE_URL;

  if (!secret || !imageUrl) {
    return res.status(503).json({ error: 'Download not configured' });
  }

  const raw = req.query && req.query.t;
  const token = typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] : '';
  if (!token) {
    return res.status(400).json({ error: 'Missing download link' });
  }

  const payload = verifyToken(token, secret);
  if (!payload) {
    return res.status(403).json({ error: 'Invalid or expired download link' });
  }

  const now = Math.floor(Date.now() / 1000);
  const ttlLeft = Math.max(60, payload.exp - now);
  const firstUse = await consumeDownloadJti(payload.jti, ttlLeft);
  if (!firstUse) {
    return res.status(403).json({ error: 'Download link already used or expired' });
  }

  return res.redirect(302, imageUrl);
}
