'use strict';
/**
 * Website theme (colours) managed from the admin panel.
 * Fonts are intentionally NOT configurable – they stay Syne / DM Sans / IBM Plex Mono.
 *
 * The public site loads /api/theme.css (generated here) AFTER css/theme.css, so any
 * colour saved in the admin overrides the defaults defined in the stylesheet.
 */
const crypto = require('crypto');

// key → { var, label, group, default }
const TOKENS = {
  primary:        { cssVar: '--clr-primary',        label: 'Primary (buttons, highlights)', group: 'Brand',      default: '#F65730' },
  primary_hover:  { cssVar: '--clr-primary-hover',  label: 'Primary – hover',               group: 'Brand',      default: '#D94522' },
  accent:         { cssVar: '--clr-accent',         label: 'Accent (success, secondary)',   group: 'Brand',      default: '#4ABC4F' },
  accent_hover:   { cssVar: '--clr-accent-hover',   label: 'Accent – hover',                group: 'Brand',      default: '#37A041' },
  bg:             { cssVar: '--clr-bg',             label: 'Page background',               group: 'Surfaces',   default: '#1A1917' },
  surface_1:      { cssVar: '--clr-surface-1',      label: 'Surface 1 (cards)',             group: 'Surfaces',   default: '#252320' },
  surface_2:      { cssVar: '--clr-surface-2',      label: 'Surface 2 (inputs, panels)',    group: 'Surfaces',   default: '#302E2C' },
  surface_3:      { cssVar: '--clr-surface-3',      label: 'Surface 3 (raised)',            group: 'Surfaces',   default: '#4D4C4B' },
  border:         { cssVar: '--clr-border',         label: 'Borders',                       group: 'Surfaces',   default: '#3D3B39' },
  text_primary:   { cssVar: '--clr-text-primary',   label: 'Text – main',                   group: 'Text',       default: '#F4F1EE' },
  text_secondary: { cssVar: '--clr-text-secondary', label: 'Text – secondary',              group: 'Text',       default: '#B8B4B0' },
  text_muted:     { cssVar: '--clr-text-muted',     label: 'Text – muted',                  group: 'Text',       default: '#7A7874' },
  success:        { cssVar: '--clr-success',        label: 'Success',                       group: 'Status',     default: '#4ABC4F' },
  warning:        { cssVar: '--clr-warning',        label: 'Warning',                       group: 'Status',     default: '#F5A623' },
  error:          { cssVar: '--clr-error',          label: 'Error',                         group: 'Status',     default: '#E74C3C' },
  info:           { cssVar: '--clr-info',           label: 'Info',                          group: 'Status',     default: '#3498DB' },
};

// Ready-made palettes. "AdConnect Classic" is the original look.
const PRESETS = {
  classic:  { name: 'AdConnect Classic', colors: {} },
  ocean:    { name: 'Ocean Blue',   colors: { primary: '#2F80ED', primary_hover: '#1F63C2', accent: '#27D3A2', accent_hover: '#1DAE85', bg: '#0F1722', surface_1: '#162131', surface_2: '#1E2C41', surface_3: '#34475F', border: '#2A3B52', text_primary: '#EAF1FA', text_secondary: '#AEBBCC', text_muted: '#7488A0' } },
  emerald:  { name: 'Emerald Night', colors: { primary: '#22B573', primary_hover: '#17935C', accent: '#F5B72D', accent_hover: '#D69A14', bg: '#0F1A16', surface_1: '#15241E', surface_2: '#1D3128', surface_3: '#3A5649', border: '#294236', text_primary: '#EAF6F0', text_secondary: '#A9C2B6', text_muted: '#6F8A7D' } },
  violet:   { name: 'Violet Studio', colors: { primary: '#8B5CF6', primary_hover: '#7040DE', accent: '#F472B6', accent_hover: '#DB5398', bg: '#15111F', surface_1: '#1E182C', surface_2: '#292140', surface_3: '#4A4066', border: '#372E52', text_primary: '#F1EDFB', text_secondary: '#BDB2D8', text_muted: '#8277A3' } },
  daylight: { name: 'Daylight (light mode)', colors: { primary: '#E8481C', primary_hover: '#C23A13', accent: '#1F9D55', accent_hover: '#167A41', bg: '#F7F5F2', surface_1: '#FFFFFF', surface_2: '#EFEBE6', surface_3: '#D8D2CB', border: '#DDD6CE', text_primary: '#1D1B19', text_secondary: '#4D4943', text_muted: '#7B756D', success: '#1F9D55', warning: '#C98200', error: '#CF3A2B', info: '#2B73B8' } },
};

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const normHex = (v) => {
  if (typeof v !== 'string') return null;
  v = v.trim();
  if (!HEX.test(v)) return null;
  if (v.length === 4) v = '#' + v[1] + v[1] + v[2] + v[2] + v[3] + v[3];
  return v.toUpperCase();
};

function rgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** WCAG relative luminance → used to choose readable text colour on the primary colour. */
function luminance(hex) {
  const c = rgb(hex).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
function contrast(a, b) {
  const la = luminance(a), lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Merge saved values over defaults; ignores unknown keys & invalid colours. */
function resolve(saved = {}) {
  const out = {};
  Object.entries(TOKENS).forEach(([k, t]) => { out[k] = normHex(saved[k]) || t.default; });
  return out;
}

function buildCss(colors) {
  const c = resolve(colors);
  const [pr, pg, pb] = rgb(c.primary);
  const [ar, ag, ab] = rgb(c.accent);
  const onPrimary = luminance(c.primary) > 0.5 ? '#111111' : '#FFFFFF';
  const lines = Object.entries(TOKENS).map(([k, t]) => `  ${t.cssVar}: ${c[k]};`);
  lines.push(`  --clr-primary-light: rgba(${pr},${pg},${pb},.18);`);
  lines.push(`  --clr-primary-glow: rgba(${pr},${pg},${pb},.35);`);
  lines.push(`  --clr-accent-light: rgba(${ar},${ag},${ab},.15);`);
  lines.push(`  --clr-on-primary: ${onPrimary};`);
  lines.push(`  --clr-primary-rgb: ${pr},${pg},${pb};`);
  lines.push(`  --clr-accent-rgb: ${ar},${ag},${ab};`);
  lines.push(`  --clr-border-light: ${c.text_muted};`);
  lines.push(`  --clr-surface-4: ${c.surface_3};`);
  lines.push(`  color-scheme: ${luminance(c.bg) > 0.5 ? 'light' : 'dark'};`);
  return `/* AdConnect theme – generated from Admin → Appearance */\n:root {\n${lines.join('\n')}\n}\n`;
}

module.exports = function createTheme(settings) {
  let cache = null;

  async function load(force = false) {
    if (cache && !force) return cache;
    const saved = await settings.getSection('theme', { force });
    const colors = resolve(saved);
    const css = buildCss(colors);
    cache = { colors, css, etag: '"' + crypto.createHash('sha1').update(css).digest('hex').slice(0, 16) + '"', preset: saved.preset || 'custom' };
    return cache;
  }

  async function save(input, preset) {
    const toSave = {};
    Object.keys(TOKENS).forEach((k) => {
      if (input && input[k] !== undefined) {
        const h = normHex(input[k]);
        if (!h) throw Object.assign(new Error(`Invalid colour for "${k}" – use a hex value such as #F65730`), { status: 400 });
        toSave[k] = h;
      }
    });
    toSave.preset = preset || 'custom';
    await settings.setMany('theme', toSave);
    cache = null;
    return load(true);
  }

  async function reset() {
    await settings.remove('theme', [...Object.keys(TOKENS), 'preset']);
    cache = null;
    return load(true);
  }

  return { load, save, reset, TOKENS, PRESETS, resolve, buildCss, normHex, contrast };
};
module.exports.TOKENS = TOKENS; module.exports.PRESETS = PRESETS; module.exports.buildCss = buildCss; module.exports.resolve = resolve; module.exports.normHex = normHex; module.exports.contrast = contrast;
