'use strict';
/**
 * Drip-campaign engine.
 *  • Each subscriber carries `current_step` (last e-mail sent, -1 = none) and `next_send_at`.
 *  • Step 0 is the welcome e-mail (sent right after subscribing). Steps 1…n follow on
 *    `day_offset` days after the subscription date, never closer than `min_gap_days`.
 *  • Editing the steps in the admin panel takes effect immediately for everyone.
 */
const { uid, createdAt, tryParseJSON, sleep, esc } = require('./util');
const { linkToken } = require('./auth');

module.exports = function createCampaign({ db, settings, mailer }) {
  const q = (sql, params = []) => new Promise((res, rej) => db.query(sql, params, (e, r) => (e ? rej(e) : res(r))));
  const GENERAL = new Set(['welcome', 'general']);
  let running = false;

  async function cfg() {
    const s = await settings.getSection('campaign');
    return {
      enabled: s.enabled !== 'false',
      respectInterests: s.respect_interests === 'true',
      minGapDays: Math.max(0, parseFloat(s.min_gap_days || '1')),
      batch: Math.min(200, Math.max(1, parseInt(s.batch_size || '25', 10))),
      doubleOptIn: s.double_opt_in === 'true',
    };
  }

  async function baseUrl() { return (await mailer.company()).baseUrl; }
  async function unsubUrl(email) { return `${await baseUrl()}/unsubscribe.html?t=${encodeURIComponent(linkToken(email, 'unsub'))}`; }

  const toMysql = (d) => createdAt(d);
  const stepsActive = () => q("SELECT * FROM email_campaign_steps WHERE status = 'ACTIVE' ORDER BY step ASC");

  function eligible(step, sub, conf) {
    if (!conf.respectInterests) return true;
    if (GENERAL.has(step.category)) return true;
    const interests = tryParseJSON(sub.interests, []);
    return !interests.length || interests.includes(step.category);
  }

  function nextEligible(steps, sub, conf, after) {
    return steps.find((s) => s.step > after && eligible(s, sub, conf)) || null;
  }

  function scheduleAfter(sub, nextStep, conf, from = new Date()) {
    if (!nextStep) return null;
    const base = new Date(sub.subscribed_at || sub.created_at || from);
    const byOffset = new Date(base.getTime() + nextStep.day_offset * 86400000);
    const byGap = new Date(from.getTime() + conf.minGapDays * 86400000);
    return toMysql(byOffset > byGap ? byOffset : byGap);
  }

  /** Render + send one step to one subscriber (does not touch subscriber progress). */
  async function deliver(step, sub, { kind = 'CAMPAIGN', subjectPrefix = '' } = {}) {
    const url = await unsubUrl(sub.email);
    const { subject, html } = await mailer.renderCampaign(step, sub, { unsubscribeUrl: url });
    const res = await mailer.send({
      to: sub.email, subject: subjectPrefix + subject, html,
      headers: { 'List-Unsubscribe': `<${url}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
    });
    await q('INSERT INTO email_log (id, email, kind, step, subject, status, error, created_at) VALUES (?,?,?,?,?,?,?,?)',
      [uid(), sub.email, kind, step.step, subject.slice(0, 300), res.ok ? 'SENT' : 'FAILED', res.error ? String(res.error).slice(0, 480) : null, createdAt()]);
    return res;
  }

  /** Send the next due step to one subscriber and advance their progress. */
  async function sendNext(sub, steps, conf) {
    const step = nextEligible(steps, sub, conf, sub.current_step);
    if (!step) {
      await q('UPDATE subscribers SET next_send_at = NULL, updated_at = ? WHERE id = ?', [createdAt(), sub.id]);
      return { done: true };
    }
    const res = await deliver(step, sub);
    if (!res.ok) {
      const [{ n }] = await q("SELECT COUNT(*) AS n FROM email_log WHERE email = ? AND step = ? AND status = 'FAILED' AND kind = 'CAMPAIGN'", [sub.email, step.step]);
      if (n >= 3) {
        await q("UPDATE subscribers SET next_send_at = NULL, notes = CONCAT(COALESCE(notes,''), ?), updated_at = ? WHERE id = ?", [`\n[auto] Delivery failed 3 times at step ${step.step}: ${res.error}`, createdAt(), sub.id]);
      } else {
        await q('UPDATE subscribers SET next_send_at = ?, updated_at = ? WHERE id = ?', [toMysql(new Date(Date.now() + 6 * 3600000)), createdAt(), sub.id]);
      }
      return { failed: true, error: res.error };
    }
    const after = nextEligible(steps, { ...sub, current_step: step.step }, conf, step.step);
    await q('UPDATE subscribers SET current_step = ?, last_sent_at = ?, next_send_at = ?, updated_at = ? WHERE id = ?',
      [step.step, createdAt(), scheduleAfter(sub, after, conf), createdAt(), sub.id]);
    return { sent: true, step: step.step };
  }

  /** Called by cron every 15 minutes (and by the admin "Run now" button). */
  async function processDue({ limit } = {}) {
    if (running) return { busy: true };
    running = true;
    const out = { sent: 0, failed: 0, completed: 0, checked: 0 };
    try {
      const conf = await cfg();
      if (!conf.enabled) return { ...out, disabled: true };
      const steps = await stepsActive();
      if (!steps.length) return out;
      const due = await q("SELECT * FROM subscribers WHERE status = 'SUBSCRIBED' AND next_send_at IS NOT NULL AND next_send_at <= ? ORDER BY next_send_at ASC LIMIT ?", [createdAt(), limit || conf.batch]);
      for (const sub of due) {
        out.checked++;
        const r = await sendNext(sub, steps, conf);
        if (r.sent) out.sent++; else if (r.failed) out.failed++; else if (r.done) out.completed++;
        await sleep(250);
      }
      return out;
    } finally { running = false; }
  }

  /** Immediately send the welcome e-mail to a brand-new subscriber. */
  async function sendWelcome(subId) {
    const [sub] = await q('SELECT * FROM subscribers WHERE id = ?', [subId]);
    if (!sub || sub.status !== 'SUBSCRIBED' || sub.current_step >= 0) return { skipped: true };
    const conf = await cfg();
    if (!conf.enabled) return { skipped: true };
    const steps = await stepsActive();
    return sendNext(sub, steps, conf);
  }

  /** Place a subscriber at the right point (used by imports with an old subscription date). */
  async function placeAt(sub, subscribedAt) {
    const conf = await cfg();
    const steps = await stepsActive();
    const daysIn = Math.max(0, (Date.now() - new Date(subscribedAt).getTime()) / 86400000);
    const sent = steps.filter((s) => s.day_offset <= daysIn);
    const last = sent.length ? sent[sent.length - 1].step : -1;
    const next = nextEligible(steps, { ...sub, subscribed_at: subscribedAt }, conf, last);
    return { current_step: last, next_send_at: next ? scheduleAfter({ ...sub, subscribed_at: subscribedAt }, next, conf) : null };
  }

  // ── Broadcasts ───────────────────────────────────────────────
  async function audienceRows(audience) {
    let sql = "SELECT * FROM subscribers WHERE status = 'SUBSCRIBED'";
    const params = [];
    if (audience && audience !== 'ALL') {
      const m = /^interest:(.+)$/.exec(audience);
      if (m) { sql += ' AND interests LIKE ?'; params.push(`%"${m[1].replace(/[^a-z-]/g, '')}"%`); }
      const s = /^source:(.+)$/.exec(audience);
      if (s) { sql += ' AND source = ?'; params.push(s[1]); }
    }
    return q(sql, params);
  }

  async function sendBroadcast(id) {
    const [b] = await q('SELECT * FROM broadcasts WHERE id = ?', [id]);
    if (!b) throw new Error('Broadcast not found');
    if (b.status === 'SENDING') throw new Error('Already sending');
    const rows = await audienceRows(b.audience);
    await q("UPDATE broadcasts SET status = 'SENDING', recipients = ?, sent_count = 0, failed_count = 0, updated_at = ? WHERE id = ?", [rows.length, createdAt(), id]);
    (async () => {
      let ok = 0, bad = 0;
      for (const sub of rows) {
        const step = { subject: b.subject, preheader: b.preheader, kicker: 'Update', title: b.title || b.subject, body_html: b.body_html, cta_text: b.cta_text, cta_url: b.cta_url, step: null };
        const url = await unsubUrl(sub.email);
        const { subject, html } = await mailer.renderCampaign(step, sub, { unsubscribeUrl: url });
        const r = await mailer.send({ to: sub.email, subject, html, headers: { 'List-Unsubscribe': `<${url}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' } });
        r.ok ? ok++ : bad++;
        await q('INSERT INTO email_log (id, email, kind, broadcast_id, subject, status, error, created_at) VALUES (?,?,?,?,?,?,?,?)',
          [uid(), sub.email, 'BROADCAST', id, subject.slice(0, 300), r.ok ? 'SENT' : 'FAILED', r.error ? String(r.error).slice(0, 480) : null, createdAt()]);
        if ((ok + bad) % 10 === 0) await q('UPDATE broadcasts SET sent_count = ?, failed_count = ? WHERE id = ?', [ok, bad, id]);
        await sleep(300);
      }
      await q("UPDATE broadcasts SET status = 'SENT', sent_count = ?, failed_count = ?, sent_at = ?, updated_at = ? WHERE id = ?", [ok, bad, createdAt(), createdAt(), id]);
    })().catch(async (e) => { console.error('Broadcast error:', e); await q("UPDATE broadcasts SET status = 'DRAFT' WHERE id = ?", [id]).catch(() => {}); });
    return { recipients: rows.length };
  }

  return { cfg, processDue, sendWelcome, deliver, placeAt, sendBroadcast, audienceRows, unsubUrl, stepsActive, nextEligible };
};
