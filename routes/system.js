'use strict';
const { uid, createdAt, clean, isEmail, normEmail } = require('../lib/util');

module.exports = function ({ q, auth, settings, mailer, google }) {
  const router = require('express').Router();
  const admin = auth.required('ADMIN');
  const editor = auth.required('EDITOR');
  const MASK = '********';
  const SECRET = /password|secret|token|api_key/i;

  // ── Site info (public: contact details for header/footer/forms) ──
  router.get('/site-info', async (req, res) => {
    try {
      const co = await mailer.company();
      const g = await settings.getPublic('global');
      res.json({ name: co.name, tagline: g.tagline || '', email: co.email || g.contact_email || '', phone: co.phone, phone_label: co.phoneLabel || '', phone2: co.phone2, phone2_label: co.phone2Label || '', whatsapp: g.whatsapp || '', address: g.address || '', hours: g.business_hours || '', social: { facebook: g.facebook_url || '', instagram: g.instagram_url || '', linkedin: g.linkedin_url || '', twitter: g.twitter_url || '', youtube: g.youtube_url || '', tiktok: g.tiktok_url || '' } });
    } catch (e) { res.status(500).json({ error: 'Could not load site info' }); }
  });

  // ── Site settings ──────────────────────────────────────────
  router.get('/site-settings/:section', async (req, res) => {
    try {
      const sec = req.params.section;
      if (req.user && auth.RANK[req.user.role] >= auth.RANK.ADMIN) {
        const all = await settings.getSection(sec, { force: true });
        return res.json(Object.fromEntries(Object.entries(all).map(([k, v]) => [k, SECRET.test(k) && v ? MASK : v])));
      }
      res.json(await settings.getPublic(sec));
    } catch (e) { res.status(500).json({ error: 'Database error' }); }
  });

  router.put('/site-settings/:section', admin, async (req, res) => {
    try {
      const sec = req.params.section;
      if (sec === 'theme') return res.status(400).json({ error: 'Use the Appearance panel to change colours' });
      const body = req.body || {};
      const out = {};
      for (const [k, v] of Object.entries(body)) {
        if (!/^[a-z0-9_]{1,80}$/i.test(k)) continue;
        if (SECRET.test(k) && v === MASK) continue; // unchanged
        out[k] = v == null ? '' : String(v).slice(0, 20000);
      }
      if (!Object.keys(out).length) return res.status(400).json({ error: 'No settings provided' });
      await settings.setMany(sec, out);
      res.json({ message: 'Settings updated successfully' });
    } catch (e) { res.status(500).json({ error: 'Database error' }); }
  });

  router.post('/settings/test-email', admin, async (req, res) => {
    try {
      const to = normEmail(req.body.to || req.user.email);
      if (!isEmail(to)) return res.status(400).json({ error: 'Enter a valid address' });
      const html = await mailer.renderNotice({ kicker: 'SMTP test', title: 'Email is working', intro: '<p>If you can read this, your SMTP settings are correct.</p>' });
      const r = await mailer.send({ to, subject: 'SMTP test', html });
      if (!r.ok) return res.status(502).json({ error: r.skipped ? 'SMTP is not configured' : `Send failed: ${r.error}` });
      res.json({ message: `Test email sent to ${to}` });
    } catch (e) { res.status(500).json({ error: 'Test failed' }); }
  });

  // ── Google (Meet links) ────────────────────────────────────
  router.get('/google-token-status', admin, (req, res) => res.json(google.status()));
  router.get('/google-auth-url', admin, (req, res) => {
    const url = google.authUrl();
    if (!url) return res.status(400).json({ error: 'Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env first' });
    res.json({ url });
  });
  router.post('/google-token-refresh', admin, async (req, res) => {
    try { await google.refresh(); res.json({ message: 'Token refreshed' }); } catch (e) { res.status(400).json({ error: e.message }); }
  });
  router.get('/google-oauth/callback', async (req, res) => {
    try {
      if (!req.query.code) return res.status(400).send('Missing code');
      await google.handleCallback(String(req.query.code));
      res.redirect('/admin.html?google=ok');
    } catch (e) { res.status(500).send('Google authorisation failed: ' + e.message); }
  });

  // ── Team members ───────────────────────────────────────────
  router.get('/team-members', async (req, res) => {
    try {
      const full = req.user && auth.RANK[req.user.role] >= auth.RANK.EDITOR;
      const rows = await q(`SELECT * FROM team_members ${full ? '' : 'WHERE is_active = 1'} ORDER BY created_at ASC`);
      res.json(full ? rows : rows.map(({ id, full_name, company_role, department, bio, linkedin, photo }) => ({ id, full_name, company_role, department, bio, linkedin, photo })));
    } catch (e) { res.status(500).json({ error: 'Database error' }); }
  });
  const memberVals = (b) => [clean(b.full_name, 200), clean(b.email, 255), clean(b.phone, 30), clean(b.company_role, 200), clean(b.department, 100), clean(b.user_role, 50), clean(b.bio, 3000), clean(b.linkedin, 500), clean(b.photo, 300), b.is_active === false || b.is_active === 0 || b.is_active === '0' ? 0 : 1];
  router.post('/team-members', admin, async (req, res) => {
    try {
      if (!clean(req.body.full_name, 200)) return res.status(400).json({ error: 'Full name is required' });
      const id = uid(), now = createdAt();
      await q('INSERT INTO team_members (id, full_name, email, phone, company_role, department, user_role, bio, linkedin, photo, is_active, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)', [id, ...memberVals(req.body), now, now]);
      res.status(201).json({ message: 'Team member added', id });
    } catch (e) { res.status(500).json({ error: 'Database error' }); }
  });
  router.put('/team-members/:id', admin, async (req, res) => {
    try {
      if (!clean(req.body.full_name, 200)) return res.status(400).json({ error: 'Full name is required' });
      await q('UPDATE team_members SET full_name=?, email=?, phone=?, company_role=?, department=?, user_role=?, bio=?, linkedin=?, photo=?, is_active=?, updated_at=? WHERE id=?', [...memberVals(req.body), createdAt(), req.params.id]);
      res.json({ message: 'Team member updated' });
    } catch (e) { res.status(500).json({ error: 'Database error' }); }
  });
  router.delete('/team-members/:id', admin, async (req, res) => {
    try { await q('DELETE FROM team_members WHERE id = ?', [req.params.id]); res.json({ message: 'Team member deleted' }); }
    catch (e) { res.status(500).json({ error: 'Database error' }); }
  });

  // ── Dashboard overview + analytics ─────────────────────────
  const count = async (sql, p = []) => { try { const [r] = await q(sql, p); return Number(r.n || 0); } catch { return 0; } };
  router.get('/overview', editor, async (req, res) => {
    const today = createdAt().slice(0, 10);
    const [bookingsPending, bookingsUpcoming, proposalsNew, proposalsOpen, subs, subs30, unread, leads, blogs, visits30] = await Promise.all([
      count("SELECT COUNT(*) AS n FROM bookings WHERE status = 'PENDING'"),
      count("SELECT COUNT(*) AS n FROM bookings WHERE status IN ('PENDING','CONFIRMED','RESCHEDULED') AND booking_date >= ?", [today]),
      count("SELECT COUNT(*) AS n FROM proposals WHERE status = 'NEW'"),
      count("SELECT COUNT(*) AS n FROM proposals WHERE status NOT IN ('DECLINED','COMPLETED')"),
      count("SELECT COUNT(*) AS n FROM subscribers WHERE status = 'SUBSCRIBED'"),
      count('SELECT COUNT(*) AS n FROM subscribers WHERE subscribed_at >= ?', [createdAt(new Date(Date.now() - 30 * 86400000))]),
      count("SELECT COUNT(*) AS n FROM contact_messages WHERE status = 'UNREAD'"),
      count('SELECT COUNT(*) AS n FROM clients'),
      count('SELECT COUNT(*) AS n FROM blog_posts'),
      count('SELECT COUNT(DISTINCT ip_hash) AS n FROM site_analytics WHERE date >= ?', [new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)]),
    ]);
    res.json({ bookingsPending, bookingsUpcoming, proposalsNew, proposalsOpen, subscribers: subs, subscribers30: subs30, unreadMessages: unread, leads, blogs, visitors30: visits30 });
  });

  router.get('/site-analytics/summary', editor, async (req, res) => {
    try {
      const days = Math.min(365, Math.max(1, parseInt(req.query.days || '30', 10)));
      const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
      const daily = await q('SELECT date, COUNT(DISTINCT ip_hash) AS visitors, SUM(visits) AS views FROM site_analytics WHERE date >= ? GROUP BY date ORDER BY date', [since]);
      const pages = await q('SELECT page, SUM(visits) AS views FROM site_analytics WHERE date >= ? GROUP BY page ORDER BY views DESC LIMIT 10', [since]);
      res.json({ daily: daily.map((d) => ({ date: d.date, visitors: Number(d.visitors), views: Number(d.views) })), pages: pages.map((p) => ({ page: p.page, views: Number(p.views) })) });
    } catch (e) { res.status(500).json({ error: 'Database error' }); }
  });

  return router;
};
