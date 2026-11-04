'use strict';
/**
 * Start-up migration: creates missing tables (database/schema.sql), upgrades legacy
 * columns, seeds defaults on first run and upgrades plain-text passwords to scrypt hashes.
 * Safe to run on every start.
 */
const fs = require('fs');
const path = require('path');
const { uid, createdAt, slugify } = require('./util');
const { hashPassword, isHashed } = require('./auth');

module.exports = async function migrate({ db, settings, log = console.log }) {
  const q = (sql, params = []) => new Promise((res, rej) => db.query(sql, params, (e, r) => (e ? rej(e) : res(r))));
  const quiet = async (sql, params) => { try { return await q(sql, params); } catch (e) { return null; } };

  // 1 ─ Tables ────────────────────────────────────────────────
  const schema = fs.readFileSync(path.join(__dirname, '..', 'database', 'schema.sql'), 'utf8')
    .split('\n').filter((l) => !/^\s*--/.test(l)).join('\n');
  for (const stmt of schema.split(/;\s*\n/)) {
    const s = stmt.trim();
    if (s) await q(s);
  }

  // 2 ─ Legacy column upgrades (older installs) ───────────────
  const hasCol = async (table, col) => (await q(
    'SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?', [table, col])).length > 0;
  const addCol = async (table, col, def) => { if (!(await hasCol(table, col))) await q(`ALTER TABLE \`${table}\` ADD COLUMN \`${col}\` ${def}`); };
  const colType = async (table, col) => {
    const r = await q('SELECT DATA_TYPE AS t FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?', [table, col]);
    return r.length ? String(r[0].t || r[0].DATA_TYPE).toLowerCase() : null;
  };
  await addCol('contact_messages', 'subject', 'VARCHAR(250) DEFAULT NULL');
  await addCol('contact_messages', 'phone', 'VARCHAR(30) DEFAULT NULL');
  await addCol('blog_posts', 'slug', 'VARCHAR(400) DEFAULT NULL');
  await addCol('blog_posts', 'cover_image', 'VARCHAR(500) DEFAULT NULL');
  await addCol('blog_posts', 'view_count', 'INT DEFAULT 0');
  for (const [t, c, def] of [['users', 'role', "VARCHAR(30) NOT NULL DEFAULT 'GEN_USER'"], ['projects', 'type', "VARCHAR(60) DEFAULT 'Website'"]]) {
    if ((await colType(t, c)) === 'enum') await quiet(`ALTER TABLE \`${t}\` MODIFY COLUMN \`${c}\` ${def}`);
  }

  // 3 ─ Passwords: hash anything still stored in plain text ───
  const users = await q('SELECT id, password FROM users');
  for (const u of users) {
    if (!isHashed(u.password)) await q('UPDATE users SET password = ? WHERE id = ?', [hashPassword(u.password), u.id]);
  }
  if (!users.length) {
    const email = (process.env.ADMIN_DEFAULT_EMAIL || 'admin@adconnect.co.ke').toLowerCase();
    const pw = process.env.ADMIN_DEFAULT_PASSWORD;
    if (!pw || /ChangeMe/i.test(pw)) {
      log('⚠️  No admin user exists and ADMIN_DEFAULT_PASSWORD is not set (or is still the example value). Set it in .env and restart to create the first SUPER_ADMIN.');
    } else {
      await q('INSERT INTO users (id, name, email, password, role, access_level, created_at) VALUES (?,?,?,?,?,?,?)',
        [uid(), 'Super Admin', email, hashPassword(pw), 'SUPER_ADMIN', 'CRUD', createdAt()]);
      log(`✅ Created first SUPER_ADMIN account: ${email}`);
    }
  }

  // 4 ─ Default settings (INSERT IGNORE → never overwrites admin edits) ─
  const ins = async (section, obj) => {
    for (const [k, v] of Object.entries(obj)) {
      await q('INSERT IGNORE INTO site_settings (section, setting_key, setting_value, updated_at) VALUES (?,?,?,NOW())', [section, k, v]);
    }
  };
  await ins('global', {
    site_name: process.env.COMPANY_NAME || 'AdConnect',
    contact_email: process.env.COMPANY_EMAIL || 'info@adconnect.co.ke',
    admin_email: process.env.ADMIN_EMAIL || process.env.COMPANY_EMAIL || 'info@adconnect.co.ke',
    phone: '+254 790 064 130', phone_label: 'Misgina Fitwi · Marketing',
    phone_secondary: '+254 799 292 048', phone_secondary_label: 'Michael Maina · Software & Data',
    whatsapp: '254790064130', whatsapp_secondary: '254799292048',
    address: process.env.COMPANY_LOCATION || 'Nairobi, Kenya', city: 'Nairobi', country: 'Kenya',
    timezone: 'Africa/Nairobi', email_from_name: process.env.EMAIL_FROM_NAME || 'AdConnect Team',
    facebook_url: process.env.FACEBOOK_URL || '', instagram_url: process.env.INSTAGRAM_URL || '',
    tiktok_url: process.env.TIKTOK_URL || '', youtube_url: process.env.YOUTUBE_URL || '',
    twitter_url: process.env.TWITTER_URL || '', linkedin_url: '',
    auto_signout_minutes: '30',
  });
  // Michael Maina's number must always be present for the public contact details
  await ins('booking', {
    days: '1,2,3,4,5,6', start: '09:00', end: '17:00', min_notice_hours: '12', max_days_ahead: '60',
    blocked_dates: '', buffer_minutes: '0', online_provider_note: 'A meeting link is e-mailed to you once the session is confirmed.',
    in_person_location: 'Nairobi, Kenya (exact venue confirmed by e-mail)',
  });
  await ins('campaign', { enabled: 'true', respect_interests: 'false', min_gap_days: '1', batch_size: '25' });

  await ins('homepage', {
    hero_eyebrow: 'Digital Marketing · Web · Software · Data',
    hero_headline: "Grow Your Business with <span class='accent'>Marketing</span>, <span class='accent-g'>Software</span> &amp; Data",
    hero_subheadline: 'From ad campaigns and websites to custom software, databases and analytics — one Nairobi team that helps you attract customers and run smarter.',
    hero_cta_primary: 'Book a Free Session', hero_cta_secondary: 'Send Us Your Project',
    stat_clients: '50+', stat_roi: '200%',
    result_1: '200%', result_1_label: 'Average ROI Increase', result_2: '50+', result_2_label: 'Clients Served',
    result_3: '60%', result_3_label: 'Average Ad Cost Reduction', result_4: '4+', result_4_label: 'Years of Expertise',
    video_headline: '5 Proven Strategies to Get More Leads and Customers Online',
    video_subheadline: 'Discover how to reduce your ad spend and attract higher-quality customers in this exclusive 5-minute video.',
  });
  // Refresh untouched real-estate-only copy from the previous version
  const refresh = [
    ['hero_eyebrow', "Kenya's #1 Real Estate Marketing Agency", 'Digital Marketing · Web · Software · Data'],
    ['result_2_label', 'Real Estate Clients Served', 'Clients Served'],
    ['video_headline', '5 Proven Strategies to Generate More Real Estate Leads', '5 Proven Strategies to Get More Leads and Customers Online'],
  ];
  for (const [k, oldV, newV] of refresh) await q("UPDATE site_settings SET setting_value = ? WHERE section = 'homepage' AND setting_key = ? AND setting_value = ?", [newV, k, oldV]);
  await q("UPDATE site_settings SET setting_value = ?, updated_at = NOW() WHERE section = 'homepage' AND setting_key = 'hero_headline' AND setting_value LIKE ?",
    ["Grow Your Business with <span class='accent'>Marketing</span>, <span class='accent-g'>Software</span> &amp; Data", '%Real Estate</span> Businesses with%']);
  await q("UPDATE site_settings SET setting_value = 'Boost your lead generation, reduce ad costs and grow your business with tailored digital strategies.' WHERE section = 'homepage' AND setting_key = 'hero_subheadline' AND setting_value LIKE 'Boost your lead generation, reduce ad costs, and grow your real estate%'");

  // 5 ─ Service catalogue ─────────────────────────────────────
  const [{ n: catCount }] = await q('SELECT COUNT(*) AS n FROM service_categories');
  if (!catCount) {
    const catalogue = require('../database/seed/catalogue');
    const now = createdAt();
    let ci = 0;
    for (const c of catalogue) {
      const cid = uid();
      await q(`INSERT INTO service_categories (id, slug, name, tagline, description, icon, sort_order, status, allow_booking, allow_proposal, session_minutes, host_key, host_name, created_at, updated_at)
               VALUES (?,?,?,?,?,?,?, 'ACTIVE', 1, 1, ?,?,?,?,?)`,
        [cid, c.slug, c.name, c.tagline, c.description, c.icon, ++ci, c.session_minutes, c.host_key, c.host_name, now, now]);
      let si = 0;
      for (const s of c.services) {
        await q(`INSERT INTO services (id, category_id, slug, name, summary, description, features, icon, starting_price, delivery_time, sort_order, featured, status, created_at, updated_at)
                 VALUES (?,?,?,?,?,?,?,?,?,?,?,?, 'ACTIVE', ?,?)`,
          [uid(), cid, s.slug, s.name, s.summary, s.description || s.summary, JSON.stringify(s.features || []), s.icon || 'fa-check', '', '', ++si, si <= 2 ? 1 : 0, now, now]);
      }
    }
    log(`✅ Seeded ${catalogue.length} service categories`);
  }

  // 6 ─ Campaign steps (welcome + 50 follow-ups) ──────────────
  const [{ n: stepCount }] = await q('SELECT COUNT(*) AS n FROM email_campaign_steps');
  if (!stepCount) {
    const steps = require('../database/seed/emails');
    const now = createdAt();
    for (const e of steps) {
      await q(`INSERT INTO email_campaign_steps (id, step, day_offset, category, subject, preheader, kicker, title, body_html, cta_text, cta_url, status, created_at, updated_at)
               VALUES (?,?,?,?,?,?,?,?,?,?,?, 'ACTIVE', ?,?)`,
        [uid(), e.step, e.day, e.category, e.subject, e.preheader || '', e.kicker || '', e.title, e.body_html, e.cta_text || '', e.cta_url || '', now, now]);
    }
    log(`✅ Seeded ${steps.length} campaign e-mails`);
  }

  // 7 ─ Other defaults (only on an empty table) ───────────────
  const [{ n: tplCount }] = await q('SELECT COUNT(*) AS n FROM email_templates');
  if (!tplCount) {
    const wrap = (inner) => `<body style="font-family:Arial,sans-serif;color:#fff;padding:20px"><div style="max-width:600px;margin:0 auto;padding:20px;background:linear-gradient(to right,#4d4c4b,#646464);border-radius:10px;">${inner}<p>Warm regards,<br/>Misgina Fitwi &amp; Michael Maina<br/><a href="https://adconnect.co.ke" style="color:#4abc4f;text-decoration:none;">AdConnect Team</a><br/>Phone: 0790 064 130 · 0799 292 048</p></div></body>`;
    const tpls = [
      ['1ST CONTACT', 'Welcome to AdConnect — digital marketing, software & data for your business', wrap('<p>Hello <strong>${clientName}</strong>,</p><p>Welcome to <a href="https://adconnect.co.ke" style="color:#4abc4f;font-weight:bold;text-decoration:none;">AdConnect</a>! We help businesses grow with digital marketing, websites, custom software, databases and data analysis.</p><p><a href="https://adconnect.co.ke/book.html" style="display:inline-block;padding:8px 30px;background-color:#f65730;color:white;font-weight:bold;border-radius:15px;text-decoration:none;">Book a Free Session</a></p>')],
      ['2ND CONTACT', 'Following up — how can we help your business?', wrap('<p>Hello <strong>${clientName}</strong>,</p><p>We wanted to check in. Have you had a chance to think about what you need — marketing, a website, software, a database or a data analysis? We can talk it through in a free session.</p><p><a href="https://adconnect.co.ke/book.html" style="display:inline-block;padding:8px 30px;background-color:#f65730;color:white;font-weight:bold;border-radius:15px;text-decoration:none;">Book a Session</a></p>')],
      ['3RD CONTACT', 'Have a project in mind? Send us your proposal', wrap('<p>Hello <strong>${clientName}</strong>,</p><p>If you already have a project brief, upload it and we will review it and reply with a clear scope and quote.</p><p><a href="https://adconnect.co.ke/proposal.html" style="display:inline-block;padding:8px 30px;background-color:#f65730;color:white;font-weight:bold;border-radius:15px;text-decoration:none;">Submit Your Proposal</a></p>')],
    ];
    for (const [s, subj, body] of tpls) await q('INSERT INTO email_templates (status, subject, body) VALUES (?,?,?)', [s, subj, body]);
  }
  const [{ n: faqCount }] = await q('SELECT COUNT(*) AS n FROM faqs');
  if (!faqCount) {
    const now = createdAt();
    const faqs = [
      ['What services does AdConnect offer?', 'Digital marketing, web development, software development, software design (UI/UX and architecture), database management, consulting, data analytics & statistics, and training. See the Services page for the full list.', 'General', 1, 1],
      ['How do I book a session?', 'Open the Book a Session page, choose the service category, pick a date and time, and tell us what you want to discuss. You will receive a confirmation e-mail with a reference number.', 'Booking', 2, 1],
      ['Can I upload a project proposal or brief?', 'Yes. Use the Submit Proposal page to describe your project and attach your document (PDF, Word, PowerPoint, Excel, images or a ZIP file). We review every proposal and reply by e-mail.', 'Proposals', 3, 1],
      ['What does a project cost?', 'It depends on scope. After a short session or a proposal review we send a clear written quote. There is no charge for the first discovery session.', 'Pricing', 4, 0],
      ['How long does it take to see results from ads?', 'Most campaigns show measurable results within 2–4 weeks; the first week is used for audience learning and optimisation.', 'Digital Marketing', 5, 0],
      ['Do you work with clients outside Nairobi?', 'Yes. We work with clients across Kenya, East Africa and beyond — sessions can be held online.', 'General', 6, 0],
      ['How do I unsubscribe from your e-mails?', 'Every e-mail has an unsubscribe link at the bottom. You can also use the Unsubscribe page and enter your e-mail address.', 'Subscriptions', 7, 0],
    ];
    for (const [qn, an, cat, ord, feat] of faqs) await q("INSERT INTO faqs (id, question, answer, category, status, sort_order, featured, created_at, updated_at) VALUES (?,?,?,?, 'PUBLISHED', ?,?,?,?)", [uid(), qn, an, cat, ord, feat, now, now]);
  }

  // 8 ─ One-off data moves from older versions ────────────────
  // newsletter → subscribers
  const legacyNews = await quiet('SELECT email, created_at FROM newsletter');
  if (legacyNews && legacyNews.length) {
    for (const r of legacyNews) {
      await quiet(`INSERT IGNORE INTO subscribers (id, email, status, source, current_step, next_send_at, subscribed_at, created_at, updated_at)
                   VALUES (?,?, 'SUBSCRIBED', 'import', -1, NOW(), ?, NOW(), NOW())`, [uid(), String(r.email).toLowerCase(), r.created_at || createdAt()]);
    }
  }
  // legacy appointments → bookings
  const legacyAppts = await quiet('SELECT * FROM appointments');
  if (legacyAppts && legacyAppts.length) {
    const [cat] = await q("SELECT id, name, host_key, host_name FROM service_categories WHERE slug = 'digital-marketing'");
    for (const a of legacyAppts) {
      const m = /(\d{1,2})[.:](\d{2})\s*(AM|PM)/i.exec(a.appointmentTime || '');
      let start = '09:00';
      if (m) { let h = parseInt(m[1], 10) % 12; if (/pm/i.test(m[3])) h += 12; start = `${String(h).padStart(2, '0')}:${m[2]}`; }
      const d = /^\d{4}-\d{2}-\d{2}/.test(a.appointmentDate || '') ? String(a.appointmentDate).slice(0, 10) : null;
      if (!d) continue;
      const st = { DONE: 'COMPLETED', PENDING: 'CONFIRMED', CANCELLED: 'CANCELLED' }[String(a.appointmentStatus || '').toUpperCase()] || 'CONFIRMED';
      await quiet(`INSERT IGNORE INTO bookings (id, reference, category_id, category_slug, category_name, name, email, phone, session_mode, booking_date, start_time, host_key, host_name, topic, status, meeting_link, location, slot_key, created_at, updated_at)
                   VALUES (?,?,?,?,?,?,?,?, 'ONLINE', ?,?,?,?,?,?,?,?, NULL, ?, NOW())`,
        [uid(), `LEG-${a.clientId}`.slice(0, 20), cat && cat.id, 'digital-marketing', cat && cat.name, a.name || 'Client', a.email || '', a.phone || '', d, start, cat && cat.host_key, cat && cat.host_name, a.appointmentNotes || '', st, a.meetingLink || '', a.location || '', a.created_at || createdAt()]);
    }
  }
  log('✅ Database ready');
};
