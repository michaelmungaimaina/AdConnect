'use strict';
const { uid, createdAt, isEmail, normEmail, clean } = require('../lib/util');

module.exports = function ({ db, q, auth }) {
  const router = require('express').Router();
  const ROLES = ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'GEN_USER'];
  const TTL = auth.parseDuration(process.env.JWT_EXPIRES_IN, 8 * 3600);
  const strip = ({ password, ...rest }) => rest;

  // ── Login ──────────────────────────────────────────────────
  router.post('/auth', async (req, res) => {
    try {
      const email = normEmail(req.body.email);
      const password = String(req.body.password || '');
      if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
      const key = `${req.ip}|${email}`;
      if (auth.throttle(key)) return res.status(429).json({ error: 'Too many failed attempts. Please wait 15 minutes and try again.' });

      const rows = await q('SELECT * FROM users WHERE LOWER(email) = ?', [email]);
      const user = rows[0];
      if (!user || !auth.verifyPassword(password, user.password)) {
        auth.recordFailure(key);
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      auth.clearFailures(key);
      if (!auth.isHashed(user.password)) await q('UPDATE users SET password = ? WHERE id = ?', [auth.hashPassword(password), user.id]);
      const role = user.role || 'GEN_USER';
      const token = auth.sign({ t: 'admin', id: user.id, name: user.name, email: user.email, role }, TTL);
      res.json({ message: 'Login successful', token, expiresIn: TTL, username: user.name, email: user.email, role, id: user.id });
    } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }); }
  });

  router.get('/auth/me', auth.required(), (req, res) => res.json({ id: req.user.id, username: req.user.name, email: req.user.email, role: req.user.role }));

  router.post('/auth/change-password', auth.required(), async (req, res) => {
    try {
      const { current, next } = req.body;
      if (!next || String(next).length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters' });
      const [u] = await q('SELECT * FROM users WHERE id = ?', [req.user.id]);
      if (!u || !auth.verifyPassword(String(current || ''), u.password)) return res.status(400).json({ error: 'Current password is incorrect' });
      await q('UPDATE users SET password = ?, updated_at = ? WHERE id = ?', [auth.hashPassword(next), createdAt(), u.id]);
      res.json({ message: 'Password updated' });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
  });

  // ── User management (SUPER_ADMIN) ──────────────────────────
  const su = auth.required('SUPER_ADMIN');

  router.get('/users', su, async (req, res) => {
    try { res.json((await q('SELECT * FROM users ORDER BY created_at DESC')).map(strip)); }
    catch (e) { res.status(500).json({ error: 'Database error' }); }
  });
  router.get('/users/:id', su, async (req, res) => {
    try {
      const r = await q('SELECT * FROM users WHERE id = ?', [req.params.id]);
      if (!r.length) return res.status(404).json({ error: 'User not found' });
      res.json(strip(r[0]));
    } catch (e) { res.status(500).json({ error: 'Database error' }); }
  });
  router.post('/users', su, async (req, res) => {
    try {
      const name = clean(req.body.name, 150), email = normEmail(req.body.email), role = req.body.role, pw = String(req.body.password || '');
      if (!name || !isEmail(email) || !role) return res.status(400).json({ error: 'Name, a valid email and role are required' });
      if (!ROLES.includes(role)) return res.status(400).json({ error: 'Invalid role' });
      if (pw.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
      if ((await q('SELECT id FROM users WHERE LOWER(email) = ?', [email])).length) return res.status(400).json({ error: 'A user with this email already exists' });
      const id = uid();
      await q('INSERT INTO users (id, name, email, password, role, access_level, created_at) VALUES (?,?,?,?,?,?,?)',
        [id, name, email, auth.hashPassword(pw), role, clean(req.body.access_level, 10) || '0R00', createdAt()]);
      res.status(201).json({ message: 'User created successfully', user: { id, name, email, role } });
    } catch (e) { console.error(e); res.status(500).json({ error: 'Database error' }); }
  });
  router.put('/users/:id', su, async (req, res) => {
    try {
      const { id } = req.params;
      const name = clean(req.body.name, 150), email = normEmail(req.body.email), role = req.body.role;
      if (!name || !isEmail(email) || !ROLES.includes(role)) return res.status(400).json({ error: 'Name, a valid email and a valid role are required' });
      if (id === req.user.id && role !== 'SUPER_ADMIN') return res.status(400).json({ error: 'You cannot remove your own Super Admin role' });
      const dup = await q('SELECT id FROM users WHERE LOWER(email) = ? AND id <> ?', [email, id]);
      if (dup.length) return res.status(400).json({ error: 'Another user already uses this email' });
      const pw = String(req.body.password || '');
      if (pw) {
        if (pw.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
        await q('UPDATE users SET name=?, email=?, password=?, role=?, access_level=?, updated_at=? WHERE id=?', [name, email, auth.hashPassword(pw), role, clean(req.body.access_level, 10) || '0R00', createdAt(), id]);
      } else {
        await q('UPDATE users SET name=?, email=?, role=?, access_level=?, updated_at=? WHERE id=?', [name, email, role, clean(req.body.access_level, 10) || '0R00', createdAt(), id]);
      }
      res.json({ message: 'User updated successfully' });
    } catch (e) { console.error(e); res.status(500).json({ error: 'Database error' }); }
  });
  router.delete('/users/:id', su, async (req, res) => {
    try {
      if (req.params.id === req.user.id) return res.status(400).json({ error: 'You cannot delete your own account' });
      await q('DELETE FROM users WHERE id = ?', [req.params.id]);
      res.json({ message: 'User deleted successfully' });
    } catch (e) { res.status(500).json({ error: 'Database error' }); }
  });

  return router;
};
