'use strict';
/** Public stylesheet + admin colour manager. */
module.exports = function ({ auth, theme }) {
  const router = require('express').Router();

  router.get('/theme.css', async (req, res) => {
    try {
      const t = await theme.load();
      if (req.headers['if-none-match'] === t.etag) return res.status(304).end();
      res.set({ 'Content-Type': 'text/css; charset=utf-8', ETag: t.etag, 'Cache-Control': 'public, max-age=60, must-revalidate' });
      res.send(t.css);
    } catch (e) { res.type('text/css').send('/* theme unavailable */'); }
  });

  const describe = (t) => ({
    preset: t.preset, colors: t.colors,
    tokens: Object.entries(theme.TOKENS).map(([key, v]) => ({ key, label: v.label, group: v.group, default: v.default })),
    presets: Object.entries(theme.PRESETS).map(([key, p]) => ({ key, name: p.name, colors: { ...Object.fromEntries(Object.entries(theme.TOKENS).map(([k, v]) => [k, v.default])), ...p.colors } })),
    contrast: { buttonText: theme.contrast(t.colors.primary, t.colors.bg), body: theme.contrast(t.colors.text_primary, t.colors.bg) },
  });

  router.get('/theme', async (req, res) => { try { res.json(describe(await theme.load())); } catch (e) { res.status(500).json({ error: 'Could not load theme' }); } });

  router.put('/theme', auth.required('ADMIN'), async (req, res) => {
    try {
      const b = req.body || {};
      let colors = b.colors || {};
      let preset = b.preset && theme.PRESETS[b.preset] ? b.preset : 'custom';
      if (b.preset && theme.PRESETS[b.preset] && !Object.keys(colors).length) colors = { ...Object.fromEntries(Object.entries(theme.TOKENS).map(([k, v]) => [k, v.default])), ...theme.PRESETS[b.preset].colors };
      res.json({ message: 'Theme saved', ...describe(await theme.save(colors, preset)) });
    } catch (e) { res.status(e.status || 500).json({ error: e.status ? e.message : 'Could not save theme' }); }
  });

  router.post('/theme/reset', auth.required('ADMIN'), async (req, res) => {
    try { res.json({ message: 'Theme reset to AdConnect Classic', ...describe(await theme.reset()) }); }
    catch (e) { res.status(500).json({ error: 'Could not reset theme' }); }
  });

  return router;
};
