/**
 * Validates a short-lived HMAC-signed download token and redirects to the image URL.
 *
 * AirShop mints tokens with the same secret:
 *   payloadB64 = base64url(JSON.stringify({ exp, sub }))
 *   sigB64 = base64url(HMAC-SHA256(secret, payloadB64))
 *   token = payloadB64 + '.' + sigB64
 *
 * Environment:
 *   SHOPBOARD_DOWNLOAD_SECRET — shared secret (required)
 *   SHOPBOARD_IMAGE_URL       — HTTPS URL to the .img (required)
 */

import crypto from 'crypto';

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
  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'Missing token' });
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return res.status(400).json({ error: 'Invalid token' });
  }

  const [payloadB64, sigB64] = parts;
  const expectedMac = crypto.createHmac('sha256', secret).update(payloadB64).digest();

  let sigBuf;
  try {
    sigBuf = Buffer.from(sigB64, 'base64url');
  } catch {
    return res.status(403).json({ error: 'Invalid signature' });
  }

  if (sigBuf.length !== expectedMac.length || !crypto.timingSafeEqual(sigBuf, expectedMac)) {
    return res.status(403).json({ error: 'Invalid signature' });
  }

  let payload;
  try {
    const json = Buffer.from(payloadB64, 'base64url').toString('utf8');
    payload = JSON.parse(json);
  } catch {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  const exp = Number(payload.exp);
  if (!Number.isFinite(exp) || Math.floor(Date.now() / 1000) > exp) {
    return res.status(403).json({ error: 'Token expired' });
  }

  return res.redirect(302, imageUrl);
}
