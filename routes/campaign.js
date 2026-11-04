'use strict';
const { uid, createdAt, clean, isEmail, normEmail } = require('../lib/util');

module.exports = function ({ q, auth, settings, campaign, mailer }) {
  const router = require('express').Router();
  const admin = auth.required('ADMIN');
  const editor = auth.required('EDITOR');
  const CATS = ['welcome', 'general', 'digital-marketing', 'web-development', 'software-development', 'software-design', 'database-management', 'consulting', 'data-analytics', 'training'];

  // ── Steps ─────────────────────────────────────────────────
  router.get('/campaign/steps', editor, async (req, res) => {
    try {
      const steps = await q('SELECT * FROM email_campaign_steps ORDER BY step ASC');
      const sent = await q("SELECT step, COUNT(*) AS n FROM email_log WHERE kind = 'CAMPAIGN' AND status = 'SENT' AND step IS NOT NULL GROUP BY step");
      const m = Object.fromEntries(sent.map((r) => [r.step, Number(r.n)]));
      res.json(steps.map((s) => ({ ...s, sent_count: m[s.step] || 0 })));
    } catch (e) { res.status(500).json({ error: 'Database error' }); }
  });

  function readStep(b) {
    const subject = clean(b.subject, 300), title = clean(b.title, 250), body = String(b.body_html || '').slice(0, 200000);
    if (!subject || !title || !body.trim()) return { error: 'Subject, title and body are required' };
    return { v: [Math.max(0, parseInt(b.day_offset || 0, 10)), CATS.includes(b.category) ? b.category : 'general', subject, clean(b.preheader, 250), clean(b.kicker, 80), title, body, clean(b.cta_text, 80), clean(b.cta_url, 500), b.status === 'PAUSED' ? 'PAUSED' : 'ACTIVE'] };
  }

  router.post('/campaign/steps', admin, async (req, res) => {
    try {
      const r = readStep(req.body || {});
      if (r.error) return res.status(400).json({ error: r.error });
      const [{ m }] = await q('SELECT COALESCE(MAX(step), -1) AS m FROM email_campaign_steps');
      const step = req.body.step !== undefined && req.body.step !== '' ? parseInt(req.body.step, 10) : Number(m) + 1;
      const [dup] = await q('SELECT id FROM email_campaign_steps WHERE step = ?', [step]);
      if (dup) return res.status(409).json({ error: `Step ${step} already exists` });
      const now = createdAt();
      await q('INSERT INTO email_campaign_steps (id, step, day_offset, category, subject, preheader, kicker, title, body_html, cta_text, cta_url, status, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [uid(), step, ...r.v, now, now]);
      res.status(201).json({ message: 'Step added', step });
    } catch (e) { res.status(500).json({ error: 'Database error' }); }
  });

  router.put('/campaign/steps/:id', admin, async (req, res) => {
    try {
      const r = readStep(req.body || {});
      if (r.error) return res.status(400).json({ error: r.error });
      const out = await q('UPDATE email_campaign_steps SET day_offset=?, category=?, subject=?, preheader=?, kicker=?, title=?, body_html=?, cta_text=?, cta_url=?, status=?, updated_at=? WHERE id=?', [...r.v, createdAt(), req.params.id]);
      if (!out.affectedRows) return res.status(404).json({ error: 'Step not found' });
      res.json({ message: 'Step updated' });
    } catch (e) { res.status(500).json({ error: 'Database error' }); }
  });

  router.delete('/campaign/steps/:id', admin, async (req, res) => {
    try { await q('DELETE FROM email_campaign_steps WHERE id = ?', [req.params.id]); res.json({ message: 'Step deleted' }); }
    catch (e) { res.status(500).json({ error: 'Database error' }); }
  });

  // Preview HTML for a saved step or an unsaved draft
  router.post('/campaign/preview', editor, async (req, res) => {
    try {
      const b = req.body || {};
      let step = b;
      if (b.id) { const [s] = await q('SELECT * FROM email_campaign_steps WHERE id = ?', [b.id]); if (s) step = s; }
      const sub = { email: 'jane@example.com', name: 'Jane Wanjiru' };
      const out = await mailer.renderCampaign({ ...step, step: step.step == null ? null : step.step }, sub, { unsubscribeUrl: '#' });
      res.json(out);
    } catch (e) { console.error(e); res.status(500).json({ error: 'Could not render preview' }); }
  });

  // Send a test of a step to any address
  router.post('/campaign/test', admin, async (req, res) => {
    try {
      const to = normEmail(req.body.to || req.user.email);
      if (!isEmail(to)) return res.status(400).json({ error: 'Enter a valid test address' });
      let step = req.body;
      if (req.body.id) { const [s] = await q('SELECT * FROM email_campaign_steps WHERE id = ?', [req.body.id]); if (s) step = s; }
      const sub = { email: to, name: req.user.name || 'Test' };
      const { subject, html } = await mailer.renderCampaign(step, sub, { unsubscribeUrl: await campaign.unsubUrl(to) });
      const r = await mailer.send({ to, subject: `[TEST] ${subject}`, html });
      if (!r.ok) return res.status(502).json({ error: r.skipped ? 'SMTP is not configured (Settings → Email)' : `Send failed: ${r.error}` });
      res.json({ message: `Test sent to ${to}` });
    } catch (e) { res.status(500).json({ error: 'Test failed' }); }
  });

  // ── Stats / run / settings ────────────────────────────────
  router.get('/campaign/stats', editor, async (req, res) => {
    try {
      const since = createdAt(new Date(Date.now() - 30 * 86400000));
      const byDay = await q("SELECT DATE(created_at) AS d, SUM(status='SENT') AS sent, SUM(status='FAILED') AS failed FROM email_log WHERE created_at >= ? GROUP BY DATE(created_at) ORDER BY d", [since]);
      const [t] = await q("SELECT COUNT(*) AS total, SUM(status='SENT') AS sent, SUM(status='FAILED') AS failed FROM email_log");
      const [st] = await q("SELECT COUNT(*) AS n FROM email_campaign_steps WHERE status = 'ACTIVE'");
      const conf = await campaign.cfg();
      res.json({ enabled: conf.enabled, active_steps: Number(st.n), total: Number(t.total || 0), sent: Number(t.sent || 0), failed: Number(t.failed || 0), by_day: byDay.map((r) => ({ day: r.d, sent: Number(r.sent), failed: Number(r.failed) })) });
    } catch (e) { res.status(500).json({ error: 'Database error' }); }
  });

  router.post('/campaign/run', admin, async (req, res) => {
    try { res.json(await campaign.processDue()); } catch (e) { res.status(500).json({ error: 'Run failed' }); }
  });

  // External cron (cPanel cron job):  curl -s "https://site/api/campaign/cron?key=CRON_SECRET"
  router.get('/campaign/cron', async (req, res) => {
    const secret = process.env.CRON_SECRET;
    if (!secret || req.query.key !== secret) return res.status(401).json({ error: 'Unauthorized' });
    try { res.json(await campaign.processDue()); } catch (e) { res.status(500).json({ error: 'Run failed' }); }
  });

  const SETTING_KEYS = ['enabled', 'respect_interests', 'min_gap_days', 'batch_size', 'double_opt_in'];
  router.get('/campaign/settings', editor, async (req, res) => {
    const s = await settings.getSection('campaign');
    res.json(Object.fromEntries(SETTING_KEYS.map((k) => [k, s[k] == null ? '' : s[k]])));
  });
  router.put('/campaign/settings', admin, async (req, res) => {
    try {
      const b = req.body || {}, out = {};
      for (const k of ['enabled', 'respect_interests', 'double_opt_in']) if (b[k] !== undefined) out[k] = String(b[k] === true || b[k] === 'true');
      if (b.min_gap_days !== undefined) out.min_gap_days = String(Math.max(0, parseFloat(b.min_gap_days) || 0));
      if (b.batch_size !== undefined) out.batch_size = String(Math.min(200, Math.max(1, parseInt(b.batch_size, 10) || 25)));
      await settings.setMany('campaign', out);
      res.json({ message: 'Campaign settings saved' });
    } catch (e) { res.status(500).json({ error: 'Database error' }); }
  });

  // ── Log ───────────────────────────────────────────────────
  router.get('/campaign/log', editor, async (req, res) => {
    try {
      const { status, kind } = req.query; let sql = 'SELECT * FROM email_log WHERE 1=1'; const p = [];
      if (status) { sql += ' AND status = ?'; p.push(status); }
      if (kind) { sql += ' AND kind = ?'; p.push(kind); }
      res.json(await q(sql + ' ORDER BY created_at DESC LIMIT 300', p));
    } catch (e) { res.status(500).json({ error: 'Database error' }); }
  });

  // ── Broadcasts ────────────────────────────────────────────
  router.get('/broadcasts', editor, async (req, res) => {
    try { res.json(await q('SELECT * FROM broadcasts ORDER BY created_at DESC LIMIT 200')); } catch (e) { res.status(500).json({ error: 'Database error' }); }
  });
  router.get('/broadcasts/audience', editor, async (req, res) => {
    try { res.json({ count: (await campaign.audienceRows(req.query.audience || 'ALL')).length }); } catch (e) { res.status(500).json({ error: 'Database error' }); }
  });
  const cleanAudience = (a) => (/^(ALL|interest:[a-z-]+|source:[\w-]+)$/.test(a || '') ? a : 'ALL');

  router.post('/broadcasts', admin, async (req, res) => {
    try {
      const b = req.body || {}; const subject = clean(b.subject, 300);
      if (!subject || !String(b.body_html || '').trim()) return res.status(400).json({ error: 'Subject and message are required' });
      const id = uid(), now = createdAt();
      await q("INSERT INTO broadcasts (id, subject, preheader, title, body_html, cta_text, cta_url, audience, status, created_by, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?, 'DRAFT', ?,?,?)",
        [id, subject, clean(b.preheader, 250), clean(b.title, 250), String(b.body_html).slice(0, 200000), clean(b.cta_text, 80), clean(b.cta_url, 500), cleanAudience(b.audience), req.user.name, now, now]);
      res.status(201).json({ message: 'Draft saved', id });
    } catch (e) { res.status(500).json({ error: 'Database error' }); }
  });
  router.put('/broadcasts/:id', admin, async (req, res) => {
    try {
      const [x] = await q('SELECT status FROM broadcasts WHERE id = ?', [req.params.id]);
      if (!x) return res.status(404).json({ error: 'Not found' });
      if (x.status !== 'DRAFT') return res.status(400).json({ error: 'Only drafts can be edited' });
      const b = req.body || {};
      await q('UPDATE broadcasts SET subject=?, preheader=?, title=?, body_html=?, cta_text=?, cta_url=?, audience=?, updated_at=? WHERE id=?',
        [clean(b.subject, 300), clean(b.preheader, 250), clean(b.title, 250), String(b.body_html || '').slice(0, 200000), clean(b.cta_text, 80), clean(b.cta_url, 500), cleanAudience(b.audience), createdAt(), req.params.id]);
      res.json({ message: 'Draft updated' });
    } catch (e) { res.status(500).json({ error: 'Database error' }); }
  });
  router.post('/broadcasts/:id/test', admin, async (req, res) => {
    try {
      const [b] = await q('SELECT * FROM broadcasts WHERE id = ?', [req.params.id]);
      if (!b) return res.status(404).json({ error: 'Not found' });
      const to = normEmail(req.body.to || req.user.email);
      if (!isEmail(to)) return res.status(400).json({ error: 'Enter a valid test address' });
      const step = { subject: b.subject, preheader: b.preheader, kicker: 'Update', title: b.title || b.subject, body_html: b.body_html, cta_text: b.cta_text, cta_url: b.cta_url, step: null };
      const { subject, html } = await mailer.renderCampaign(step, { email: to, name: req.user.name || 'Test' }, { unsubscribeUrl: await campaign.unsubUrl(to) });
      const r = await mailer.send({ to, subject: `[TEST] ${subject}`, html });
      if (!r.ok) return res.status(502).json({ error: r.skipped ? 'SMTP is not configured' : `Send failed: ${r.error}` });
      res.json({ message: `Test sent to ${to}` });
    } catch (e) { res.status(500).json({ error: 'Test failed' }); }
  });
  router.post('/broadcasts/:id/send', admin, async (req, res) => {
    try {
      const [b] = await q('SELECT status FROM broadcasts WHERE id = ?', [req.params.id]);
      if (!b) return res.status(404).json({ error: 'Not found' });
      if (b.status !== 'DRAFT') return res.status(400).json({ error: 'This broadcast has already been sent' });
      const r = await campaign.sendBroadcast(req.params.id);
      res.json({ message: `Sending to ${r.recipients} subscriber${r.recipients === 1 ? '' : 's'}…`, recipients: r.recipients });
    } catch (e) { res.status(500).json({ error: e.message || 'Send failed' }); }
  });
  router.delete('/broadcasts/:id', admin, async (req, res) => {
    try {
      const [b] = await q('SELECT status FROM broadcasts WHERE id = ?', [req.params.id]);
      if (b && b.status === 'SENDING') return res.status(400).json({ error: 'Wait for sending to finish' });
      await q('DELETE FROM broadcasts WHERE id = ?', [req.params.id]); res.json({ message: 'Broadcast deleted' });
    } catch (e) { res.status(500).json({ error: 'Database error' }); }
  });

  return router;
};
