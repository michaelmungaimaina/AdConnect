'use strict';
/** Shared subscriber logic (used by the subscribe form, bookings, proposals, leads, imports). */
const { uid, createdAt, normEmail, isEmail, clean, tryParseJSON } = require('./util');

module.exports = function createSubscribers({ q, settings, campaign, mailer, auth }) {
  const SLUGS = ['digital-marketing', 'web-development', 'software-development', 'software-design', 'database-management', 'consulting', 'data-analytics', 'training'];
  const cleanInterests = (v) => {
    const arr = Array.isArray(v) ? v : tryParseJSON(v, []);
    return [...new Set((Array.isArray(arr) ? arr : []).map((x) => String(x).toLowerCase().trim()).filter((x) => SLUGS.includes(x)))];
  };

  /**
   * Create or update a subscriber.
   * opts.subscribedAt – backdate (import / sample data); campaign position is calculated from it.
   * opts.silent – don't send the welcome e-mail.
   * Returns { id, created, status, reactivated }.
   */
  async function upsert({ email, name, phone, interests, source = 'website', status, subscribedAt, silent = false, notes }) {
    email = normEmail(email);
    if (!isEmail(email)) throw Object.assign(new Error('A valid email address is required'), { status: 400 });
    const conf = await campaign.cfg();
    const ints = JSON.stringify(cleanInterests(interests));
    const [existing] = await q('SELECT * FROM subscribers WHERE email = ?', [email]);
    const now = createdAt();

    if (existing) {
      const reactivate = existing.status === 'UNSUBSCRIBED' || existing.status === 'PENDING';
      const wantStatus = status || (reactivate ? (conf.doubleOptIn && !silent ? 'PENDING' : 'SUBSCRIBED') : existing.status);
      const merged = JSON.stringify([...new Set([...cleanInterests(existing.interests), ...cleanInterests(interests)])]);
      await q('UPDATE subscribers SET name = COALESCE(NULLIF(?, \'\'), name), phone = COALESCE(NULLIF(?, \'\'), phone), interests = ?, status = ?, unsubscribed_at = ?, unsubscribe_reason = ?, next_send_at = ?, updated_at = ? WHERE id = ?',
        [clean(name, 200), clean(phone, 40), merged, wantStatus, wantStatus === 'SUBSCRIBED' ? null : existing.unsubscribed_at, wantStatus === 'SUBSCRIBED' ? null : existing.unsubscribe_reason,
         wantStatus === 'SUBSCRIBED' && existing.status !== 'SUBSCRIBED' ? (existing.current_step < 0 ? now : createdAt(new Date(Date.now() + 86400000))) : existing.next_send_at, now, existing.id]);
      if (wantStatus === 'SUBSCRIBED' && existing.status !== 'SUBSCRIBED' && existing.current_step < 0 && !silent) campaign.sendWelcome(existing.id).catch(() => {});
      if (wantStatus === 'PENDING' && existing.status !== 'PENDING') sendConfirmation(email, name).catch(() => {});
      return { id: existing.id, created: false, status: wantStatus, reactivated: reactivate && wantStatus === 'SUBSCRIBED' };
    }

    const id = uid();
    const st = status || (conf.doubleOptIn && !silent ? 'PENDING' : 'SUBSCRIBED');
    const subAt = subscribedAt ? createdAt(new Date(subscribedAt)) : now;
    let pos = { current_step: -1, next_send_at: st === 'SUBSCRIBED' ? now : null };
    if (subscribedAt && st === 'SUBSCRIBED') pos = await campaign.placeAt({ interests: ints, subscribed_at: subAt }, subAt);
    await q(`INSERT INTO subscribers (id, email, name, phone, interests, status, source, current_step, next_send_at, subscribed_at, unsubscribed_at, notes, created_at, updated_at)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [id, email, clean(name, 200), clean(phone, 40), ints, st, clean(source, 60) || 'website', pos.current_step, pos.next_send_at, subAt, st === 'UNSUBSCRIBED' ? now : null, notes || null, now, now]);
    if (st === 'SUBSCRIBED' && pos.current_step < 0 && !silent) campaign.sendWelcome(id).catch((e) => console.error('welcome', e.message));
    if (st === 'PENDING' && !silent) sendConfirmation(email, name).catch(() => {});
    return { id, created: true, status: st };
  }

  async function sendConfirmation(email, name) {
    const co = await mailer.company();
    const token = auth.linkToken(email, 'confirm');
    const html = await mailer.renderNotice({
      kicker: 'One more step', title: 'Please confirm your subscription',
      intro: `<p>Hi ${String(name || '').split(/\s+/)[0] || 'there'},</p><p>Tap the button below to confirm that you want to receive tips and updates from ${co.name}. If you did not sign up, simply ignore this e-mail.</p>`,
      cta: 'Confirm subscription', ctaUrl: `/api/subscribe/confirm?token=${encodeURIComponent(token)}`,
    });
    return mailer.send({ to: email, subject: `Confirm your ${co.name} subscription`, html });
  }

  async function setStatusByEmail(email, status, reason) {
    email = normEmail(email);
    const [s] = await q('SELECT * FROM subscribers WHERE email = ?', [email]);
    if (!s) return null;
    if (status === 'UNSUBSCRIBED') {
      await q("UPDATE subscribers SET status = 'UNSUBSCRIBED', unsubscribed_at = ?, unsubscribe_reason = ?, next_send_at = NULL, updated_at = ? WHERE id = ?", [createdAt(), clean(reason, 200) || null, createdAt(), s.id]);
    }
    return s;
  }

  return { upsert, cleanInterests, sendConfirmation, setStatusByEmail, SLUGS };
};
