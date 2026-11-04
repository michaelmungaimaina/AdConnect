'use strict';
/**
 * Authentication helpers (no external dependencies):
 *  - scrypt password hashing (with transparent upgrade of legacy plain-text passwords)
 *  - HS256 signed tokens (JWT-compatible format) for admin sessions + email links
 *  - Express middleware: optional auth, required auth with role ranks, login throttling
 */
const crypto = require('crypto');

const RANK = { GEN_USER: 1, EDITOR: 2, ADMIN: 3, SUPER_ADMIN: 4 };

let SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET;
if (!SECRET || /replace_with|your_/i.test(SECRET)) {
  SECRET = crypto.randomBytes(48).toString('hex');
  console.warn('⚠️  JWT_SECRET is not set – using a random secret. Admin sessions will reset on every restart. Set JWT_SECRET in .env.');
}

const b64u = (buf) => Buffer.from(buf).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
const fromB64u = (s) => Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64');

// ── Passwords ────────────────────────────────────────────────
function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(String(password), salt, 64);
  return `scrypt$${b64u(salt)}$${b64u(hash)}`;
}
const isHashed = (stored) => typeof stored === 'string' && stored.startsWith('scrypt$');

function safeEqual(a, b) {
  const ba = Buffer.from(String(a)), bb = Buffer.from(String(b));
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

function verifyPassword(password, stored) {
  if (!stored) return false;
  if (isHashed(stored)) {
    const [, salt, hash] = stored.split('$');
    try {
      const calc = crypto.scryptSync(String(password), fromB64u(salt), 64);
      return crypto.timingSafeEqual(calc, fromB64u(hash));
    } catch { return false; }
  }
  return safeEqual(password, stored); // legacy plain-text (upgraded on next successful login / at boot)
}

// ── Tokens ───────────────────────────────────────────────────
function sign(payload, ttlSeconds) {
  const header = b64u(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = b64u(JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + ttlSeconds }));
  const sig = b64u(crypto.createHmac('sha256', SECRET).update(`${header}.${body}`).digest());
  return `${header}.${body}.${sig}`;
}

function verify(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const expected = b64u(crypto.createHmac('sha256', SECRET).update(`${parts[0]}.${parts[1]}`).digest());
  if (!safeEqual(expected, parts[2])) return null;
  try {
    const payload = JSON.parse(fromB64u(parts[1]).toString('utf8'));
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch { return null; }
}

function parseDuration(str, fallbackSeconds = 8 * 3600) {
  const m = /^(\d+)\s*([smhd])?$/.exec(String(str || '').trim());
  if (!m) return fallbackSeconds;
  const n = parseInt(m[1], 10);
  return n * ({ s: 1, m: 60, h: 3600, d: 86400 }[m[2] || 's']);
}

/** Link tokens for e-mail (unsubscribe / confirm). Valid ~10 years. */
const linkToken = (email, purpose) => sign({ e: String(email).toLowerCase(), p: purpose }, 10 * 365 * 86400);
function readLinkToken(token, purpose) {
  const p = verify(token);
  return p && p.p === purpose ? p.e : null;
}

// ── Middleware ───────────────────────────────────────────────
function bearer(req) {
  const h = req.headers.authorization || '';
  if (/^Bearer /i.test(h)) return h.slice(7).trim();
  // Allow ?token= for file downloads opened in a new tab (CV / proposal files).
  if (req.query && typeof req.query.token === 'string') return req.query.token;
  return null;
}

function optional(req, res, next) {
  const payload = verify(bearer(req));
  if (payload && payload.t === 'admin') req.user = { id: payload.id, name: payload.name, email: payload.email, role: payload.role };
  next();
}

/** require('ADMIN') → ADMIN or SUPER_ADMIN. Without arg any logged-in staff user. */
function required(minRole = 'GEN_USER') {
  return (req, res, next) => {
    if (!req.user) {
      const payload = verify(bearer(req));
      if (payload && payload.t === 'admin') req.user = { id: payload.id, name: payload.name, email: payload.email, role: payload.role };
    }
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    if ((RANK[req.user.role] || 0) < (RANK[minRole] || 99)) return res.status(403).json({ error: 'You do not have permission to do this' });
    next();
  };
}

// Login throttle: 8 failures / 15 min per ip+email
const failures = new Map();
function throttle(key) {
  const now = Date.now();
  const rec = (failures.get(key) || []).filter((t) => now - t < 15 * 60 * 1000);
  failures.set(key, rec);
  return rec.length >= 8;
}
const recordFailure = (key) => { const r = failures.get(key) || []; r.push(Date.now()); failures.set(key, r); };
const clearFailures = (key) => failures.delete(key);

module.exports = {
  RANK, hashPassword, verifyPassword, isHashed, sign, verify, parseDuration,
  linkToken, readLinkToken, optional, required, throttle, recordFailure, clearFailures,
};
