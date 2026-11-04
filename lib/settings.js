'use strict';
/** Cached reader/writer for the `site_settings` key/value table. */
module.exports = function createSettings(db) {
  const cache = new Map(); // section -> { at, data }
  const TTL = 30 * 1000;
  const SECRET_KEY = /(password|secret|token|api_key)/i;

  const q = (sql, params = []) => new Promise((res, rej) => db.query(sql, params, (e, r) => (e ? rej(e) : res(r))));

  async function getSection(section, { force = false } = {}) {
    const hit = cache.get(section);
    if (!force && hit && Date.now() - hit.at < TTL) return hit.data;
    const rows = await q('SELECT setting_key, setting_value FROM site_settings WHERE section = ?', [section]);
    const data = {};
    rows.forEach((r) => { data[r.setting_key] = r.setting_value; });
    cache.set(section, { at: Date.now(), data });
    return data;
  }

  async function get(section, key, fallback = '') {
    const d = await getSection(section);
    return d[key] !== undefined && d[key] !== null && d[key] !== '' ? d[key] : fallback;
  }

  async function setMany(section, obj) {
    const entries = Object.entries(obj || {});
    for (const [k, v] of entries) {
      await q(
        `INSERT INTO site_settings (section, setting_key, setting_value, updated_at) VALUES (?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()`,
        [section, String(k).slice(0, 100), v == null ? '' : String(v)]
      );
    }
    cache.delete(section);
  }

  async function remove(section, keys) {
    for (const k of keys) await q('DELETE FROM site_settings WHERE section = ? AND setting_key = ?', [section, k]);
    cache.delete(section);
  }

  /** Same as getSection but with secrets removed – safe for public API responses. */
  async function getPublic(section) {
    const d = await getSection(section);
    const out = {};
    Object.keys(d).forEach((k) => { if (!SECRET_KEY.test(k)) out[k] = d[k]; });
    return out;
  }

  const invalidate = (section) => (section ? cache.delete(section) : cache.clear());

  return { getSection, get, setMany, remove, getPublic, invalidate, SECRET_KEY };
};
