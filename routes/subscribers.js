'use strict';
const { uid, createdAt, normEmail, isEmail, clean, esc } = require('../lib/util');

module.exports = function ({ q, auth, campaign, subscribers, mailer }) {
  const router = require('express').Router();
  const admin = auth.required('ADMIN');
  const editor = auth.required('EDITOR');
  const ip = (req) => req.ip || (req.connection && req.connection.remoteAddress) || 'x';
  const STATUSES = ['SUBSCRIBED', 'PENDING', 'UNSUBSCRIBED', 'BOUNCED'];

  // ── Public ────────────────────────────────────────────────
  async function subscribe(req, res) {
    try {
      const b = req.body || {};
      if (b.website) return res.status(201).json({ message: 'Subscribed' }); // honeypot
      const key = `sub:${ip(req)}`;
      if (auth.throttle(key)) return res.status(429).json({ error: 'Too many attempts. Please try again later.' });
      auth.recordFailure(key);
      const email = normEmail(b.email);
      if (!isEmail(email)) return res.status(400).json({ error: 'Please enter a valid email address' });
      const r = await subscribers.upsert({ email, name: b.name, phone: b.phone, interests: b.interests, source: clean(b.source, 60) || 'website' });
      const pending = r.status === 'PENDING';
      res.status(r.created ? 201 : 200).json({
        message: pending ? 'Almost done — check your inbox and confirm your subscription.' : r.created || r.reactivated ? 'You are subscribed. A welcome email is on its way.' : 'You are already subscribed.',
        status: r.status,
      });
    } catch (e) { res.status(e.status || 500).json({ error: e.status ? e.message : 'Could not subscribe right now' }); }
  }
  router.post('/subscribe', subscribe);
  router.post('/newsletter/subscribe', subscribe); // legacy alias
  router.post('/newsletter-subscribe', subscribe);

  router.get('/subscribe/confirm', async (req, res) => {
    try {
      const email = auth.readLinkToken(String(req.query.token || ''), 'confirm');
      if (!email) return res.status(400).send('This confirmation link is invalid.');
      const [s] = await q('SELECT * FROM subscribers WHERE email = ?', [email]);
      if (!s) return res.status(404).send('Subscriber not found.');
      if (s.status !== 'SUBSCRIBED') {
        await q("UPDATE subscribers SET status = 'SUBSCRIBED', unsubscribed_at = NULL, next_send_at = ?, updated_at = ? WHERE id = ?", [createdAt(), createdAt(), s.id]);
        if (s.current_step < 0) campaign.sendWelcome(s.id).catch(() => {});
      }
      res.redirect('/subscribe.html?confirmed=1');
    } catch (e) { res.status(500).send('Error'); }
  });

  // token-based self-service (unsubscribe.html)
  const fromToken = (t) => auth.readLinkToken(String(t || ''), 'unsub');
  router.get('/subscribe/status', async (req, res) => {
    try {
      const email = fromToken(req.query.t);
      if (!email) return res.status(400).json({ error: 'This link is invalid or has expired' });
      const [s] = await q('SELECT email, name, status, interests FROM subscribers WHERE email = ?', [email]);
      if (!s) return res.status(404).json({ error: 'Subscriber not found' });
      res.json({ email: s.email, name: s.name, status: s.status, interests: subscribers.cleanInterests(s.interests), topics: subscribers.SLUGS });
    } catch (e) { res.status(500).json({ error: 'Database error' }); }
  });
  router.post('/subscribe/unsubscribe', async (req, res) => {
    try {
      const email = fromToken(req.body.t || req.query.t);
      if (!email) return res.status(400).json({ error: 'This link is invalid or has expired' });
      const s = await subscribers.setStatusByEmail(email, 'UNSUBSCRIBED', req.body.reason);
      if (!s) return res.status(404).json({ error: 'Subscriber not found' });
      res.json({ message: 'You have been unsubscribed.' });
    } catch (e) { res.status(500).json({ error: 'Database error' }); }
  });
  // RFC 8058 one-click (mail clients POST here)
  router.post('/subscribe/one-click', async (req, res) => {
    try { const email = fromToken(req.query.t || req.body.t); if (email) await subscribers.setStatusByEmail(email, 'UNSUBSCRIBED', 'one-click'); res.json({ ok: true }); }
    catch { res.json({ ok: true }); }
  });
  router.post('/subscribe/resubscribe', async (req, res) => {
    try {
      const email = fromToken(req.body.t);
      if (!email) return res.status(400).json({ error: 'This link is invalid or has expired' });
      const r = await subscribers.upsert({ email, source: 'resubscribe' });
      res.json({ message: r.status === 'PENDING' ? 'Please confirm via the email we just sent.' : 'Welcome back! You are subscribed again.' });
    } catch (e) { res.status(500).json({ error: 'Could not resubscribe' }); }
  });
  router.post('/subscribe/preferences', async (req, res) => {
    try {
      const email = fromToken(req.body.t);
      if (!email) return res.status(400).json({ error: 'This link is invalid or has expired' });
      await q('UPDATE subscribers SET interests = ?, updated_at = ? WHERE email = ?', [JSON.stringify(subscribers.cleanInterests(req.body.interests)), createdAt(), email]);
      res.json({ message: 'Preferences saved' });
    } catch (e) { res.status(500).json({ error: 'Database error' }); }
  });

  // ── Admin ─────────────────────────────────────────────────
  router.get('/subscribers', editor, async (req, res) => {
    try {
      const { status, source, interest, q: term } = req.query;
      let sql = 'SELECT * FROM subscribers WHERE 1=1'; const p = [];
      if (status) { sql += ' AND status = ?'; p.push(status); }
      if (source) { sql += ' AND source = ?'; p.push(source); }
      if (interest) { sql += ' AND interests LIKE ?'; p.push(`%"${String(interest).replace(/[^a-z-]/g, '')}"%`); }
      if (term) { const l = `%${term}%`; sql += ' AND (email LIKE ? OR name LIKE ? OR phone LIKE ?)'; p.push(l, l, l); }
      sql += ' ORDER BY subscribed_at DESC LIMIT 5000';
      res.json(await q(sql, p));
    } catch (e) { console.error(e); res.status(500).json({ error: 'Database error' }); }
  });

  router.get('/subscribers/stats', editor, async (req, res) => {
    try {
      const rows = await q('SELECT status, COUNT(*) AS n FROM subscribers GROUP BY status');
      const by = Object.fromEntries(rows.map((r) => [r.status, Number(r.n)]));
      const sources = await q("SELECT source, COUNT(*) AS n FROM subscribers WHERE status = 'SUBSCRIBED' GROUP BY source ORDER BY n DESC");
      const [{ n: last30 }] = await q('SELECT COUNT(*) AS n FROM subscribers WHERE subscribed_at >= ?', [createdAt(new Date(Date.now() - 30 * 86400000))]);
      const [{ n: sent30 }] = await q("SELECT COUNT(*) AS n FROM email_log WHERE status = 'SENT' AND created_at >= ?", [createdAt(new Date(Date.now() - 30 * 86400000))]);
      const [{ n: due }] = await q("SELECT COUNT(*) AS n FROM subscribers WHERE status = 'SUBSCRIBED' AND next_send_at IS NOT NULL AND next_send_at <= ?", [createdAt()]);
      res.json({ total: Object.values(by).reduce((a, b) => a + b, 0), subscribed: by.SUBSCRIBED || 0, pending: by.PENDING || 0, unsubscribed: by.UNSUBSCRIBED || 0, bounced: by.BOUNCED || 0, last30: Number(last30), sent30: Number(sent30), due: Number(due), sources: sources.map((s) => ({ source: s.source, count: Number(s.n) })) });
    } catch (e) { res.status(500).json({ error: 'Database error' }); }
  });

  router.get('/subscribers/export', admin, async (req, res) => {
    try {
      const rows = await q('SELECT email, name, phone, interests, status, source, current_step, subscribed_at FROM subscribers ORDER BY subscribed_at DESC');
      const cell = (v) => { v = v == null ? '' : String(v); if (/^[=+\-@]/.test(v)) v = "'" + v; return `"${v.replace(/"/g, '""')}"`; };
      const head = ['email', 'name', 'phone', 'interests', 'status', 'source', 'current_step', 'subscribed_at'];
      const csv = [head.join(','), ...rows.map((r) => head.map((h) => cell(h === 'subscribed_at' && r[h] ? createdAt(new Date(r[h])) : r[h])).join(','))].join('\r\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="subscribers.csv"');
      res.send('﻿' + csv);
    } catch (e) { res.status(500).json({ error: 'Database error' }); }
  });

  router.post('/subscribers', admin, async (req, res) => {
    try {
      const b = req.body || {};
      const r = await subscribers.upsert({ email: b.email, name: b.name, phone: b.phone, interests: b.interests, source: b.source || 'admin', status: b.status && STATUSES.includes(b.status) ? b.status : 'SUBSCRIBED', notes: b.notes, silent: b.send_welcome === false });
      res.status(r.created ? 201 : 200).json({ message: r.created ? 'Subscriber added' : 'Subscriber updated', id: r.id });
    } catch (e) { res.status(e.status || 500).json({ error: e.status ? e.message : 'Database error' }); }
  });

  // Bulk import: { rows: [{email,name,phone,interests,subscribed_at}], send_welcome: false }
  router.post('/subscribers/import', admin, async (req, res) => {
    try {
      const rows = Array.isArray(req.body.rows) ? req.body.rows.slice(0, 5000) : [];
      let added = 0, updated = 0, skipped = 0;
      for (const r of rows) {
        if (!isEmail(normEmail(r.email))) { skipped++; continue; }
        try {
          const out = await subscribers.upsert({ email: r.email, name: r.name, phone: r.phone, interests: typeof r.interests === 'string' && !r.interests.startsWith('[') ? r.interests.split(/[;|,]/) : r.interests, source: 'import', status: STATUSES.includes(r.status) ? r.status : 'SUBSCRIBED', subscribedAt: r.subscribed_at || undefined, silent: req.body.send_welcome !== true });
          out.created ? added++ : updated++;
        } catch { skipped++; }
      }
      res.json({ message: `Import finished: ${added} added, ${updated} updated, ${skipped} skipped`, added, updated, skipped });
    } catch (e) { res.status(500).json({ error: 'Import failed' }); }
  });

  router.put('/subscribers/:id', admin, async (req, res) => {
    try {
      const [s] = await q('SELECT * FROM subscribers WHERE id = ?', [req.params.id]);
      if (!s) return res.status(404).json({ error: 'Subscriber not found' });
      const b = req.body || {};
      const status = STATUSES.includes(b.status) ? b.status : s.status;
      let next = s.next_send_at;
      if (status !== 'SUBSCRIBED') next = null;
      else if (s.status !== 'SUBSCRIBED') next = createdAt();
      await q('UPDATE subscribers SET name = ?, phone = ?, interests = ?, status = ?, notes = ?, next_send_at = ?, unsubscribed_at = ?, updated_at = ? WHERE id = ?',
        [b.name !== undefined ? clean(b.name, 200) : s.name, b.phone !== undefined ? clean(b.phone, 40) : s.phone, b.interests !== undefined ? JSON.stringify(subscribers.cleanInterests(b.interests)) : s.interests, status, b.notes !== undefined ? clean(b.notes, 3000) : s.notes, next, status === 'UNSUBSCRIBED' && s.status !== 'UNSUBSCRIBED' ? createdAt() : s.unsubscribed_at, createdAt(), s.id]);
      res.json({ message: 'Subscriber updated' });
    } catch (e) { res.status(500).json({ error: 'Database error' }); }
  });

  // Manually send one campaign step (or "next") to a subscriber
  router.post('/subscribers/:id/send-step', admin, async (req, res) => {
    try {
      const [s] = await q('SELECT * FROM subscribers WHERE id = ?', [req.params.id]);
      if (!s) return res.status(404).json({ error: 'Subscriber not found' });
      const stepNo = req.body.step !== undefined && req.body.step !== '' ? parseInt(req.body.step, 10) : s.current_step + 1;
      const [step] = await q('SELECT * FROM email_campaign_steps WHERE step = ?', [stepNo]);
      if (!step) return res.status(404).json({ error: `Step ${stepNo} does not exist` });
      const r = await campaign.deliver(step, s, { kind: 'MANUAL' });
      if (!r.ok) return res.status(502).json({ error: r.skipped ? 'SMTP is not configured' : `Send failed: ${r.error}` });
      res.json({ message: `Step ${stepNo} sent to ${s.email}` });
    } catch (e) { res.status(500).json({ error: 'Send failed' }); }
  });

  router.post('/subscribers/:id/reset', admin, async (req, res) => {
    try {
      await q("UPDATE subscribers SET current_step = -1, next_send_at = CASE WHEN status = 'SUBSCRIBED' THEN ? ELSE NULL END, updated_at = ? WHERE id = ?", [createdAt(), createdAt(), req.params.id]);
      res.json({ message: 'Campaign restarted for this subscriber' });
    } catch (e) { res.status(500).json({ error: 'Database error' }); }
  });

  router.get('/subscribers/:id/log', editor, async (req, res) => {
    try {
      const [s] = await q('SELECT email FROM subscribers WHERE id = ?', [req.params.id]);
      if (!s) return res.status(404).json({ error: 'Subscriber not found' });
      res.json(await q('SELECT * FROM email_log WHERE email = ? ORDER BY created_at DESC LIMIT 200', [s.email]));
    } catch (e) { res.status(500).json({ error: 'Database error' }); }
  });

  router.delete('/subscribers/:id', admin, async (req, res) => {
    try { await q('DELETE FROM subscribers WHERE id = ?', [req.params.id]); res.json({ message: 'Subscriber deleted' }); }
    catch (e) { res.status(500).json({ error: 'Database error' }); }
  });

  return router;
};
