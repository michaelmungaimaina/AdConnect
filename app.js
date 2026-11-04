'use strict';
/**
 * AdConnect – web server.
 *   • static site from /public
 *   • JSON API under /api (routes/*.js, shared logic in lib/*.js)
 *   • schema + default content are created automatically on start (lib/migrate.js)
 */
process.env.TZ = process.env.TZ || process.env.CALENDAR_TIMEZONE || 'Africa/Nairobi';
require('dotenv').config();

const path = require('path');
const fs = require('fs');
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const helmet = require('helmet');
const cron = require('node-cron');
const config = require('./config');

const auth = require('./lib/auth');
const createSettings = require('./lib/settings');
const createTheme = require('./lib/theme');
const createMailer = require('./lib/mailer');
const createGoogle = require('./lib/google');
const createCampaign = require('./lib/campaign');
const createSubscribers = require('./lib/subscribers');
const migrate = require('./lib/migrate');

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// ── CORS: same-origin by default; extra origins via ALLOWED_ORIGINS ──
const origins = (process.env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, cb) => cb(null, !origin || origins.includes(origin) || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: false, limit: '2mb' }));

// ── Small built-in rate limiter (no extra dependency) ──
const hits = new Map();
const WINDOW = (parseInt(process.env.RATE_LIMIT_WINDOW_MINUTES || '15', 10) || 15) * 60 * 1000;
const MAX = parseInt(process.env.RATE_LIMIT_MAX || '600', 10) || 600;
setInterval(() => { const now = Date.now(); for (const [k, v] of hits) if (now - v.start > WINDOW) hits.delete(k); }, 60 * 1000).unref();
app.use('/api', (req, res, next) => {
  if (req.method === 'OPTIONS') return next();
  const now = Date.now();
  let h = hits.get(req.ip);
  if (!h || now - h.start > WINDOW) { h = { start: now, n: 0 }; hits.set(req.ip, h); }
  if (++h.n > MAX) return res.status(429).json({ error: 'Too many requests. Please slow down and try again shortly.' });
  next();
});

// ── Database + shared services ──
const db = mysql.createPool(config.db);
const q = (sql, params = []) => new Promise((resolve, reject) => db.query(sql, params, (e, r) => (e ? reject(e) : resolve(r))));
const settings = createSettings(db);
const theme = createTheme(settings);
const mailer = createMailer({ settings, theme });
const google = createGoogle();
const campaign = createCampaign({ db, settings, mailer });
const subscribers = createSubscribers({ q, settings, campaign, mailer, auth });

// ── Uploads (public media only; proposals & CVs are never served statically) ──
const UPLOADS = path.join(__dirname, 'uploads');
['', 'media', 'proposals', 'cvs'].forEach((d) => fs.mkdirSync(path.join(UPLOADS, d), { recursive: true }));
app.use('/api/uploads/(proposals|cvs)', (req, res) => res.status(403).json({ error: 'Forbidden' }));
app.use('/api/uploads', express.static(UPLOADS, { index: false, dotfiles: 'deny', maxAge: '7d' }));
app.use('/api/media/files', express.static(path.join(UPLOADS, 'media'), { index: false, maxAge: '7d' }));
app.use('/api/cvs', auth.optional, auth.required('ADMIN'), express.static(path.join(UPLOADS, 'cvs'), { index: false }));

// ═══════════════ ACCESS GUARD (deny by default) ═══════════════
const PUBLIC_GET = [
  /^\/(faqs|blog-posts|projects|testimonials|careers|team-members|service-categories|services)(\/[^/]+)?$/,
  /^\/(video-data-active|about-data-active|site-info|theme|theme\.css|subscribe\/status|subscribe\/confirm|google-oauth\/callback|campaign\/cron)$/,
  /^\/site-settings\/[^/]+$/,
  /^\/booking\/(config|availability|days)$/,
  /^\/(bookings\/lookup|proposals\/track)$/,
];
const PUBLIC_POST = [
  /^\/auth$/,
  /^\/(faq-submission|clients|lead-exists|career-applications|contact-messages|marketing-strategy-applications|bookings|bookings\/cancel|proposals)$/,
  /^\/(subscribe|newsletter-subscribe|newsletter\/subscribe)$/,
  /^\/subscribe\/(unsubscribe|one-click|resubscribe|preferences)$/,
  /^\/analytics\/(record-visit|track)$/,
];
const EDITOR_WRITE = /^\/(blog-posts|projects|testimonials|faqs|media|video-data|video-data-update-status|about-data|about-data-update-status|careers|services|service-categories)(\/|$)/;

app.use('/api', auth.optional, (req, res, next) => {
  if (req.method === 'OPTIONS') return next();
  const p = req.path;
  if (req.method === 'GET' || req.method === 'HEAD') {
    if (PUBLIC_GET.some((r) => r.test(p))) return next();
    return auth.required('EDITOR')(req, res, next);
  }
  if (req.method === 'POST' && PUBLIC_POST.some((r) => r.test(p))) return next();
  return auth.required(EDITOR_WRITE.test(p) ? 'EDITOR' : 'ADMIN')(req, res, next);
});

// Hide unpublished content from the public (staff see everything)
const PUBLIC_STATUS = { 'blog-posts': ['PUBLISHED'], projects: ['ACTIVE', 'PUBLISHED'], testimonials: ['ACTIVE', 'PUBLISHED'], careers: ['OPEN'], faqs: ['PUBLISHED'] };
app.use('/api', (req, res, next) => {
  if (req.method !== 'GET' || req.user) return next();
  const allowed = PUBLIC_STATUS[req.path.split('/')[1]];
  if (!allowed) return next();
  const json = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode >= 400) return json(body);
    if (Array.isArray(body)) return json(body.filter((r) => !r || r.status === undefined || allowed.includes(r.status)));
    if (body && body.status !== undefined && !allowed.includes(body.status)) return res.status(404).json({ error: 'Not found' });
    return json(body);
  };
  next();
});

// ═══════════════ ROUTES ═══════════════
const deps = { db, q, auth, settings, theme, mailer, google, campaign, subscribers, subscribe: subscribers };
const mount = (name) => app.use('/api', require(`./routes/${name}`)(deps));
['auth', 'theme', 'services', 'bookings', 'proposals', 'subscribers', 'campaign', 'contact', 'system', 'legacy'].forEach(mount);

// ── Static site ──
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'], maxAge: '1h' }));

// ── 404 + error handling (must stay last) ──
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));
app.use((req, res) => {
  const f = path.join(__dirname, 'public', '404.html');
  res.status(404);
  fs.existsSync(f) ? res.sendFile(f) : res.type('text').send('Not found');
});
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  if (res.headersSent) return next(err);
  const status = err.status || (err.code && String(err.code).startsWith('LIMIT_') ? 400 : err.message && /accepted|allowed|Only/.test(err.message) ? 400 : 500);
  if (status >= 500) console.error(err);
  res.status(status).json({ error: status >= 500 ? 'Server error' : err.message });
});

// ═══════════════ START ═══════════════
(async () => {
  try {
    await new Promise((resolve, reject) => db.getConnection((e, c) => (e ? reject(e) : (c.release(), resolve()))));
    console.log('✅ Connected to the MySQL database.');
    await migrate({ db, settings, log: console.log });
    await theme.load(true);
  } catch (e) {
    console.error('❌ Start-up failed:', e.message);
    process.exit(1);
  }

  // Drip-campaign runner (every 15 minutes). Also callable via GET /api/campaign/cron?key=CRON_SECRET
  cron.schedule('*/15 * * * *', () => campaign.processDue().catch((e) => console.error('Campaign run failed:', e.message)), { timezone: process.env.TZ });

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`🚀 AdConnect running on port ${PORT}`));
})();

process.on('unhandledRejection', (e) => console.error('Unhandled rejection:', e));
