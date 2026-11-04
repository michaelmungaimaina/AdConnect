'use strict';
const { uid, createdAt, isEmail, normEmail, clean, esc } = require('../lib/util');

module.exports = function ({ q, auth, mailer }) {
  const router = require('express').Router();
  const admin = auth.required('ADMIN');
  const editor = auth.required('EDITOR');

  router.post('/contact-messages', async (req, res) => {
    try {
      const b = req.body || {};
      if (b.website) return res.status(201).json({ message: 'Thank you' });
      const key = `contact:${req.ip}`;
      if (auth.throttle(key)) return res.status(429).json({ error: 'Too many messages. Please try again later.' });
      auth.recordFailure(key);
      const name = clean(b.name, 200), email = normEmail(b.email), message = clean(b.message, 6000);
      if (!name || !isEmail(email) || message.length < 5) return res.status(400).json({ error: 'Name, a valid email and a message are required' });
      const id = uid();
      await q('INSERT INTO contact_messages (messageId, name, email, phone, subject, message, status, created_at) VALUES (?,?,?,?,?,?,?,?)',
        [id, name, email, clean(b.phone, 30), clean(b.subject, 250), message, 'UNREAD', createdAt()]);
      (async () => {
        const co = await mailer.company();
        const html = await mailer.renderNotice({ kicker: 'New message', title: clean(b.subject, 250) || 'Website enquiry', signature: false, intro: `<p>${esc(message).replace(/\n/g, '<br/>')}</p>`, rows: [['From', name], ['Email', email], ['Phone', clean(b.phone, 30)]] });
        await mailer.send({ to: co.adminEmail, subject: `✉️ Website message from ${name}`, html, replyTo: email });
      })().catch(() => {});
      res.status(201).json({ message: 'Thank you — we will get back to you shortly.' });
    } catch (e) { console.error(e); res.status(500).json({ error: 'Could not send your message' }); }
  });

  router.get('/contact-messages', editor, async (req, res) => {
    try {
      const { status } = req.query;
      res.json(await q(`SELECT * FROM contact_messages ${status ? 'WHERE status = ?' : ''} ORDER BY created_at DESC LIMIT 1000`, status ? [status] : []));
    } catch (e) { res.status(500).json({ error: 'Database error' }); }
  });

  router.put('/contact-messages/:id/status', editor, async (req, res) => {
    try {
      const st = ['UNREAD', 'READ', 'REPLIED', 'ARCHIVED'].includes(req.body.status) ? req.body.status : 'READ';
      await q('UPDATE contact_messages SET status = ? WHERE messageId = ?', [st, req.params.id]);
      res.json({ message: 'Updated' });
    } catch (e) { res.status(500).json({ error: 'Database error' }); }
  });

  router.post('/contact-messages/:id/reply', admin, async (req, res) => {
    try {
      const [m] = await q('SELECT * FROM contact_messages WHERE messageId = ?', [req.params.id]);
      if (!m) return res.status(404).json({ error: 'Message not found' });
      const body = clean(req.body.body, 8000);
      if (!body) return res.status(400).json({ error: 'Write a reply first' });
      const html = await mailer.renderNotice({ kicker: 'Reply', title: m.subject ? `Re: ${m.subject}` : 'Thanks for getting in touch', intro: `<p>Hi ${esc(m.name.split(/\s+/)[0])},</p>${body.split(/\n{2,}/).map((x) => `<p>${esc(x).replace(/\n/g, '<br/>')}</p>`).join('')}` });
      const r = await mailer.send({ to: m.email, subject: m.subject ? `Re: ${m.subject}` : 'Re: your message to us', html, replyTo: req.user.email });
      if (!r.ok) return res.status(502).json({ error: r.skipped ? 'SMTP is not configured (Settings → Email)' : `Send failed: ${r.error}` });
      await q("UPDATE contact_messages SET status = 'REPLIED', reply_text = ?, replied_at = ? WHERE messageId = ?", [body, createdAt(), m.messageId]);
      res.json({ message: 'Reply sent' });
    } catch (e) { res.status(500).json({ error: 'Database error' }); }
  });

  router.delete('/contact-messages/:id', admin, async (req, res) => {
    try { await q('DELETE FROM contact_messages WHERE messageId = ?', [req.params.id]); res.json({ message: 'Deleted' }); }
    catch (e) { res.status(500).json({ error: 'Database error' }); }
  });

  return router;
};
