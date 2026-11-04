'use strict';
const { uid, createdAt, reference, isEmail, normEmail, clean, ymd, pad } = require('../lib/util');

module.exports = function ({ q, auth, settings, mailer, google, subscribe }) {
  const router = require('express').Router();
  const admin = auth.required('ADMIN');
  const MODES = ['ONLINE', 'PHONE', 'IN_PERSON'];
  const STATUSES = ['PENDING', 'CONFIRMED', 'RESCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];
  const ACTIVE = ['PENDING', 'CONFIRMED', 'RESCHEDULED'];
  const MODE_LABEL = { ONLINE: 'Online (video call)', PHONE: 'Phone call', IN_PERSON: 'In person' };

  const toMin = (t) => { const [h, m] = String(t).split(':').map(Number); return h * 60 + m; };
  const fromMin = (n) => `${pad(Math.floor(n / 60))}:${pad(n % 60)}`;
  const label12 = (t) => { let [h, m] = t.split(':').map(Number); const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; return `${pad(h)}:${pad(m)} ${ap}`; };
  const niceDate = (d) => new Date(`${String(d).slice(0, 10)}T12:00:00`).toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const isDate = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d) && !isNaN(new Date(`${d}T12:00:00`));

  async function rules() {
    const s = await settings.getSection('booking');
    return {
      days: String(s.days || '1,2,3,4,5,6').split(',').map((x) => parseInt(x, 10)).filter((x) => x >= 1 && x <= 7),
      start: /^\d{2}:\d{2}$/.test(s.start) ? s.start : '09:00',
      end: /^\d{2}:\d{2}$/.test(s.end) ? s.end : '17:00',
      minNoticeHours: parseFloat(s.min_notice_hours || '12'),
      maxDaysAhead: parseInt(s.max_days_ahead || '60', 10),
      blocked: String(s.blocked_dates || '').split(/[,\s]+/).filter(Boolean),
      buffer: parseInt(s.buffer_minutes || '0', 10) || 0,
      autoConfirm: s.auto_confirm === 'true',
      inPerson: s.in_person_location || '',
      note: s.online_provider_note || '',
    };
  }

  async function category(slug) {
    const [c] = await q("SELECT * FROM service_categories WHERE slug = ? AND status = 'ACTIVE'", [slug]);
    return c || null;
  }

  /** All free start-times for a category on a date. */
  async function slotsFor(cat, date, r, excludeId) {
    const d = new Date(`${date}T12:00:00`);
    const iso = d.getDay() === 0 ? 7 : d.getDay();
    const now = new Date();
    const today = ymd(now);
    if (!r.days.includes(iso)) return { closed: 'Not available on this day', slots: [] };
    if (r.blocked.includes(date)) return { closed: 'Fully booked / unavailable on this date', slots: [] };
    if (date < today) return { closed: 'This date has passed', slots: [] };
    if (new Date(`${date}T00:00:00`).getTime() > now.getTime() + r.maxDaysAhead * 86400000) return { closed: `Bookings open ${r.maxDaysAhead} days ahead`, slots: [] };

    const busy = (await q(`SELECT id, start_time, end_time FROM bookings WHERE booking_date = ? AND host_key = ? AND status IN ('PENDING','CONFIRMED','RESCHEDULED')`, [date, cat.host_key]))
      .filter((b) => b.id !== excludeId)
      .map((b) => [toMin(b.start_time), toMin(b.end_time || fromMin(toMin(b.start_time) + 30))]);

    const len = cat.session_minutes, step = len + r.buffer;
    const out = [];
    for (let s = toMin(r.start); s + len <= toMin(r.end); s += step) {
      const e = s + len;
      const t = fromMin(s);
      const startsAt = new Date(`${date}T${t}:00`);
      const tooSoon = startsAt.getTime() < now.getTime() + r.minNoticeHours * 3600000;
      const clash = busy.some(([bs, be]) => s < be + r.buffer && e + r.buffer > bs);
      out.push({ time: t, end: fromMin(e), label: `${label12(t)} – ${label12(fromMin(e))}`, available: !tooSoon && !clash });
    }
    return { closed: null, slots: out };
  }

  // ── Public: config / availability ─────────────────────────
  router.get('/booking/config', async (req, res) => {
    try {
      const r = await rules();
      const cats = await q("SELECT slug, name, tagline, icon, session_minutes, host_name, allow_booking FROM service_categories WHERE status = 'ACTIVE' AND allow_booking = 1 ORDER BY sort_order, name");
      const svcs = await q("SELECT s.slug, s.name, c.slug AS category_slug FROM services s JOIN service_categories c ON c.id = s.category_id WHERE s.status = 'ACTIVE' AND c.status = 'ACTIVE' ORDER BY s.sort_order, s.name");
      res.json({ categories: cats, services: svcs, modes: MODES.map((m) => ({ value: m, label: MODE_LABEL[m] })), days: r.days, start: r.start, end: r.end, maxDaysAhead: r.maxDaysAhead, minNoticeHours: r.minNoticeHours, inPersonLocation: r.inPerson, note: r.note, autoConfirm: r.autoConfirm });
    } catch (e) { console.error(e); res.status(500).json({ error: 'Database error' }); }
  });

  router.get('/booking/availability', async (req, res) => {
    try {
      const { category: slug, date } = req.query;
      if (!isDate(String(date || ''))) return res.status(400).json({ error: 'A valid date (YYYY-MM-DD) is required' });
      const cat = await category(slug);
      if (!cat || !cat.allow_booking) return res.status(404).json({ error: 'Unknown service category' });
      const r = await rules();
      res.json({ date, category: cat.slug, minutes: cat.session_minutes, host: cat.host_name, ...(await slotsFor(cat, date, r)) });
    } catch (e) { console.error(e); res.status(500).json({ error: 'Database error' }); }
  });

  /** Which days in a month have at least one free slot (for the calendar). */
  router.get('/booking/days', async (req, res) => {
    try {
      const { category: slug, month } = req.query; // month = YYYY-MM
      if (!/^\d{4}-\d{2}$/.test(String(month || ''))) return res.status(400).json({ error: 'month (YYYY-MM) is required' });
      const cat = await category(slug);
      if (!cat || !cat.allow_booking) return res.status(404).json({ error: 'Unknown service category' });
      const r = await rules();
      const [y, m] = month.split('-').map(Number);
      const last = new Date(y, m, 0).getDate();
      const days = {};
      for (let d = 1; d <= last; d++) {
        const date = `${month}-${pad(d)}`;
        const { slots } = await slotsFor(cat, date, r);
        days[date] = slots.filter((s) => s.available).length;
      }
      res.json({ month, days });
    } catch (e) { console.error(e); res.status(500).json({ error: 'Database error' }); }
  });

  // ── Public: create / look up / cancel ─────────────────────
  router.post('/bookings', async (req, res) => {
    try {
      const b = req.body || {};
      const name = clean(b.name, 200), email = normEmail(b.email), phone = clean(b.phone, 40);
      const date = clean(b.date, 10), time = clean(b.time, 5), mode = MODES.includes(b.mode) ? b.mode : 'ONLINE';
      if (!name || !isEmail(email)) return res.status(400).json({ error: 'Your name and a valid email are required' });
      if (!/^(?:\+254|254|0)[17]\d{8}$/.test(phone.replace(/[\s-]/g, ''))) return res.status(400).json({ error: 'Please enter a valid Kenyan phone number (e.g. 0712 345 678)' });
      if (!isDate(date) || !/^\d{2}:\d{2}$/.test(time)) return res.status(400).json({ error: 'Choose a date and time' });
      const cat = await category(b.category);
      if (!cat || !cat.allow_booking) return res.status(400).json({ error: 'Please choose a service category' });
      let svc = null;
      if (b.service) [svc] = await q('SELECT id, name FROM services WHERE slug = ? AND category_id = ?', [b.service, cat.id]);

      const r = await rules();
      const { closed, slots } = await slotsFor(cat, date, r);
      const slot = slots.find((s) => s.time === time);
      if (closed || !slot || !slot.available) return res.status(409).json({ error: 'Sorry, that time is no longer available. Please pick another slot.' });

      const id = uid(), ref = reference('BK'), now = createdAt();
      const status = r.autoConfirm ? 'CONFIRMED' : 'PENDING';
      const slotKey = `${cat.host_key}|${date}|${time}`;
      try {
        await q(`INSERT INTO bookings (id, reference, category_id, category_slug, category_name, service_id, service_name, name, email, phone, company, session_mode, booking_date, start_time, end_time, host_key, host_name, topic, status, location, slot_key, created_at, updated_at)
                 VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          [id, ref, cat.id, cat.slug, cat.name, svc && svc.id, svc && svc.name, name, email, phone, clean(b.company, 200), mode, date, time, slot.end, cat.host_key, cat.host_name,
           clean(b.topic, 3000), status, mode === 'IN_PERSON' ? r.inPerson : '', slotKey, now, now]);
      } catch (e) {
        if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Sorry, that time was just taken. Please pick another slot.' });
        throw e;
      }

      let meetLink = '';
      if (status === 'CONFIRMED' && mode === 'ONLINE') {
        meetLink = (await google.createMeetLink({ summary: `${cat.name} session – ${name}`, date, start: time, end: slot.end, attendeeEmail: email })) || '';
        if (meetLink) await q('UPDATE bookings SET meeting_link = ? WHERE id = ?', [meetLink, id]);
      }
      if (b.subscribe) subscribe.upsert({ email, name, phone, interests: [cat.slug], source: 'booking' }).catch((e) => console.error('subscribe opt-in', e.message));

      // e-mails (don't block the response)
      const booking = { id, reference: ref, name, email, phone, company: clean(b.company, 200), category_name: cat.name, service_name: svc && svc.name, mode, date, start: time, end: slot.end, topic: clean(b.topic, 3000), status, meeting_link: meetLink, host_name: cat.host_name, location: mode === 'IN_PERSON' ? r.inPerson : '' };
      sendClientMail(booking, status === 'CONFIRMED' ? 'confirmed' : 'received').catch(() => {});
      sendAdminMail(booking).catch(() => {});

      res.status(201).json({ message: status === 'CONFIRMED' ? 'Booking confirmed' : 'Booking request received', reference: ref, status, date, time, end: slot.end, category: cat.name, host: cat.host_name, meeting_link: meetLink });
    } catch (e) { console.error(e); res.status(500).json({ error: 'Could not save your booking. Please try again.' }); }
  });

  router.get('/bookings/lookup', async (req, res) => {
    try {
      const ref = clean(req.query.reference, 20).toUpperCase(), email = normEmail(req.query.email);
      const [b] = await q('SELECT * FROM bookings WHERE reference = ? AND LOWER(email) = ?', [ref, email]);
      if (!b) return res.status(404).json({ error: 'No booking found for that reference and email' });
      res.json(publicView(b));
    } catch (e) { res.status(500).json({ error: 'Database error' }); }
  });

  router.post('/bookings/cancel', async (req, res) => {
    try {
      const ref = clean(req.body.reference, 20).toUpperCase(), email = normEmail(req.body.email);
      const [b] = await q('SELECT * FROM bookings WHERE reference = ? AND LOWER(email) = ?', [ref, email]);
      if (!b) return res.status(404).json({ error: 'No booking found for that reference and email' });
      if (!ACTIVE.includes(b.status)) return res.status(400).json({ error: `This booking is already ${b.status.toLowerCase()}` });
      if (new Date(`${ymd(new Date(b.booking_date))}T${b.start_time}:00`).getTime() - Date.now() < 2 * 3600000) return res.status(400).json({ error: 'Sessions starting within 2 hours can only be cancelled by phone or e-mail' });
      await q("UPDATE bookings SET status = 'CANCELLED', slot_key = NULL, updated_at = ? WHERE id = ?", [createdAt(), b.id]);
      const v = toMail({ ...b, status: 'CANCELLED' });
      sendClientMail(v, 'cancelled').catch(() => {});
      sendAdminMail(v, 'Booking cancelled by client').catch(() => {});
      res.json({ message: 'Your booking has been cancelled' });
    } catch (e) { console.error(e); res.status(500).json({ error: 'Database error' }); }
  });

  const publicView = (b) => ({ reference: b.reference, status: b.status, category: b.category_name, service: b.service_name, date: ymd(new Date(b.booking_date)), time: b.start_time, end: b.end_time, mode: b.session_mode, host: b.host_name, meeting_link: b.status === 'CONFIRMED' ? b.meeting_link : '' });

  // ── Admin ─────────────────────────────────────────────────
  router.get('/bookings', admin, async (req, res) => {
    try {
      const { status, category: cat, from, to, q: term, limit = 500 } = req.query;
      let sql = 'SELECT * FROM bookings WHERE 1=1'; const p = [];
      if (status) { sql += ' AND status = ?'; p.push(status); }
      if (cat) { sql += ' AND category_slug = ?'; p.push(cat); }
      if (from && isDate(from)) { sql += ' AND booking_date >= ?'; p.push(from); }
      if (to && isDate(to)) { sql += ' AND booking_date <= ?'; p.push(to); }
      if (term) { sql += ' AND (name LIKE ? OR email LIKE ? OR reference LIKE ? OR phone LIKE ? OR company LIKE ?)'; const l = `%${term}%`; p.push(l, l, l, l, l); }
      sql += ' ORDER BY booking_date DESC, start_time DESC LIMIT ?'; p.push(Math.min(2000, parseInt(limit, 10) || 500));
      const rows = (await q(sql, p)).map((b) => ({ ...b, booking_date: ymd(new Date(b.booking_date)) }));
      res.json(rows);
    } catch (e) { console.error(e); res.status(500).json({ error: 'Database error' }); }
  });

  router.get('/bookings/stats', admin, async (req, res) => {
    try {
      const byStatus = await q('SELECT status, COUNT(*) AS n FROM bookings GROUP BY status');
      const byCategory = await q('SELECT category_name AS name, category_slug AS slug, COUNT(*) AS n FROM bookings GROUP BY category_name, category_slug ORDER BY n DESC');
      const today = ymd();
      const upcoming = await q("SELECT COUNT(*) AS n FROM bookings WHERE booking_date >= ? AND status IN ('PENDING','CONFIRMED','RESCHEDULED')", [today]);
      res.json({ byStatus, byCategory, upcoming: upcoming[0].n });
    } catch (e) { res.status(500).json({ error: 'Database error' }); }
  });

  router.get('/bookings/:id', admin, async (req, res) => {
    try {
      const [b] = await q('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
      if (!b) return res.status(404).json({ error: 'Booking not found' });
      res.json({ ...b, booking_date: ymd(new Date(b.booking_date)) });
    } catch (e) { res.status(500).json({ error: 'Database error' }); }
  });

  router.put('/bookings/:id', admin, async (req, res) => {
    try {
      const [old] = await q('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
      if (!old) return res.status(404).json({ error: 'Booking not found' });
      const b = req.body || {};
      const status = b.status && STATUSES.includes(b.status) ? b.status : old.status;
      const date = b.booking_date ? clean(b.booking_date, 10) : ymd(new Date(old.booking_date));
      const time = b.start_time ? clean(b.start_time, 5) : old.start_time;
      const mode = MODES.includes(b.session_mode) ? b.session_mode : old.session_mode;
      if (!isDate(date) || !/^\d{2}:\d{2}$/.test(time)) return res.status(400).json({ error: 'Invalid date or time' });
      const [cat] = await q('SELECT * FROM service_categories WHERE id = ?', [old.category_id]);
      const len = cat ? cat.session_minutes : (toMin(old.end_time || '00:30') - toMin(old.start_time));
      const end = fromMin(toMin(time) + (len || 30));
      const oldDate = ymd(new Date(old.booking_date));
      const moved = date !== oldDate || time !== old.start_time;
      const activeNow = ACTIVE.includes(status);
      let slotKey = activeNow ? `${old.host_key}|${date}|${time}` : null;

      if (activeNow && moved) {
        const clash = await q(`SELECT id FROM bookings WHERE booking_date = ? AND host_key = ? AND id <> ? AND status IN ('PENDING','CONFIRMED','RESCHEDULED') AND start_time < ? AND end_time > ?`, [date, old.host_key, old.id, end, time]);
        if (clash.length && b.force !== true) return res.status(409).json({ error: 'That time overlaps another booking for the same host.' });
        if (clash.length) slotKey = `${old.host_key}|${date}|${time}|F${Date.now() % 100000}`;
      }
      const newStatus = moved && ['PENDING', 'CONFIRMED'].includes(status) && b.status === undefined ? 'RESCHEDULED' : status;

      let link = b.meeting_link !== undefined ? clean(b.meeting_link, 500) : old.meeting_link;
      if (!link && mode === 'ONLINE' && ['CONFIRMED', 'RESCHEDULED'].includes(newStatus) && b.auto_link !== false) {
        link = (await google.createMeetLink({ summary: `${old.category_name} session – ${old.name}`, date, start: time, end, attendeeEmail: old.email })) || '';
      }
      await q(`UPDATE bookings SET status=?, booking_date=?, start_time=?, end_time=?, session_mode=?, meeting_link=?, location=?, admin_notes=?, slot_key=?, updated_at=? WHERE id=?`,
        [newStatus, date, time, end, mode, link || null, b.location !== undefined ? clean(b.location, 250) : old.location, b.admin_notes !== undefined ? clean(b.admin_notes, 4000) : old.admin_notes, slotKey, createdAt(), old.id]);

      if (b.notify !== false) {
        const m = toMail({ ...old, status: newStatus, booking_date: date, start_time: time, end_time: end, session_mode: mode, meeting_link: link, location: b.location !== undefined ? b.location : old.location });
        if (moved && activeNow) sendClientMail(m, 'rescheduled').catch(() => {});
        else if (newStatus !== old.status && newStatus === 'CONFIRMED') sendClientMail(m, 'confirmed').catch(() => {});
        else if (newStatus !== old.status && newStatus === 'CANCELLED') sendClientMail(m, 'cancelled').catch(() => {});
        else if (newStatus !== old.status && newStatus === 'COMPLETED') sendClientMail(m, 'completed').catch(() => {});
      }
      res.json({ message: 'Booking updated', status: newStatus, meeting_link: link || '' });
    } catch (e) {
      if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'That exact time is already booked.' });
      console.error(e); res.status(500).json({ error: 'Database error' });
    }
  });

  router.post('/bookings/:id/reminder', admin, async (req, res) => {
    try {
      const [b] = await q('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
      if (!b) return res.status(404).json({ error: 'Booking not found' });
      const r = await sendClientMail(toMail(b), 'reminder');
      await q('UPDATE bookings SET reminder_sent = 1 WHERE id = ?', [b.id]);
      res.json({ message: r && r.skipped ? 'Reminder logged (SMTP not configured)' : 'Reminder sent' });
    } catch (e) { res.status(500).json({ error: 'Could not send reminder' }); }
  });

  router.post('/bookings/:id/meet-link', admin, async (req, res) => {
    try {
      const [b] = await q('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
      if (!b) return res.status(404).json({ error: 'Booking not found' });
      const link = await google.createMeetLink({ summary: `${b.category_name} session – ${b.name}`, date: ymd(new Date(b.booking_date)), start: b.start_time, end: b.end_time || fromMin(toMin(b.start_time) + 30), attendeeEmail: b.email });
      if (!link) return res.status(503).json({ error: 'Google Meet is not connected. Authorise it in Settings, or paste a meeting link manually.' });
      await q('UPDATE bookings SET meeting_link = ?, updated_at = ? WHERE id = ?', [link, createdAt(), b.id]);
      res.json({ meeting_link: link });
    } catch (e) { res.status(500).json({ error: 'Could not create a meeting link' }); }
  });

  router.delete('/bookings/:id', admin, async (req, res) => {
    try { await q('DELETE FROM bookings WHERE id = ?', [req.params.id]); res.json({ message: 'Booking deleted' }); }
    catch (e) { res.status(500).json({ error: 'Database error' }); }
  });

  // ── E-mail ────────────────────────────────────────────────
  function toMail(b) {
    return { id: b.id, reference: b.reference, name: b.name, email: b.email, phone: b.phone, company: b.company, category_name: b.category_name, service_name: b.service_name, mode: b.session_mode,
      date: typeof b.booking_date === 'string' ? b.booking_date.slice(0, 10) : ymd(new Date(b.booking_date)), start: b.start_time, end: b.end_time, topic: b.topic, status: b.status, meeting_link: b.meeting_link, host_name: b.host_name, location: b.location };
  }

  async function sendClientMail(b, kind) {
    const co = await mailer.company();
    const first = b.name.split(/\s+/)[0];
    const rows = [
      ['Reference', b.reference], ['Service', b.service_name ? `${b.category_name} – ${b.service_name}` : b.category_name],
      ['Date', niceDate(b.date)], ['Time', `${label12(b.start)}${b.end ? ' – ' + label12(b.end) : ''} (EAT)`],
      ['Format', MODE_LABEL[b.mode] || b.mode], ['With', b.host_name],
      ['Location', b.mode === 'IN_PERSON' ? b.location : ''], ['Topic', b.topic],
    ];
    const joinBtn = b.meeting_link && b.mode === 'ONLINE' ? { cta: 'Join the meeting', ctaUrl: b.meeting_link } : { cta: 'Manage my booking', ctaUrl: `/booking-status.html?ref=${encodeURIComponent(b.reference)}` };
    const copy = {
      received:    { subject: `Booking request received — ${b.reference}`, kicker: 'Request received', title: 'We have your booking request', hero: null, intro: `<p>Hi ${first},</p><p>Thank you for booking a <strong>${b.category_name}</strong> session. We will confirm it shortly and send the meeting details.</p>`, outro: `<p>Need to change something? Reply to this email or call <strong>${co.phone}</strong> / <strong>${co.phone2}</strong>.</p>` },
      confirmed:   { subject: `Session confirmed — ${niceDate(b.date)} ${label12(b.start)}`, kicker: 'Booking confirmed', title: 'Your session is confirmed', hero: '#2f9e44', intro: `<p>Hi ${first},</p><p>Your session is confirmed. Details are below.</p>`, outro: `<p>Please come prepared with any questions, documents or links you would like to go through. Need to reschedule? Reply to this email or call <strong>${co.phone}</strong>.</p>` },
      rescheduled: { subject: `Session rescheduled — ${niceDate(b.date)} ${label12(b.start)}`, kicker: 'Rescheduled', title: 'Your session has a new time', hero: '#c87d00', intro: `<p>Hi ${first},</p><p>Your session has been moved. Please note the updated details.</p>`, outro: '<p>If this time does not work, just reply and we will find another.</p>' },
      reminder:    { subject: `Reminder: your session on ${niceDate(b.date)}`, kicker: 'Reminder', title: 'Your session is coming up', hero: null, intro: `<p>Hi ${first},</p><p>A friendly reminder of your upcoming session.</p>`, outro: '<p>Please make sure you have a stable connection and any materials ready.</p>' },
      cancelled:   { subject: `Booking cancelled — ${b.reference}`, kicker: 'Cancelled', title: 'Your booking was cancelled', hero: '#7a7874', intro: `<p>Hi ${first},</p><p>Your booking <strong>${b.reference}</strong> has been cancelled.</p>`, outro: '<p>You are welcome to book another time whenever you are ready.</p>', cta: 'Book again', ctaUrl: '/book.html' },
      completed:   { subject: `Thank you — ${b.category_name} session`, kicker: 'Thank you', title: 'Thanks for meeting with us', hero: null, intro: `<p>Hi ${first},</p><p>Thank you for your time. If you would like us to go further, you can send a project brief any time.</p>`, outro: '', cta: 'Submit a project proposal', ctaUrl: '/proposal.html' },
    }[kind];
    const html = await mailer.renderNotice({ kicker: copy.kicker, title: copy.title, intro: copy.intro, rows: kind === 'cancelled' || kind === 'completed' ? rows.slice(0, 4) : rows, outro: copy.outro, cta: copy.cta || joinBtn.cta, ctaUrl: copy.ctaUrl || joinBtn.ctaUrl, heroColor: copy.hero || undefined });
    return mailer.send({ to: b.email, subject: copy.subject, html });
  }

  async function sendAdminMail(b, headline) {
    const co = await mailer.company();
    const html = await mailer.renderNotice({
      kicker: 'New booking', title: headline || `${b.category_name}: ${b.name}`, signature: false,
      intro: `<p>A client has booked a session${b.status === 'CONFIRMED' ? ' (auto-confirmed)' : ' — it is waiting for your confirmation'}.</p>`,
      rows: [['Reference', b.reference], ['Client', `${b.name}${b.company ? ' · ' + b.company : ''}`], ['Email', b.email], ['Phone', b.phone], ['Service', b.service_name ? `${b.category_name} – ${b.service_name}` : b.category_name],
        ['When', `${niceDate(b.date)}, ${label12(b.start)} EAT`], ['Format', MODE_LABEL[b.mode]], ['With', b.host_name], ['Topic', b.topic]],
      cta: 'Open in admin panel', ctaUrl: '/admin.html',
    });
    return mailer.send({ to: co.adminEmail, subject: `📅 ${headline || 'New booking'} — ${b.category_name} · ${b.name}`, html, replyTo: b.email });
  }

  return router;
};
