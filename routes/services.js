'use strict';
const { uid, createdAt, tryParseJSON, clean, slugify } = require('../lib/util');

module.exports = function ({ q, auth }) {
  const router = require('express').Router();
  const admin = auth.required('ADMIN');

  const shapeService = (s) => ({ ...s, features: tryParseJSON(s.features, []), featured: !!s.featured });
  const shapeCat = (c) => ({ ...c, allow_booking: !!c.allow_booking, allow_proposal: !!c.allow_proposal });

  async function uniqueSlug(table, base, ignoreId) {
    let slug = slugify(base) || 'item', n = 1;
    for (;;) {
      const rows = await q(`SELECT id FROM \`${table}\` WHERE slug = ?${ignoreId ? ' AND id <> ?' : ''}`, ignoreId ? [slug, ignoreId] : [slug]);
      if (!rows.length) return slug;
      slug = `${slugify(base)}-${++n}`;
    }
  }

  async function catalogue({ all = false, slug = null } = {}) {
    const cats = await q(`SELECT * FROM service_categories ${all ? '' : "WHERE status = 'ACTIVE'"} ${slug ? (all ? 'WHERE' : 'AND') + ' slug = ?' : ''} ORDER BY sort_order ASC, name ASC`, slug ? [slug] : []);
    const svcs = await q(`SELECT * FROM services ${all ? '' : "WHERE status = 'ACTIVE'"} ORDER BY sort_order ASC, name ASC`);
    return cats.map((c) => ({ ...shapeCat(c), services: svcs.filter((s) => s.category_id === c.id).map(shapeService) }));
  }

  // ── Public ────────────────────────────────────────────────
  router.get('/service-categories', async (req, res) => {
    try {
      const wantAll = req.query.all === '1' && req.user && auth.RANK[req.user.role] >= auth.RANK.EDITOR;
      const data = await catalogue({ all: wantAll });
      res.json(req.query.include === 'services' || wantAll ? data : data.map(({ services, ...c }) => ({ ...c, service_count: services.length })));
    } catch (e) { console.error(e); res.status(500).json({ error: 'Database error' }); }
  });
  router.get('/service-categories/:slug', async (req, res) => {
    try {
      const [c] = await catalogue({ slug: req.params.slug });
      if (!c) return res.status(404).json({ error: 'Category not found' });
      res.json(c);
    } catch (e) { res.status(500).json({ error: 'Database error' }); }
  });
  router.get('/services', async (req, res) => {
    try {
      const data = await catalogue();
      let list = data.flatMap((c) => c.services.map((s) => ({ ...s, category_slug: c.slug, category_name: c.name })));
      if (req.query.category) list = list.filter((s) => s.category_slug === req.query.category);
      if (req.query.featured) list = list.filter((s) => s.featured);
      res.json(list);
    } catch (e) { res.status(500).json({ error: 'Database error' }); }
  });

  // ── Admin: categories ─────────────────────────────────────
  router.post('/service-categories', admin, async (req, res) => {
    try {
      const b = req.body;
      const name = clean(b.name, 150);
      if (!name) return res.status(400).json({ error: 'Category name is required' });
      const id = uid(), now = createdAt();
      const slug = await uniqueSlug('service_categories', b.slug || name);
      await q(`INSERT INTO service_categories (id, slug, name, tagline, description, icon, sort_order, status, allow_booking, allow_proposal, session_minutes, host_key, host_name, created_at, updated_at)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [id, slug, name, clean(b.tagline, 300), clean(b.description, 4000), clean(b.icon, 60) || 'fa-star', parseInt(b.sort_order, 10) || 0,
         b.status === 'HIDDEN' ? 'HIDDEN' : 'ACTIVE', b.allow_booking === false || b.allow_booking === 0 ? 0 : 1, b.allow_proposal === false || b.allow_proposal === 0 ? 0 : 1,
         Math.min(240, Math.max(10, parseInt(b.session_minutes, 10) || 30)), slugify(b.host_key || 'team') || 'team', clean(b.host_name, 120) || 'AdConnect Team', now, now]);
      res.status(201).json({ message: 'Category created', id, slug });
    } catch (e) { console.error(e); res.status(500).json({ error: 'Database error' }); }
  });
  router.put('/service-categories/:id', admin, async (req, res) => {
    try {
      const b = req.body, id = req.params.id;
      const name = clean(b.name, 150);
      if (!name) return res.status(400).json({ error: 'Category name is required' });
      const slug = await uniqueSlug('service_categories', b.slug || name, id);
      await q(`UPDATE service_categories SET slug=?, name=?, tagline=?, description=?, icon=?, sort_order=?, status=?, allow_booking=?, allow_proposal=?, session_minutes=?, host_key=?, host_name=?, updated_at=? WHERE id=?`,
        [slug, name, clean(b.tagline, 300), clean(b.description, 4000), clean(b.icon, 60) || 'fa-star', parseInt(b.sort_order, 10) || 0,
         b.status === 'HIDDEN' ? 'HIDDEN' : 'ACTIVE', b.allow_booking === false || b.allow_booking === 0 ? 0 : 1, b.allow_proposal === false || b.allow_proposal === 0 ? 0 : 1,
         Math.min(240, Math.max(10, parseInt(b.session_minutes, 10) || 30)), slugify(b.host_key || 'team') || 'team', clean(b.host_name, 120) || 'AdConnect Team', createdAt(), id]);
      res.json({ message: 'Category updated', slug });
    } catch (e) { console.error(e); res.status(500).json({ error: 'Database error' }); }
  });
  router.delete('/service-categories/:id', admin, async (req, res) => {
    try {
      await q('DELETE FROM services WHERE category_id = ?', [req.params.id]);
      await q('DELETE FROM service_categories WHERE id = ?', [req.params.id]);
      res.json({ message: 'Category and its services deleted' });
    } catch (e) { res.status(500).json({ error: 'Database error' }); }
  });

  // ── Admin: services ───────────────────────────────────────
  const featuresOf = (f) => JSON.stringify((Array.isArray(f) ? f : String(f || '').split('\n')).map((x) => String(x).trim()).filter(Boolean).slice(0, 12));
  router.post('/services', admin, async (req, res) => {
    try {
      const b = req.body, name = clean(b.name, 200);
      if (!name || !b.category_id) return res.status(400).json({ error: 'Service name and category are required' });
      const [cat] = await q('SELECT id FROM service_categories WHERE id = ?', [b.category_id]);
      if (!cat) return res.status(400).json({ error: 'Unknown category' });
      const id = uid(), now = createdAt();
      await q(`INSERT INTO services (id, category_id, slug, name, summary, description, features, icon, starting_price, delivery_time, sort_order, featured, status, created_at, updated_at)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [id, b.category_id, await uniqueSlug('services', b.slug || name), name, clean(b.summary, 500), clean(b.description, 6000), featuresOf(b.features), clean(b.icon, 60) || 'fa-check',
         clean(b.starting_price, 100), clean(b.delivery_time, 100), parseInt(b.sort_order, 10) || 0, b.featured ? 1 : 0, b.status === 'HIDDEN' ? 'HIDDEN' : 'ACTIVE', now, now]);
      res.status(201).json({ message: 'Service created', id });
    } catch (e) { console.error(e); res.status(500).json({ error: 'Database error' }); }
  });
  router.put('/services/:id', admin, async (req, res) => {
    try {
      const b = req.body, id = req.params.id, name = clean(b.name, 200);
      if (!name || !b.category_id) return res.status(400).json({ error: 'Service name and category are required' });
      await q(`UPDATE services SET category_id=?, slug=?, name=?, summary=?, description=?, features=?, icon=?, starting_price=?, delivery_time=?, sort_order=?, featured=?, status=?, updated_at=? WHERE id=?`,
        [b.category_id, await uniqueSlug('services', b.slug || name, id), name, clean(b.summary, 500), clean(b.description, 6000), featuresOf(b.features), clean(b.icon, 60) || 'fa-check',
         clean(b.starting_price, 100), clean(b.delivery_time, 100), parseInt(b.sort_order, 10) || 0, b.featured ? 1 : 0, b.status === 'HIDDEN' ? 'HIDDEN' : 'ACTIVE', createdAt(), id]);
      res.json({ message: 'Service updated' });
    } catch (e) { console.error(e); res.status(500).json({ error: 'Database error' }); }
  });
  router.delete('/services/:id', admin, async (req, res) => {
    try { await q('DELETE FROM services WHERE id = ?', [req.params.id]); res.json({ message: 'Service deleted' }); }
    catch (e) { res.status(500).json({ error: 'Database error' }); }
  });

  return router;
};
