'use strict';
const crypto = require('crypto');

const pad = (n) => String(n).padStart(2, '0');

/** yyyyMMddHHmmss in server-local time (server runs in Africa/Nairobi, see server.js). */
function stamp(d = new Date()) {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

/** 'YYYY-MM-DD HH:mm:ss' – MySQL DATETIME literal in server-local time. */
function createdAt(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/** 'YYYY-MM-DD' */
function ymd(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Unique, time-sortable id that fits VARCHAR(20): 14-digit timestamp + 5 random base36 chars.
 * (The old second-resolution ids collided whenever two rows were inserted in the same second.)
 */
function uid() {
  return stamp() + crypto.randomBytes(4).readUInt32BE(0).toString(36).padStart(5, '0').slice(-5);
}

/** Short human-friendly reference such as BK-7F3K9Q (no ambiguous characters). */
function reference(prefix) {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const bytes = crypto.randomBytes(6);
  let out = '';
  for (let i = 0; i < 6; i++) out += alphabet[bytes[i] % alphabet.length];
  return `${prefix}-${out}`;
}

function tryParseJSON(str, fallback) {
  if (str == null || str === '') return fallback;
  if (typeof str === 'object') return str;
  try { return JSON.parse(str); } catch { return fallback; }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const isEmail = (v) => typeof v === 'string' && v.length <= 200 && EMAIL_RE.test(v.trim());
const normEmail = (v) => String(v || '').trim().toLowerCase();

/** Escape text for safe interpolation in HTML. */
function esc(v) {
  return String(v ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/** Trim + clamp a string from user input. */
function clean(v, max = 255) {
  if (v === undefined || v === null) return '';
  return String(v).trim().slice(0, max);
}

/** Add days to a Date, returns a new Date. */
function addDays(d, n) { const r = new Date(d.getTime()); r.setDate(r.getDate() + n); return r; }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** slugify "Web & Apps" -> "web-apps" */
function slugify(s) {
  return String(s || '').toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-').slice(0, 80);
}

module.exports = { stamp, createdAt, ymd, uid, reference, tryParseJSON, isEmail, normEmail, esc, clean, addDays, sleep, slugify, pad };
