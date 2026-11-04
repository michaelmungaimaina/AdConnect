'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const { uid, createdAt, reference, isEmail, normEmail, clean, esc } = require('../lib/util');

module.exports = function ({ q, auth, mailer, subscribe }) {
  const router = require('express').Router();
  const admin = auth.required('ADMIN');
  const DIR = path.join(__dirname, '..', 'uploads', 'proposals');
  fs.mkdirSync(DIR, { recursive: true });

  const STATUSES = ['NEW', 'UNDER_REVIEW', 'NEEDS_INFO', 'QUOTED', 'ACCEPTED', 'DECLINED', 'COMPLETED'];
  const STATUS_LABEL = { NEW: 'Received', UNDER_REVIEW: 'Under review', NEEDS_INFO: 'More information needed', QUOTED: 'Quote sent', ACCEPTED: 'Accepted', DECLINED: 'Declined', COMPLETED: 'Completed' };
  const ALLOWED = ['.pdf', '.doc', '.docx', '.odt', '.rtf', '.txt', '.ppt', '.pptx', '.xls', '.xlsx', '.csv', '.zip', '.png', '.jpg', '.jpeg', '.webp'];
  const MAX_MB = Math.max(1, parseInt(process.env.PROPOSAL_MAX_MB || '15', 10));

  const upload = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => cb(null, DIR),
      filename: (req, file, cb) => cb(null, `${uid()}_${crypto.randomBytes(6).toString('hex')}${path.extname(file.originalname).toLowerCase()}`),
    }),
    limits: { fileSize: MAX_MB * 1024 * 1024, files: 3 },
    fileFilter: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      if (!ALLOWED.includes(ext)) return cb(Object.assign(new Error(`File type "${ext || 'unknown'}" is not accepted. Allowed: ${ALLOWED.join(' ')}`), { code: 'BAD_TYPE' }));
      cb(null, true);
    },
  });
  const receive = (req, res, next) => upload.array('files', 3)(req, res, (err) => {
    if (!err) return next();
    const msg = err.code === 'LIMIT_FILE_SIZE' ? `Each file must be ${MAX_MB} MB or smaller` : err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE' ? 'You can attach up to 3 files' : err.message;
    res.status(400).json({ error: msg });
  });
  const dropFiles = (files) => (files || []).forEach((f) => { try { fs.unlinkSync(f.path); } catch { /* ignore */ } });

  // ── Public: submit ────────────────────────────────────────
  router.post('/proposals', receive, async (req, res) => {
    const files = req.files || [];
    try {
      const b = req.body || {};
      const name = clean(b.name, 200), email = normEmail(b.email), title = clean(b.title, 250), summary = clean(b.summary, 6000);
      if (b.website) { dropFiles(files); return res.status(201).json({ message: 'Received', reference: 'BK-000000' }); } // honeypot
      if (!name || !isEmail(email) || !title) { dropFiles(files); return res.status(400).json({ error: 'Name, a valid email and a project title are required' }); }
      if (summary.length < 20 && !files.length) { dropFiles(files); return res.status(400).json({ error: 'Please describe your project (at least a few sentences) or attach your proposal document' }); }
      const [cat] = b.category ? await q("SELECT * FROM service_categories WHERE slug = ? AND status = 'ACTIVE'", [b.category]) : [];
      if (!cat) { dropFiles(files); return res.status(400).json({ error: 'Please choose a service category' }); }
      if (!cat.allow_proposal) { dropFiles(files); return res.status(400).json({ error: 'This category does not accept proposals online. Please book a session instead.' }); }
      let svc = null;
      if (b.service) [svc] = await q('SELECT id, name FROM services WHERE slug = ? AND category_id = ?', [b.service, cat.id]);

      const id = uid(), ref = reference('PR'), now = createdAt();
      await q(`INSERT INTO proposals (id, reference, category_id, category_slug, category_name, service_id, service_name, name, email, phone, company, title, summary, budget_range, timeline, status, created_at, updated_at)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?, 'NEW', ?,?)`,
        [id, ref, cat.id, cat.slug, cat.name, svc && svc.id, svc && svc.name, name, email, clean(b.phone, 40), clean(b.company, 200), title, summary, clean(b.budget_range, 100), clean(b.timeline, 100), now, now]);
      for (const f of files) {
        await q('INSERT INTO proposal_files (id, proposal_id, original_name, stored_name, size, mime, created_at) VALUES (?,?,?,?,?,?,?)',
          [uid(), id, clean(f.originalname, 300), f.filename, f.size, clean(f.mimetype, 120), now]);
      }
      if (b.subscribe === 'true' || b.subscribe === true || b.subscribe === '1' || b.subscribe === 'on') subscribe.upsert({ email, name, phone: b.phone, interests: [cat.slug], source: 'proposal' }).catch(() => {});

      const p = { reference: ref, name, email, title, category_name: cat.name, service_name: svc && svc.name, budget: clean(b.budget_range, 100), timeline: clean(b.timeline, 100), phone: clean(b.phone, 40), company: clean(b.company, 200), summary, files };
      notifyClient(p).catch(() => {}); notifyAdmin(p).catch(() => {});
      res.status(201).json({ message: 'Proposal received', reference: ref, files: files.length });
    } catch (e) { dropFiles(files); console.error(e); res.status(500).json({ error: 'Could not save your proposal. Please try again.' }); }
  });

  router.get('/proposals/track', async (req, res) => {
    try {
      const ref = clean(req.query.reference, 20).toUpperCase(), email = normEmail(req.query.email);
      const [p] = await q('SELECT * FROM proposals WHERE reference = ? AND LOWER(email) = ?', [ref, email]);
      if (!p) return res.status(404).json({ error: 'No proposal found for that reference and email' });
      const files = await q('SELECT original_name, size FROM proposal_files WHERE proposal_id = ?', [p.id]);
      res.json({ reference: p.reference, title: p.title, category: p.category_name, status: p.status, status_label: STATUS_LABEL[p.status] || p.status, submitted: p.created_at, updated: p.updated_at, quote_amount: p.status === 'QUOTED' || p.status === 'ACCEPTED' ? p.quote_amount : '', files });
    } catch (e) { res.status(500).json({ error: 'Database error' }); }
  });

  // ── Admin ─────────────────────────────────────────────────
  router.get('/proposals', admin, async (req, res) => {
    try {
      const { status, category, q: term } = req.query;
      let sql = 'SELECT p.*, (SELECT COUNT(*) FROM proposal_files f WHERE f.proposal_id = p.id) AS file_count FROM proposals p WHERE 1=1'; const prm = [];
      if (status) { sql += ' AND p.status = ?'; prm.push(status); }
      if (category) { sql += ' AND p.category_slug = ?'; prm.push(category); }
      if (term) { const l = `%${term}%`; sql += ' AND (p.name LIKE ? OR p.email LIKE ? OR p.reference LIKE ? OR p.title LIKE ? OR p.company LIKE ?)'; prm.push(l, l, l, l, l); }
      sql += ' ORDER BY p.created_at DESC LIMIT 1000';
      res.json(await q(sql, prm));
    } catch (e) { console.error(e); res.status(500).json({ error: 'Database error' }); }
  });

  router.get('/proposals/:id', admin, async (req, res) => {
    try {
      const [p] = await q('SELECT * FROM proposals WHERE id = ?', [req.params.id]);
      if (!p) return res.status(404).json({ error: 'Proposal not found' });
      const files = await q('SELECT id, original_name, size, mime, created_at FROM proposal_files WHERE proposal_id = ? ORDER BY created_at', [p.id]);
      const replies = await q('SELECT * FROM proposal_replies WHERE proposal_id = ? ORDER BY created_at DESC', [p.id]);
      res.json({ ...p, files, replies });
    } catch (e) { res.status(500).json({ error: 'Database error' }); }
  });

  router.put('/proposals/:id', admin, async (req, res) => {
    try {
      const [p] = await q('SELECT * FROM proposals WHERE id = ?', [req.params.id]);
      if (!p) return res.status(404).json({ error: 'Proposal not found' });
      const b = req.body || {};
      const status = STATUSES.includes(b.status) ? b.status : p.status;
      await q('UPDATE proposals SET status = ?, admin_notes = ?, quote_amount = ?, updated_at = ? WHERE id = ?',
        [status, b.admin_notes !== undefined ? clean(b.admin_notes, 5000) : p.admin_notes, b.quote_amount !== undefined ? clean(b.quote_amount, 100) : p.quote_amount, createdAt(), p.id]);
      if (status !== p.status && b.notify) {
        const html = await mailer.renderNotice({ kicker: 'Proposal update', title: `Status: ${STATUS_LABEL[status]}`, intro: `<p>Hi ${p.name.split(/\s+/)[0]},</p><p>The status of your proposal <strong>${esc(p.title)}</strong> (${p.reference}) is now <strong>${STATUS_LABEL[status]}</strong>.</p>`, cta: 'Track my proposal', ctaUrl: `/proposal.html?track=${encodeURIComponent(p.reference)}` });
        mailer.send({ to: p.email, subject: `Proposal ${p.reference}: ${STATUS_LABEL[status]}`, html }).catch(() => {});
      }
      res.json({ message: 'Proposal updated' });
    } catch (e) { res.status(500).json({ error: 'Database error' }); }
  });

  router.post('/proposals/:id/reply', admin, async (req, res) => {
    try {
      const [p] = await q('SELECT * FROM proposals WHERE id = ?', [req.params.id]);
      if (!p) return res.status(404).json({ error: 'Proposal not found' });
      const subject = clean(req.body.subject, 300) || `Re: your proposal ${p.reference}`, body = clean(req.body.body, 8000);
      if (!body) return res.status(400).json({ error: 'Write a message first' });
      const html = await mailer.renderNotice({ kicker: 'About your proposal', title: p.title, intro: `<p>Hi ${esc(p.name.split(/\s+/)[0])},</p>${body.split(/\n{2,}/).map((x) => `<p>${esc(x).replace(/\n/g, '<br/>')}</p>`).join('')}`, outro: `<p style="font-size:13px;">Reference: <strong>${p.reference}</strong>. Just reply to this e-mail to continue the conversation.</p>` });
      const r = await mailer.send({ to: p.email, subject, html, replyTo: req.user.email });
      await q('INSERT INTO proposal_replies (id, proposal_id, subject, body, sent_by, email_ok, created_at) VALUES (?,?,?,?,?,?,?)', [uid(), p.id, subject, body, req.user.name, r.ok ? 1 : 0, createdAt()]);
      if (req.body.status && STATUSES.includes(req.body.status)) await q('UPDATE proposals SET status = ?, updated_at = ? WHERE id = ?', [req.body.status, createdAt(), p.id]);
      if (!r.ok) return res.status(502).json({ error: `Reply saved but e-mail failed: ${r.error}` });
      res.json({ message: r.skipped ? 'Reply saved (SMTP not configured – e-mail not sent)' : 'Reply sent' });
    } catch (e) { console.error(e); res.status(500).json({ error: 'Database error' }); }
  });

  router.get('/proposals/:id/files/:fileId', admin, async (req, res) => {
    try {
      const [f] = await q('SELECT * FROM proposal_files WHERE id = ? AND proposal_id = ?', [req.params.fileId, req.params.id]);
      if (!f) return res.status(404).json({ error: 'File not found' });
      const full = path.join(DIR, path.basename(f.stored_name));
      if (!fs.existsSync(full)) return res.status(404).json({ error: 'The file is missing from the server' });
      res.download(full, f.original_name);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
  });

  router.delete('/proposals/:id', admin, async (req, res) => {
    try {
      const files = await q('SELECT stored_name FROM proposal_files WHERE proposal_id = ?', [req.params.id]);
      files.forEach((f) => { try { fs.unlinkSync(path.join(DIR, path.basename(f.stored_name))); } catch { /* ignore */ } });
      await q('DELETE FROM proposal_files WHERE proposal_id = ?', [req.params.id]);
      await q('DELETE FROM proposal_replies WHERE proposal_id = ?', [req.params.id]);
      await q('DELETE FROM proposals WHERE id = ?', [req.params.id]);
      res.json({ message: 'Proposal deleted' });
    } catch (e) { res.status(500).json({ error: 'Database error' }); }
  });

  // ── E-mail ────────────────────────────────────────────────
  async function notifyClient(p) {
    const html = await mailer.renderNotice({
      kicker: 'Proposal received', title: 'Thank you — we have your proposal',
      intro: `<p>Hi ${esc(p.name.split(/\s+/)[0])},</p><p>We have received your project proposal and will review it within <strong>2 working days</strong>. We will reply with questions, a quote, or a suggested next step.</p>`,
      rows: [['Reference', p.reference], ['Project', p.title], ['Category', p.service_name ? `${p.category_name} – ${p.service_name}` : p.category_name], ['Budget', p.budget], ['Timeline', p.timeline], ['Attachments', p.files.map((f) => f.originalname).join(', ')]],
      cta: 'Track my proposal', ctaUrl: `/proposal.html?track=${encodeURIComponent(p.reference)}`,
      outro: '<p>Keep your reference number — you will need it with your e-mail address to check progress.</p>',
    });
    return mailer.send({ to: p.email, subject: `Proposal received — ${p.reference}`, html });
  }
  async function notifyAdmin(p) {
    const co = await mailer.company();
    const html = await mailer.renderNotice({
      kicker: 'New proposal', title: p.title, signature: false,
      intro: `<p>${esc(p.summary).slice(0, 700).replace(/\n/g, '<br/>')}</p>`,
      rows: [['Reference', p.reference], ['From', `${p.name}${p.company ? ' · ' + p.company : ''}`], ['Email', p.email], ['Phone', p.phone], ['Category', p.service_name ? `${p.category_name} – ${p.service_name}` : p.category_name], ['Budget', p.budget], ['Timeline', p.timeline], ['Files', p.files.length ? p.files.map((f) => `${f.originalname} (${Math.round(f.size / 1024)} KB)`).join(', ') : 'None']],
      cta: 'Review in admin panel', ctaUrl: '/admin.html',
    });
    return mailer.send({ to: co.adminEmail, subject: `📄 New proposal ${p.reference}: ${p.title}`, html, replyTo: p.email });
  }

  return router;
};
