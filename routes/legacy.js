'use strict';
/**
 * Content routes carried over from the original AdConnect (FAQs, media, analytics, leads,
 * blog, portfolio, video, about, marketing strategy, testimonials, careers).
 * Mounted at /api by server.js; access control is enforced by the guard in server.js.
 */
const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const ExcelJS = require('exceljs');
const { uid, createdAt, tryParseJSON } = require('../lib/util');

module.exports = function ({ db, mailer, subscribers }) {
  const router = express.Router();
  const dbp = db.promise();
  const ROOT = path.join(__dirname, '..');
  const clientID = uid;
  const COMPANY = { get BASE() { return process.env.APP_BASE_URL || ''; } };
  const BASE_URL = (process.env.APP_BASE_URL || '').replace(/\/$/, '');
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.EMAIL_USER || 'info@adconnect.co.ke';
  // Compatibility wrapper: old code called nodemailer's sendMail()
  const sendMail = async (o) => { const r = await mailer.send({ to: o.to, subject: o.subject, html: o.html, replyTo: o.replyTo }); if (!r.ok && !r.skipped) throw new Error(r.error); return r; };
// Multer Configuration for File Upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, `${clientID()}${path.extname(file.originalname)}`),
});
// Serve static files from the "uploads" directory
// Ensure the uploads directory exists
const uploadsDir = path.join(ROOT, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// ─── Storage for media uploads ──────────────────────────────
const mediaStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(ROOT, 'uploads', 'media');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g,'_');
    cb(null, `${clientID()}_${safe}`);
  },
});
const mediaUpload = multer({
  storage: mediaStorage,
  limits:  { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/image\/(jpeg|png|webp|svg\+xml|gif)/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files accepted'));
  },
});
router.get('/faqs', (req, res) => {
  const { status, category, featured } = req.query;
  let sql = 'SELECT * FROM faqs WHERE 1=1';
  const params = [];
  if (status)   { sql += ' AND status = ?';   params.push(status); }
  if (category) { sql += ' AND category = ?'; params.push(category); }
  if (featured) { sql += ' AND featured = ?'; params.push(featured === 'true' ? 1 : 0); }
  sql += ' ORDER BY sort_order ASC, created_at ASC';
  db.query(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.status(200).json(rows);
  });
});
 
router.get('/faqs/:id', (req, res) => {
  db.query('SELECT * FROM faqs WHERE id = ?', [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!rows.length) return res.status(404).json({ error: 'FAQ not found' });
    res.status(200).json(rows[0]);
  });
});
 
router.post('/faqs', (req, res) => {
  const { question, answer, category, status, sort_order, featured } = req.body;
  if (!question || !answer) return res.status(400).json({ error: 'question and answer are required' });
  db.query(
    `INSERT INTO faqs (id, question, answer, category, status, sort_order, featured, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [clientID(), question, answer, category||null, status||'PUBLISHED',
     sort_order||0, featured?1:0, createdAt(), createdAt()],
    (err) => {
      if (err) { console.error(err); return res.status(500).json({ error: 'Database error' }); }
      res.status(201).json({ message: 'FAQ created successfully' });
    }
  );
});
 
router.put('/faqs/:id', (req, res) => {
  const { question, answer, category, status, sort_order, featured } = req.body;
  db.query(
    `UPDATE faqs SET question=?, answer=?, category=?, status=?, sort_order=?, featured=?, updated_at=? WHERE id=?`,
    [question, answer, category||null, status||'PUBLISHED', sort_order||0, featured?1:0, createdAt(), req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.status(200).json({ message: 'FAQ updated' });
    }
  );
});
 
router.put('/faqs/:id/status', (req, res) => {
  const { status } = req.body;
  if (!['PUBLISHED','DRAFT'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
  db.query('UPDATE faqs SET status=?, updated_at=? WHERE id=?', [status, createdAt(), req.params.id], (err) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.status(200).json({ message: 'Status updated' });
  });
});
 
router.delete('/faqs/:id', (req, res) => {
  db.query('DELETE FROM faqs WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.status(200).json({ message: 'FAQ deleted' });
  });
});
 
// Public FAQ submission (from website contact form)
router.post('/faq-submission', (req, res) => {
  const { name, email, question } = req.body;
  if (!question) return res.status(400).json({ error: 'Question is required' });
  db.query(
    `INSERT INTO faq_submissions (id, name, email, question, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [clientID(), name||'Anonymous', email||null, question, createdAt()],
    (err) => {
      if (err) { console.error(err); return res.status(500).json({ error: 'Database error' }); }
      res.status(201).json({ message: 'Question submitted. We\'ll add it to our FAQs!' });
    }
  );
});
 
router.get('/faq-submissions', (req, res) => {
  db.query('SELECT * FROM faq_submissions ORDER BY created_at DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.status(200).json(rows);
  });
});
 
 
// ══════════════════════════════════════════════════════════════
// MEDIA LIBRARY ENDPOINTS
// ══════════════════════════════════════════════════════════════
 
router.get('/media', (req, res) => {
  const { type, q, page = 1, limit = 40 } = req.query;
  const offset = (parseInt(page)-1) * parseInt(limit);
  let sql = 'SELECT * FROM media_library WHERE 1=1';
  const params = [];
  if (type) { sql += ' AND type = ?'; params.push(type); }
  if (q)    { sql += ' AND (filename LIKE ? OR alt LIKE ? OR tags LIKE ?)'; params.push(`%${q}%`,`%${q}%`,`%${q}%`); }
 
  db.query(`SELECT COUNT(*) as total FROM (${sql}) t`, params, (err, countRows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    const total      = countRows[0]?.total || 0;
    const totalPages = Math.ceil(total / parseInt(limit));
 
    db.query(`${sql} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...params, parseInt(limit), offset], (err2, rows) => {
      if (err2) return res.status(500).json({ error: 'Database error' });
      const base = `/api/media/files/`;
      const items = rows.map(r => ({
        ...r,
        url:  r.filename ? `${base}${r.filename}` : null,
        tags: tryParseJSON(r.tags, []),
      }));
      res.status(200).json({ items, total, totalPages, page: parseInt(page) });
    });
  });
});
 
router.post('/media', mediaUpload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Image file is required' });
  const { type, alt, tags } = req.body;
  const tagsJSON = JSON.stringify(
    (tags || '').split(',').map(t => t.trim()).filter(Boolean)
  );
 
  let width = null, height = null;
 
  db.query(
    `INSERT INTO media_library (id, filename, original_name, type, alt, tags, size, width, height, mime_type, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [clientID(), req.file.filename, req.file.originalname, type||'general',
     alt||req.file.originalname, tagsJSON, req.file.size, width, height, req.file.mimetype, createdAt()],
    (err) => {
      if (err) { console.error(err); return res.status(500).json({ error: 'Upload failed' }); }
      const url = `/api/media/files/${req.file.filename}`;
      res.status(201).json({ message: 'Uploaded', url, filename: req.file.filename });
    }
  );
});
 
router.put('/media/:id', (req, res) => {
  const { alt, tags } = req.body;
  const tagsJSON = JSON.stringify(Array.isArray(tags) ? tags : (tags||'').split(',').map(t=>t.trim()).filter(Boolean));
  db.query('UPDATE media_library SET alt=?, tags=? WHERE id=?', [alt, tagsJSON, req.params.id], (err) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.status(200).json({ message: 'Updated' });
  });
});
 
router.delete('/media/:id', (req, res) => {
  db.query('SELECT filename FROM media_library WHERE id=?', [req.params.id], (err, rows) => {
    if (err || !rows.length) return res.status(404).json({ error: 'Not found' });
    const filePath = path.join(ROOT, 'uploads', 'media', rows[0].filename);
    if (fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch { /* ignore */ }
    }
    db.query('DELETE FROM media_library WHERE id=?', [req.params.id], (err2) => {
      if (err2) return res.status(500).json({ error: 'Database error' });
      res.status(200).json({ message: 'Deleted' });
    });
  });
});
 
 
// ══════════════════════════════════════════════════════════════
// ANALYTICS ENDPOINTS
// ══════════════════════════════════════════════════════════════
 
// Record a visit (called from client JS after cookie consent)
router.post('/analytics/record-visit', (req, res) => {
  const ip       = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
                 || req.connection?.remoteAddress
                 || 'unknown';
  const { page, referrer } = req.body;
  const today    = new Date().toISOString().slice(0, 10);
 
  // Upsert daily aggregation
  db.query(
    `INSERT INTO site_analytics (date, page, ip_hash, referrer, visits, created_at)
     VALUES (?, ?, SHA2(?, 256), ?, 1, ?)
     ON DUPLICATE KEY UPDATE visits = visits + 1, updated_at = ?`,
    [today, page||'/', ip, referrer||'direct', createdAt(), createdAt()],
    (err) => {
      if (err) console.error('Analytics insert error:', err);
    }
  );
  res.status(200).json({ ok: true });
});
 
// Analytics summary — unique IPs per day + aggregated stats
router.get('/analytics/unique-ips', (req, res) => {
  const { days = 14 } = req.query;
 
  const queries = {
    total:   'SELECT SUM(visits) as total FROM site_analytics',
    today:   'SELECT SUM(visits) as count FROM site_analytics WHERE date = CURDATE()',
    week:    'SELECT SUM(visits) as count FROM site_analytics WHERE date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)',
    uniqAll: 'SELECT COUNT(DISTINCT ip_hash) as count FROM site_analytics',
    daily:   `SELECT date, SUM(visits) as visits, COUNT(DISTINCT ip_hash) as unique_ips
              FROM site_analytics
              WHERE date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
              GROUP BY date ORDER BY date ASC`,
    refs:    `SELECT referrer, COUNT(*) as count FROM site_analytics
              WHERE referrer IS NOT NULL AND referrer != 'direct'
              GROUP BY referrer ORDER BY count DESC LIMIT 10`,
  };
 
  db.query(queries.total, (e1, r1) => {
  db.query(queries.today, (e2, r2) => {
  db.query(queries.week,  (e3, r3) => {
  db.query(queries.uniqAll,(e4,r4) => {
  db.query(queries.daily, [parseInt(days)], (e5, r5) => {
  db.query(queries.refs,  (e6, r6) => {
    if (e1||e2||e3||e4||e5||e6) return res.status(500).json({ error: 'Database error' });
    res.status(200).json({
      totalVisits: r1[0]?.total   || 0,
      todayVisits: r2[0]?.count   || 0,
      weekVisits:  r3[0]?.count   || 0,
      uniqueIPs:   r4[0]?.count   || 0,
      dailyVisits: r5 || [],
      referrers:   r6 || [],
    });
  }); }); }); }); }); });
});
 
 
router.post('/analytics/track', async (req, res) => {
  const { page_name, page_path, session_id, referrer,
          utm_source, utm_medium, utm_campaign } = req.body;
          console.log("BODY:", req.body);
  if (!page_name) return res.status(400).json({ error: 'page_name required' });

  try {
    await dbp.execute(
      `INSERT INTO page_views
        (page_name, page_path, session_id, ip_address, user_agent, referrer,
         utm_source, utm_medium, utm_campaign)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [page_name, page_path||'', session_id||null, req.ip,
       req.headers['user-agent']||'', referrer||'',
       utm_source||null, utm_medium||null, utm_campaign||null]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'DB error' });
  }
});

// GET /api/analytics/track - Retrieve analytics data
router.get('/analytics/track', async (req, res) => {
  const { 
    limit = 100,
    offset = 0,
    page_name,
    session_id,
    start_date,
    end_date,
    utm_source
  } = req.query;

  try {
    let query = `SELECT * FROM page_views WHERE 1=1`;
    const params = [];

    // Apply filters
    if (page_name) {
      query += ` AND page_name = ?`;
      params.push(page_name);
    }

    if (session_id) {
      query += ` AND session_id = ?`;
      params.push(session_id);
    }

    if (utm_source) {
      query += ` AND utm_source = ?`;
      params.push(utm_source);
    }

    if (start_date) {
      query += ` AND created_at >= ?`;
      params.push(start_date);
    }

    if (end_date) {
      query += ` AND created_at <= ?`;
      params.push(end_date);
    }

    // Add pagination
    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const [rows] = await dbp.execute(query, params);

    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) as total FROM page_views WHERE 1=1`;
    const countParams = [];
    
    if (page_name) {
      countQuery += ` AND page_name = ?`;
      countParams.push(page_name);
    }
    if (session_id) {
      countQuery += ` AND session_id = ?`;
      countParams.push(session_id);
    }
    if (utm_source) {
      countQuery += ` AND utm_source = ?`;
      countParams.push(utm_source);
    }
    if (start_date) {
      countQuery += ` AND created_at >= ?`;
      countParams.push(start_date);
    }
    if (end_date) {
      countQuery += ` AND created_at <= ?`;
      countParams.push(end_date);
    }

    const [countResult] = await dbp.execute(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      success: true,
      data: rows,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        total_pages: Math.ceil(total / limit)
      }
    });

  } catch (err) {
    console.error('DB error:', err);
    res.status(500).json({ error: 'DB error' });
  }
});

// Format timestamp for EAT
/**
 * Function for getting the current date & time
 * @returns dat-time (yyyyMMddHHmmss)
 *
 */

// Create a new client (lead)
// Endpoint to add a new client
router.post('/clients', (req, res) => {
    console.log(req.body); // Log the request body for debugging
    const {clientName, clientEmail, clientPhone, clientCompany, clientLocation, clientStreet, clientProvince, clientZipCode, clientSource, clientStatus, clientSubScription } = req.body;

    // Check if any of the variables are null
    if (!clientName || !clientEmail || !clientPhone || !clientCompany || !clientLocation || !clientStreet || !clientProvince || !clientZipCode || !clientSource || !clientStatus || !clientSubScription) {
        return res.status(400).json({ error: 'All fields are required and cannot be null' });
    }

    // Insert the new client into the database
    const insertQuery = `
        INSERT INTO clients (clientID, clientName, clientEmail, clientPhone, clientCity, clientCompany, clientStreet, clientProvince, clientZip, clientSource, clientStatus, clientSubScription, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(insertQuery, [clientID(), clientName, clientEmail, clientPhone, clientCompany, clientLocation, clientStreet, clientProvince, clientZipCode, clientSource, clientStatus, clientSubScription, createdAt()], (err) => {
        if (err) {
            console.error('Database Error:', err);
            return res.status(500).json({ error: 'Failed to Create Lead' });
        }

        // Respond with success
        res.status(201).json({
            message: 'Lead created successfully',
            lead: {
                clientID,
                clientName,
                clientEmail,
                clientPhone,
                clientCompany,
                clientLocation,
                clientStreet,
                clientProvince,
                clientZipCode,
                clientSource,
                clientStatus,
                clientSubScription,
                createdAt
            },
        });
        // Enqueue the email sequence for the new client
        subscribers.upsert({ email: clientEmail, name: clientName, phone: clientPhone, source: 'lead-form' }).catch((e) => console.error('lead->subscriber', e.message));
    });
});
// ═══════════════════ BLOG POSTS ═════════════════════════════

// Get all blog posts (with optional status filter)
router.get('/blog-posts', (req, res) => {
    const { status } = req.query;
    const query = status
        ? 'SELECT * FROM blog_posts WHERE status = ? ORDER BY created_at DESC'
        : 'SELECT * FROM blog_posts ORDER BY created_at DESC';
    const params = status ? [status] : [];

    db.query(query, params, (err, posts) => {
        if (err) {
            console.error('Error fetching blog posts:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.status(200).json(posts);
    });
});

// Get single blog post by ID
router.get('/blog-posts/:id', (req, res) => {
    const { id } = req.params;
    db.query('SELECT * FROM blog_posts WHERE id = ?', [id], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!rows.length) return res.status(404).json({ error: 'Post not found' });
        res.status(200).json(rows[0]);
    });
});

// Create blog post
router.post('/blog-posts', (req, res) => {
    const { title, category, status, excerpt, content, author } = req.body;

    if (!title || !excerpt || !content) {
        return res.status(400).json({ error: 'Title, excerpt, and content are required' });
    }

    const query = `
        INSERT INTO blog_posts (id, title, category, status, excerpt, content, author, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const now = createdAt();
    db.query(query, [clientID(), title, category || 'General', status || 'DRAFT', excerpt, content, author, now, now], (err, result) => {
        if (err) {
            console.error('Error creating blog post:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.status(201).json({ message: 'Blog post created successfully' });
    });
});

// Update blog post
router.put('/blog-posts/:id', (req, res) => {
    const { id }  = req.params;
    const { title, category, status, excerpt, content } = req.body;
    const query = `
        UPDATE blog_posts SET title=?, category=?, status=?, excerpt=?, content=?, updated_at=?
        WHERE id=?
    `;
    db.query(query, [title, category, status, excerpt, content, createdAt(), id], (err) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.status(200).json({ message: 'Post updated successfully' });
    });
});

// Delete blog post
router.delete('/blog-posts/:id', (req, res) => {
    db.query('DELETE FROM blog_posts WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.status(200).json({ message: 'Post deleted' });
    });
});

// ═══════════════════ PORTFOLIO PROJECTS ══════════════════════

// Get all projects (with optional status filter)
router.get('/projects', (req, res) => {
    const { status } = req.query;
    const query  = status
        ? 'SELECT * FROM projects WHERE status = ? ORDER BY created_at DESC'
        : 'SELECT * FROM projects ORDER BY created_at DESC';
    const params = status ? [status] : [];

    db.query(query, params, (err, projects) => {
        if (err) return res.status(500).json({ error: 'Database error' });

        // Parse tags JSON
        const result = projects.map(p => ({
            ...p,
            tags: tryParseJSON(p.tags, []),
        }));
        res.status(200).json(result);
    });
});

// Get single project
router.get('/projects/:id', (req, res) => {
    db.query('SELECT * FROM projects WHERE id = ?', [req.params.id], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!rows.length) return res.status(404).json({ error: 'Project not found' });
        const p = rows[0];
        res.status(200).json({ ...p, tags: tryParseJSON(p.tags, []) });
    });
});

// Create project (with optional thumbnail upload)
const projectUpload = multer({ storage });

router.post('/projects', projectUpload.single('thumbnail'), (req, res) => {
    const { name, type, description, tags, url, status } = req.body;

    if (!name || !description) {
        return res.status(400).json({ error: 'Name and description are required' });
    }

    const thumbnail = req.file ? req.file.path : null;
    const tagsJSON  = JSON.stringify(
        Array.isArray(tags) ? tags : (tags || '').split(',').map(t => t.trim()).filter(Boolean)
    );
    const now = createdAt();

    const query = `
        INSERT INTO projects (id, name, type, description, tags, url, thumbnail, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    db.query(query, [clientID(), name, type || 'Website', description, tagsJSON, url || null, thumbnail, status || 'ACTIVE', now, now], (err) => {
        if (err) {
            console.error('Error creating project:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.status(201).json({ message: 'Project added successfully' });
    });
});

// Update project
router.put('/projects/:id', (req, res) => {
    const { id }   = req.params;
    const { name, type, description, tags, url, status } = req.body;
    const tagsJSON = JSON.stringify(
        Array.isArray(tags) ? tags : (tags || '').split(',').map(t => t.trim()).filter(Boolean)
    );
    const query = `
        UPDATE projects SET name=?, type=?, description=?, tags=?, url=?, status=?, updated_at=?
        WHERE id=?
    `;
    db.query(query, [name, type, description, tagsJSON, url, status, createdAt(), id], (err) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.status(200).json({ message: 'Project updated' });
    });
});

// Delete project
router.delete('/projects/:id', (req, res) => {
    db.query('DELETE FROM projects WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.status(200).json({ message: 'Project deleted' });
    });
});

// Endpoint to generate and download Excel
router.post("/download/excel", async (req, res) => {
    try {
        const leads = req.body.leads;
        console.log("Received leads:", leads); // Log the received data

        if (!leads || !Array.isArray(leads)) {
            return res.status(400).send("Invalid leads data");
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Leads");

        // Set Title
        const titleRow = worksheet.addRow(["LEADS DATA"]);
        titleRow.font = { size: 12, bold: true , color: { argb: "FFFFFFFF" },};
        titleRow.alignment = { vertical: "middle", horizontal: "left" };

        //worksheet.addRow([]); // Empty row for spacing

        // Define Columns & Style Header
        worksheet.columns = [
            { header: "LEAD ID", key: "clientID", width: 15 },
            { header: "NAME", key: "clientName", width: 25 },
            { header: "EMAIL", key: "clientEmail", width: 30 },
            { header: "PHONE", key: "clientPhone", width: 12 },
            { header: "SOURCE", key: "clientSource", width: 10 },
            { header: "STATUS", key: "clientStatus", width: 15 },
            { header: "DATE CREATED", key: "created_at", width: 25 },
        ];

        // Style headers (bold + background color)
        const headerRow = worksheet.getRow(1); // Header is at row 3
        headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
        headerRow.alignment = { horizontal: "left", vertical: "middle" };
        headerRow.eachCell((cell) => {
            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "F65730" }, // Background color
            };
        });

        // Add Rows (Data)
        leads.forEach((lead) => worksheet.addRow(lead));

        // Write to buffer
        const buffer = await workbook.xlsx.writeBuffer();

        // Send response
        res.setHeader(
            "Content-Disposition",
            `attachment; filename=${clientID()}_leads.xlsx`
        );
        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.send(buffer);
    } catch (error) {
        console.error("Error generating Excel file:", error);
        res.status(500).send("Error generating Excel file");
    }
});

// Endpoint to check if a client (lead) already exists
router.post('/lead-exists', (req, res) => {
    console.log(req.body); // Debugging request body
    const { clientEmail, clientPhone } = req.body;

    // Validate request
    if (!clientEmail || !clientPhone) {
        return res.status(400).json({ error: 'Email and phone are required' });
    }

    // Check if the client already exists
    const checkQuery = `
        SELECT * FROM clients
        WHERE clientEmail = ? OR clientPhone = ?
    `;

    db.query(checkQuery, [clientEmail, clientPhone], (err, existingClient) => {
        if (err) {
            console.error('Database Error:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (existingClient.length > 0) {
            const errorMessage = existingClient[0].clientEmail === clientEmail
                ? 'Email already exists'
                : 'Phone number already exists';

            return res.status(200).json({
                exists: true,
                message: errorMessage,
            });
        }

        // If no client found, return a success response indicating non-existence
        res.status(200).json({ exists: false, message: "Client does not exist" });
    });
});

// Endpoint to get all clients (leads)
router.get('/clients', (req, res) => {
    const query = 'SELECT * FROM clients';

    db.query(query, (err, clients) => {
        if (err) {
            console.error('Database Error:', err);
            return res.status(500).json({ error: 'An error occurred while fetching the clients' });
        }

        res.status(200).json(clients);
    });
});

// Endpoint to get a single client (lead) by ID
router.get('/clients/:id', (req, res) => {
    const clientId = req.params.id;
    const query = 'SELECT * FROM clients WHERE id = ?';

    db.query(query, [clientId], (err, clients) => {
        if (err) {
            console.error('Database Error:', err);
            return res.status(500).json({ error: 'An error occurred while fetching the client' });
        }

        if (clients.length === 0) {
            return res.status(404).json({ error: 'Client not found' });
        }

        res.status(200).json(clients[0]);
    });
});

/// Update a lead by ID
router.put('/clients/:id', (req, res) => {
    const { id } = req.params;
    const { clientEmail, clientPhone, clientName, company, ...otherFields } = req.body;

    // SQL query to check if the client exists
    const checkQuery = 'SELECT * FROM clients WHERE id = ?';

    db.query(checkQuery, [id], (err, existingClient) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Database error');
        }

        // If client does not exist, return 404
        if (existingClient.length === 0) {
            return res.status(404).json({ error: 'Lead not found' });
        }

        // Prepare update query and values
        const updateQuery = `
            UPDATE clients
            SET clientEmail = ?, clientPhone = ?, clientName = ?, company = ?, updated_at = CURRENT_TIMESTAMP
                ${Object.keys(otherFields).length > 0 ? `, ${Object.keys(otherFields).map(field => `${field} = ?`).join(', ')}` : ''}
            WHERE id = ?
        `;
        const updateValues = [clientEmail, clientPhone, clientName, company, ...Object.values(otherFields), id];

        // Execute the update query
        db.query(updateQuery, updateValues, (updateErr) => {
            if (updateErr) {
                console.error(updateErr);
                return res.status(500).send('Database error');
            }

            // Respond with the updated client data
            res.status(200).json({
                message: 'Lead updated successfully',
                client: { id, clientEmail, clientPhone, clientName, company, ...otherFields }
            });
        });
    });
});


// Delete a lead by ID
router.delete('/clients/:id', (req, res) => {
    const { id } = req.params;

    // SQL query to check if the client exists
    const checkQuery = 'SELECT * FROM clients WHERE clientID = ?';

    db.query(checkQuery, [id], (err, existingClient) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Database error');
        }

        // If client does not exist, return 404
        if (existingClient.length === 0) {
            return res.status(404).json({ error: 'Lead not found' });
        }

        // SQL query to delete the client
        const deleteQuery = 'DELETE FROM clients WHERE clientID = ?';

        db.query(deleteQuery, [id], (deleteErr) => {
            if (deleteErr) {
                console.error(deleteErr);
                return res.status(500).send('Database error');
            }

            // Respond with a success message
            res.status(200).send('Lead deleted successfully');
        });
    });
});



router.get('/video-data-active', (req, res) => {
    // SQL query to fetch all about data
    const query = 'SELECT * FROM video WHERE status = \'ACTIVE\'';
    console.log('Executing video-data');
    // Execute the query
    db.query(query, (error, result) => {
        if (error) {
            console.error('Error fetching video data:', error);
            return res.status(500).json({error: 'An error occurred while fetching about data'});
        }

        const serverUrl = `${req.protocol}://${req.get('host')}`;

        // Modify the response to include full image URLs
        result = result.map(item => ({
            ...item,
            video: item.video ? `/api/uploads/${path.basename(item.video)}` : null
        }));
        console.log(result);
        // Respond with the list of about data
        res.status(200).json(result);
    });
});

// Get all Video Data
router.get('/video-data', (req, res) => {
    // SQL query to fetch all about data
    const query = 'SELECT * FROM video';
    console.log('Executing video-data');
    // Execute the query
    db.query(query, (error, result) => {
        if (error) {
            console.error('Error fetching video data:', error);
            return res.status(500).json({error: 'An error occurred while fetching about data'});
        }

        const serverUrl = `${req.protocol}://${req.get('host')}`;

        // Modify the response to include full image URLs
        result = result.map(item => ({
            ...item,
            video: item.video ? `/api/uploads/${path.basename(item.video)}` : null
        }));
        console.log(result);
        // Respond with the list of about data
        res.status(200).json(result);
    });
});

const upload = multer({ storage: storage });

// Upload Video
router.post('/video-data', upload.single('video'), (req, res) => {
    console.log("Request Body:", JSON.stringify(req.body, null, 2));
    console.log("Uploaded File Data:", JSON.stringify(req.file, null, 2));

    const { title, created_by, status } = req.body;

    // Validate input data (including the file)
    if (!title || !created_by ||!status || !req.file) {
        return res.status(400).json({ error: 'All fields are required, including the icon file.' });
    }

    const filePath = req.file ? req.file.path : null;
    if (!filePath) {
        return res.status(400).json({ error: 'File upload failed.' });
    }

    // Check if the title already exists in the database
    const query1 = 'SELECT * FROM video WHERE title = ?';
    db.query(query1, [title], (error, result) => {
        if (error) {
            console.error('Database Error:', error);
            return res.status(500).json({ error: 'Database query failed' });
        }

        if (result.length > 0) {
            return res.status(409).json({ error: 'Title Already Exists!' }); // 409 Conflict
        }

        // SQL query to insert the new about data into the database
        const query = `
            INSERT INTO video (id, title, created_by, video, status, created_on)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        // Generate the correct URL for the image
        const serverUrl = `${req.protocol}://${req.get('host')}`;
        const imageUrl = `${serverUrl}api/uploads/${req.file.filename}`;

        db.query(query, [clientID(),title, created_by, filePath, status,createdAt()], (error, result) => {
            if (error) {
                console.error('Database Error:', error);
                return res.status(500).json({ error: 'An error occurred while creating the about info' });
            }

            res.status(201).json({
                message: 'Video Uploaded successfully',
                about: {
                    id: result.insertId,
                    title,
                    created_by,
                    createdAt,
                    status,
                    video: imageUrl //Returns the correct video URL
                }
            });
        });
    });
});

// Update Video Status By ID
router.put('/video-data-update-status/:id', (req, res) => {
    const { id } = req.params;
    const {title,
        created_by,
        video,
        status,
        created_on } = req.body;
    console.log(req.body);

    // Check if required fields are present
    if (!status || !created_by) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const query1 = 'SELECT * FROM video WHERE id = ?';
    // Check if the data exists
    db.query(query1, [id], (err, results) => {
        if (err) {
            console.error('Error querying database:', err);
            return res.status(500).json({ error: 'Database query error' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Data not found' });
        }

        //update all status
        const updateQuery = 'UPDATE video SET status = \'INACTIVE\'';
        db.query(updateQuery, (err, results) => {
            if (err) {
                console.error('Error updating database:', err);
                return res.status(500).json({ error: 'Database query error' });
            }
            console.log('Updated all status');

            // Update query
            const query = `
                UPDATE video
                SET status = ?, created_on = ?
                WHERE id = ?
            `;

            db.query(query, [status, createdAt(), id], (err, updateResults) => {
                if (err) {
                    console.error('Error updating info:', err);
                    return res.status(500).json({ error: 'Error updating the about info' });
                }

                if (updateResults.affectedRows === 0) {
                    return res.status(400).json({ error: 'No changes detected' });
                }

                // Respond with success message
                res.status(200).json({
                    message: 'Data updated successfully',
                    about: {
                        id,
                        status,
                        createdAt
                    }
                });
            });
        });
    });
});

// Delete an Video Data by ID
router.delete('/video-data/:id', (req, res) => {
    try {
        const id = req.params.id;
        console.log('Deleting user with ID:', id);

        // Check if the info exists
        db.query('SELECT * FROM video WHERE id = ?', [id], (err, results) => {
            if (err) {
                console.error('Error querying database:', err);
                return res.status(500).json({ error: 'Database query error' });
            }

            if (results.length === 0) {
                return res.status(404).json({ error: 'Info not found' });
            }

            // SQL query to delete the info
            const query = 'DELETE FROM video WHERE id = ?';
            console.log('SQL Query:', query, 'Params:', [id]);

            db.query(query, [id], (err, deleteResults) => {
                if (err) {
                    console.error('Error deleting info:', err);
                    return res.status(500).json({ error: 'Error deleting the About Info' });
                }

                // Respond with a success message
                res.status(200).json({ message: 'Info deleted successfully' });
            });
        });
    } catch (error) {
        // Handle errors
        console.error('Unexpected error:', error);
        res.status(500).json({ error: 'An unexpected error occurred' });
    }
});

// Get all About Data - Active
router.get('/about-data-active', (req, res) => {
    // SQL query to fetch all about data
    const query = 'SELECT * FROM about where status = "ACTIVE"';
    console.log('Executing about-data');
    // Execute the query
    db.query(query, (error, about) => {
        if (error) {
            console.error('Error fetching about data:', error);
            return res.status(500).json({error: 'An error occurred while fetching about data'});
        }

        const serverUrl = `${req.protocol}://${req.get('host')}`;
        // Modify the response to include full image URLs
        about = about.map(item => ({
            ...item,
            icon: item.icon ? `/api/uploads/${path.basename(item.icon)}` : null
        }));
        console.log(about);
        // Respond with the list of about data
        res.status(200).json(about);
    });
});

// Get all About Data
router.get('/about-data', (req, res) => {
    // SQL query to fetch all about data
    const query = 'SELECT * FROM about';
    console.log('Executing about-data');
    // Execute the query
    db.query(query, (error, about) => {
        if (error) {
            console.error('Error fetching about data:', error);
            return res.status(500).json({error: 'An error occurred while fetching about data'});
        }

        const serverUrl = `${req.protocol}://${req.get('host')}`;
        // Modify the response to include full image URLs
        about = about.map(item => ({
            ...item,
            icon: item.icon ? `/api/uploads/${path.basename(item.icon)}` : null
        }));
        console.log(about);
        // Respond with the list of about data
        res.status(200).json(about);
    });
});

router.post('/about-data', upload.single('icon'), (req, res) => {
    console.log("Request Body:", JSON.stringify(req.body, null, 2));
    console.log("Uploaded File Data:", JSON.stringify(req.file, null, 2));

    const { title, introduction, experience, mission, status } = req.body;

    // Validate input data (including the file)
    if (!title || !introduction || !experience || !mission || !status || !req.file) {
        return res.status(400).json({ error: 'All fields are required, including the icon file.' });
    }

    const filePath = req.file ? req.file.path : null;
    if (!filePath) {
        return res.status(400).json({ error: 'File upload failed.' });
    }

    // Check if the title already exists in the database
    const query1 = 'SELECT * FROM about WHERE title = ?';
    db.query(query1, [title], (error, result) => {
        if (error) {
            console.error('Database Error:', error);
            return res.status(500).json({ error: 'Database query failed' });
        }

        if (result.length > 0) {
            return res.status(409).json({ error: 'Title Already Exists!' }); // 409 Conflict
        }

        // Define createdAt timestamp
        const createdAt = new Date();

        // SQL query to insert the new about data into the database
        const query = `
            INSERT INTO about (id, title, introduction, experience, mission, status, icon, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        // Generate the correct URL for the image
        const serverUrl = `${req.protocol}://${req.get('host')}`;
        const imageUrl = `/api/uploads/${req.file.filename}`;

        db.query(query, [clientID(),title, introduction, experience, mission, status, filePath, createdAt], (error, result) => {
            if (error) {
                console.error('Database Error:', error);
                return res.status(500).json({ error: 'An error occurred while creating the about info' });
            }

            res.status(201).json({
                message: 'About data created successfully',
                about: {
                    id: result.insertId,
                    title,
                    introduction,
                    experience,
                    mission,
                    status,
                    icon: imageUrl //Returns the correct image URL
                }
            });
        });
    });
});


// Update about by ID
router.put('/about-data/:id', (req, res) => {
    const {id, title, introduction, experience, mission, status, icon } = req.body;
    console.log(req.body);

    // Check if required fields are present
    if (!title || !introduction || !experience || !mission || !status) {
        return res.status(400).json({ error: 'All fields except icon are required' });
    }

    // Check if the data exists
    db.query('SELECT * FROM about WHERE id = ?', [id], (err, results) => {
        if (err) {
            console.error('Error querying database:', err);
            return res.status(500).json({ error: 'Database query error' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Data not found' });
        }

        // Update query
        const query = `
            UPDATE about
            SET title = ?, introduction = ?, experience = ?, mission = ?, status = ?, icon = ?, updated_at = ?
            WHERE id = ?
        `;

        db.query(query, [title, introduction, experience, mission, status, icon || results[0].icon, createdAt(), id], (err, updateResults) => {
            if (err) {
                console.error('Error updating info:', err);
                return res.status(500).json({ error: 'Error updating the about info' });
            }

            if (updateResults.affectedRows === 0) {
                return res.status(400).json({ error: 'No changes detected' });
            }

            // Respond with success message
            res.status(200).json({
                message: 'Data updated successfully',
                about: {
                    id,
                    title,
                    introduction,
                    experience,
                    mission,
                    status,
                    icon: icon || results[0].icon, // Keep old icon if not provided
                    createdAt
                }
            });
        });
    });
});

// Update about by ID
router.put('/about-data-update-status/:id', (req, res) => {
    const {id, title, introduction, experience, mission, status, icon } = req.body;
    console.log(req.body);

    // Check if required fields are present
    if (!title || !introduction || !experience || !mission || !status) {
        return res.status(400).json({ error: 'All fields except icon are required' });
    }

    // Check if the data exists
    db.query('SELECT * FROM about WHERE id = ?', [id], (err, results) => {
        if (err) {
            console.error('Error querying database:', err);
            return res.status(500).json({ error: 'Database query error' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Data not found' });
        }

        //update all status
        const updateQuery = 'UPDATE about SET status = \'INACTIVE\'';
        db.query(updateQuery, (err, results) => {
            if (err) {
                console.error('Error updating database:', err);
                return res.status(500).json({ error: 'Database query error' });
            }
            console.log('Updated all status');

            // Update query
            const query = `
                UPDATE about
                SET title = ?, introduction = ?, experience = ?, mission = ?, status = ?, icon = ?, updated_at = ?
                WHERE id = ?
            `;

            db.query(query, [title, introduction, experience, mission, status, icon || results[0].icon, createdAt(), id], (err, updateResults) => {
                if (err) {
                    console.error('Error updating info:', err);
                    return res.status(500).json({ error: 'Error updating the about info' });
                }

                if (updateResults.affectedRows === 0) {
                    return res.status(400).json({ error: 'No changes detected' });
                }

                // Respond with success message
                res.status(200).json({
                    message: 'Data updated successfully',
                    about: {
                        id,
                        title,
                        introduction,
                        experience,
                        mission,
                        status,
                        icon: icon || results[0].icon, // Keep old icon if not provided
                        createdAt
                    }
                });
            });
        });
    });
});

// Delete an About Data by ID
router.delete('/about-data/:id', (req, res) => {
    try {
        const id = req.params.id;
        console.log('Deleting user with ID:', id);

        // Check if the info exists
        db.query('SELECT * FROM about WHERE id = ?', [id], (err, results) => {
            if (err) {
                console.error('Error querying database:', err);
                return res.status(500).json({ error: 'Database query error' });
            }

            if (results.length === 0) {
                return res.status(404).json({ error: 'Info not found' });
            }

            // SQL query to delete the info
            const query = 'DELETE FROM about WHERE id = ?';
            console.log('SQL Query:', query, 'Params:', [id]);

            db.query(query, [id], (err, deleteResults) => {
                if (err) {
                    console.error('Error deleting info:', err);
                    return res.status(500).json({ error: 'Error deleting the About Info' });
                }

                // Respond with a success message
                res.status(200).json({ message: 'Info deleted successfully' });
            });
        });
    } catch (error) {
        // Handle errors
        console.error('Unexpected error:', error);
        res.status(500).json({ error: 'An unexpected error occurred' });
    }
});

// Create a new marketing strategy application
router.post('/marketing-strategy-applications', (req, res) => {
    console.log(req.body);

    // Extract the necessary fields from the request body
    const { applicationDate, applicantFName, applicantLName, email, phone, occupation, marketTriggers, strategyGoal, strategyInvestment, status } = req.body;

    // SQL query to insert a new application
    const insertQuery = `
        INSERT INTO marketing_strategy (applicationDate, applicantFName, applicantLName, email, phone, occupation, marketTriggers, strategyGoal, strategyInvestment, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // Execute the query to insert the new application into the database
    db.query(insertQuery, [clientID(), applicantFName, applicantLName, email, phone, occupation, marketTriggers, strategyGoal, strategyInvestment, status, createdAt()], (err, result) => {
        if (err) {
            console.error('Backend Error: ', err);
            return res.status(400).json({ error: err.message });
        }

        // Respond with a success message and the inserted application data
        res.status(201).json({
            message: 'Application submitted successfully',
            application: {
                id: result.insertId, applicantFName, applicantLName, email, phone, occupation, marketTriggers, strategyGoal, strategyInvestment, status
            }
        });
    });
});

// Get all marketing strategy applications
router.get('/marketing-strategy-applications', (req, res) => {
    console.log('Getting all applications');

    // SQL query to get all applications from the database
    const selectQuery = 'SELECT * FROM marketing_strategy';

    // Execute the query to fetch the applications
    db.query(selectQuery, (err, applications) => {
        if (err) {
            console.error('Backend Error: ', err);
            return res.status(500).json({ error: err.message });
        }

        // Respond with a success message and the list of applications
        res.status(200).json({
            message: 'Application(s) retrieved successfully',
            applications
        });
    });
});

// Get a single marketing strategy application by ID
router.get('/marketing-strategy-applications/:id', (req, res) => {
    const applicationId = req.params.id;

    // SQL query to fetch the application by ID
    const selectQuery = 'SELECT * FROM marketing_strategy WHERE applicationDate = ?';

    // Execute the query to get the application
    db.query(selectQuery, [applicationId], (err, application) => {
        if (err) {
            console.error('Backend Error: ', err);
            return res.status(500).json({ error: err.message });
        }

        // If no application found, return a 404 error
        if (application.length === 0) {
            return res.status(404).json({ error: 'Application not found' });
        }

        // Respond with the application data
        res.status(200).json(application[0]);
    });
});



// Update a marketing strategy application by ID
router.put('/marketing-strategy-applications/:id', (req, res) => {
    const applicationId = req.params.id;
    const { status } = req.body;
    console.log(status);
    // SQL query to check if the application exists
    const checkQuery = 'SELECT * FROM marketing_strategy WHERE applicationDate = ?';
    db.query(checkQuery, [applicationId], (err, existingApplication) => {
        if (err) {
            console.error('Backend Error: ', err);
            return res.status(500).json({ error: err.message });
        }

        // If the application does not exist, return 404
        if (existingApplication.length === 0) {
            return res.status(404).json({ error: 'Application not found' });
        }

        // SQL query to update the application
        const updateQuery = `
            UPDATE marketing_strategy
            SET status = ?
            WHERE applicationDate = ?
        `;

        // Execute the query to update the application
        db.query(updateQuery, [status, applicationId], (err) => {
            if (err) {
                console.error('Backend Error: ', err);
                return res.status(500).json({ error: err.message });
            }

            // Respond with a success message and the updated application data
            res.status(200).json({
                message: 'Application updated successfully',
                application: {
                    applicationId,
                    status
                }
            });
        });
    });
});

// Delete an Application Data by ID
router.delete('/marketing-strategy-applications/:id', (req, res) => {
    try {
        const id = req.params.id;
        console.log('Deleting application with ID:', id);

        // Check if the info exists
        db.query('SELECT * FROM marketing_strategy WHERE applicationDate = ?', [id], (err, results) => {
            if (err) {
                console.error('Error querying database:', err);
                return res.status(500).json({ error: 'Database query error' });
            }

            if (results.length === 0) {
                return res.status(404).json({ error: 'Application not found' });
            }

            // SQL query to delete the info
            const query = 'DELETE FROM marketing_strategy WHERE applicationDate = ?';
            console.log('SQL Query:', query, 'Params:', [id]);

            db.query(query, [id], (err, deleteResults) => {
                if (err) {
                    console.error('Error deleting application:', err);
                    return res.status(500).json({ error: 'Error deleting the application' });
                }

                // Respond with a success message
                res.status(200).json({ message: 'Application deleted successfully' });
            });
        });
    } catch (error) {
        // Handle errors
        console.error('Unexpected error:', error);
        res.status(500).json({ error: 'An unexpected error occurred' });
    }
});

// ═══════════════ TESTIMONIALS ═══════════════════════════════

/**
 * GET /api/testimonials
 * All active testimonials
 */
router.get('/testimonials', (req, res) => {
    const { status } = req.query;
    const sql = status
        ? 'SELECT * FROM testimonials WHERE status = ? ORDER BY display_order ASC, created_at DESC'
        : 'SELECT * FROM testimonials ORDER BY display_order ASC, created_at DESC';
    const params = status ? [status] : [];

    db.query(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.status(200).json(rows);
    });
});

/**
 * GET /api/testimonials/:id
 */
router.get('/testimonials/:id', (req, res) => {
    db.query('SELECT * FROM testimonials WHERE id = ?', [req.params.id], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!rows.length) return res.status(404).json({ error: 'Not found' });
        res.status(200).json(rows[0]);
    });
});

const testimonialUpload = multer({ storage });

/**
 * POST /api/testimonials
 */
router.post('/testimonials', testimonialUpload.single('photo'), (req, res) => {
    const { name, company, text, stars, status, display_order } = req.body;
    if (!name || !text) return res.status(400).json({ error: 'Name and testimonial text are required' });

    const photo = req.file ? req.file.path : null;
    const photoUrl = photo ? `/api/uploads/${require('path').basename(photo)}` : null;
    const now = createdAt();

    db.query(
        'INSERT INTO testimonials (id, name, company, text, stars, photo, status, display_order, created_at) VALUES (?,?,?,?,?,?,?,?,?)',
        [clientID(), name, company||'', text, parseInt(stars)||5, photoUrl, status||'ACTIVE', parseInt(display_order)||0, now],
        (err) => {
            if (err) { console.error(err); return res.status(500).json({ error: 'Database error' }); }
            res.status(201).json({ message: 'Testimonial created' });
        }
    );
});

/**
 * PUT /api/testimonials/:id
 */
router.put('/testimonials/:id', (req, res) => {
    const { id } = req.params;
    const { name, company, text, stars, status, display_order } = req.body;
    db.query(
        'UPDATE testimonials SET name=?, company=?, text=?, stars=?, status=?, display_order=?, updated_at=? WHERE id=?',
        [name, company, text, parseInt(stars)||5, status, parseInt(display_order)||0, createdAt(), id],
        (err) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            res.status(200).json({ message: 'Updated' });
        }
    );
});

/**
 * DELETE /api/testimonials/:id
 */
router.delete('/testimonials/:id', (req, res) => {
    db.query('DELETE FROM testimonials WHERE id=?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.status(200).json({ message: 'Deleted' });
    });
});

// ── CV Upload storage ────────────────────────────────────────
const cvStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(ROOT, 'uploads', 'cvs');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
        cb(null, `${clientID()}_${safe}`);
    },
});
const cvUpload = multer({
    storage: cvStorage,
    limits:  { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') cb(null, true);
        else cb(new Error('Only PDF files are accepted'));
    },
});

// Serve CVs (admin only — add auth middleware in production)

// ═══════════════ JOB LISTINGS ════════════════════════════════

/** GET /api/careers  — public, returns OPEN jobs */
router.get('/careers', (req, res) => {
    const { status, department } = req.query;
    let sql    = 'SELECT * FROM career_listings WHERE 1=1';
    const params = [];

    if (status)     { sql += ' AND status = ?';     params.push(status); }
    if (department) { sql += ' AND department = ?'; params.push(department); }
    sql += ' ORDER BY pinned DESC, created_at DESC';

    db.query(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        // Parse JSON tags
        const result = rows.map(r => ({ ...r, tags: tryParseJSON(r.tags, []) }));
        res.status(200).json(result);
    });
});

/** GET /api/careers/:id */
router.get('/careers/:id', (req, res) => {
    db.query('SELECT * FROM career_listings WHERE id = ?', [req.params.id], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!rows.length) return res.status(404).json({ error: 'Job not found' });
        const r = rows[0];
        res.status(200).json({ ...r, tags: tryParseJSON(r.tags, []) });
    });
});

/** POST /api/careers  — admin creates a job */
router.post('/careers', (req, res) => {
    const { title, department, type, location, mode, salary, description,
            requirements, deadline, status, pinned, tags } = req.body;

    if (!title || !department || !description) {
        return res.status(400).json({ error: 'title, department, and description are required' });
    }
    const tagsJSON = JSON.stringify(
        Array.isArray(tags) ? tags : (tags || '').split(',').map(t => t.trim()).filter(Boolean)
    );
    const now = createdAt();
    db.query(
        `INSERT INTO career_listings
         (id, title, department, type, location, mode, salary, description, requirements, deadline, status, pinned, tags, created_at, updated_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [clientID(), title, department, type||'Full-time', location||'Nairobi', mode||'On-site',
         salary||null, description, requirements||null, deadline||null,
         status||'OPEN', pinned?1:0, tagsJSON, now, now],
        (err) => {
            if (err) { console.error(err); return res.status(500).json({ error: 'Database error' }); }
            res.status(201).json({ message: 'Job listing created' });
        }
    );
});

/** PUT /api/careers/:id  — admin updates a job */
router.put('/careers/:id', (req, res) => {
    const { id } = req.params;
    const { title, department, type, location, mode, salary, description,
            requirements, deadline, status, pinned, tags } = req.body;
    const tagsJSON = JSON.stringify(
        Array.isArray(tags) ? tags : (tags || '').split(',').map(t => t.trim()).filter(Boolean)
    );
    db.query(
        `UPDATE career_listings SET title=?,department=?,type=?,location=?,mode=?,salary=?,
         description=?,requirements=?,deadline=?,status=?,pinned=?,tags=?,updated_at=? WHERE id=?`,
        [title, department, type, location, mode, salary, description,
         requirements, deadline, status, pinned?1:0, tagsJSON, createdAt(), id],
        (err) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            res.status(200).json({ message: 'Job updated' });
        }
    );
});

/** DELETE /api/careers/:id */
router.delete('/careers/:id', (req, res) => {
    db.query('DELETE FROM career_listings WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.status(200).json({ message: 'Job deleted' });
    });
});

// ═══════════════ CAREER APPLICATIONS ════════════════════════

/** POST /api/career-applications  — public, with CV upload */
router.post('/career-applications', cvUpload.single('cv'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'CV PDF is required' });

    const { jobId, firstName, lastName, email, phone,
            currentRole, experience, motivation, portfolio } = req.body;

    if (!jobId || !firstName || !lastName || !email || !phone || !motivation) {
        return res.status(400).json({ error: 'Required fields missing' });
    }

    // Get job title for reference
    db.query('SELECT title, department FROM career_listings WHERE id = ?', [jobId], (err, jobs) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        const jobTitle  = jobs[0]?.title      || 'Unknown Role';
        const jobDept   = jobs[0]?.department || 'Unknown Dept';
        const cvPath    = req.file.filename;
        const now       = createdAt();

        db.query(
            `INSERT INTO career_applications
             (id, job_id, job_title, job_department, first_name, last_name, email, phone,
              \`current_role\`, experience, motivation, portfolio, cv_filename, status, created_at)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,'PENDING',?)`,
            [clientID(), jobId, jobTitle, jobDept, firstName, lastName, email, phone,
             currentRole||null, experience, motivation, portfolio||null, cvPath, now],
            (err2) => {
                if (err2) { console.error(err2); return res.status(500).json({ error: 'Failed to save application' }); }

                // Notify admin (fire-and-forget)
                sendApplicationNotificationEmail(firstName+' '+lastName, email, phone, jobTitle, jobDept, experience)
                    .catch(e => console.error('Notification email error:', e));

                // Auto-acknowledge applicant
                sendApplicationAcknowledgement(firstName, email, jobTitle)
                    .catch(e => console.error('Acknowledgement email error:', e));

                res.status(201).json({ message: 'Application submitted successfully' });
            }
        );
    });
});

/** GET /api/career-applications  — admin */
router.get('/career-applications', (req, res) => {
    const { status, jobId } = req.query;
    let sql = 'SELECT * FROM career_applications WHERE 1=1';
    const params = [];
    if (status) { sql += ' AND status = ?'; params.push(status); }
    if (jobId)  { sql += ' AND job_id = ?';  params.push(jobId); }
    sql += ' ORDER BY created_at DESC';

    db.query(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.status(200).json(rows);
    });
});

/** GET /api/career-applications/:id */
router.get('/career-applications/:id', (req, res) => {
    db.query('SELECT * FROM career_applications WHERE id = ?', [req.params.id], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!rows.length) return res.status(404).json({ error: 'Application not found' });
        // Build CV download URL
        const app = rows[0];
        app.cv_url = app.cv_filename
            ? `/api/cvs/${app.cv_filename}`
            : null;
        res.status(200).json(app);
    });
});

/** PUT /api/career-applications/:id/status  — update status */
router.put('/career-applications/:id/status', (req, res) => {
    const { id }     = req.params;
    const { status } = req.body;
    const allowed    = ['PENDING','REVIEWING','SHORTLISTED','INTERVIEW','REJECTED','HIRED'];
    if (!allowed.includes(status)) return res.status(400).json({ error: `Status must be: ${allowed.join(', ')}` });

    db.query(
        'UPDATE career_applications SET status=?, updated_at=? WHERE id=?',
        [status, createdAt(), id],
        (err) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            res.status(200).json({ message: 'Status updated' });
        }
    );
});

/** PUT /api/career-applications/:id/notes  — add admin notes */
router.put('/career-applications/:id/notes', (req, res) => {
    const { notes } = req.body;
    db.query(
        'UPDATE career_applications SET admin_notes=?, updated_at=? WHERE id=?',
        [notes, createdAt(), req.params.id],
        (err) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            res.status(200).json({ message: 'Notes saved' });
        }
    );
});

/** DELETE /api/career-applications/:id */
router.delete('/career-applications/:id', (req, res) => {
    db.query('SELECT cv_filename FROM career_applications WHERE id=?', [req.params.id], (err, rows) => {
        if (!err && rows.length && rows[0].cv_filename) {
            const cvPath = path.join(ROOT, 'uploads', 'cvs', rows[0].cv_filename);
            if (fs.existsSync(cvPath)) fs.unlinkSync(cvPath);
        }
        db.query('DELETE FROM career_applications WHERE id=?', [req.params.id], (err2) => {
            if (err2) return res.status(500).json({ error: 'Database error' });
            res.status(200).json({ message: 'Application deleted' });
        });
    });
});

// ═══════════════ INTERVIEW INVITATION EMAIL ══════════════════

/** POST /api/career-applications/:id/invite  — send interview invitation */
router.post('/career-applications/:id/invite', async (req, res) => {
    const { id }                                = req.params;
    const { interviewDate, interviewTime,
            interviewType, interviewLink,
            interviewNotes, interviewLocation } = req.body;

    db.query('SELECT * FROM career_applications WHERE id=?', [id], async (err, rows) => {
        if (err || !rows.length) return res.status(404).json({ error: 'Application not found' });
        const applicant = rows[0];

        try {
            await sendInterviewInvitationEmail(
                applicant.first_name,
                applicant.email,
                applicant.job_title,
                interviewDate,
                interviewTime,
                interviewType  || 'Online',
                interviewLink  || '',
                interviewLocation || 'Nairobi, Kenya',
                interviewNotes || ''
            );

            // Update status to INTERVIEW
            db.query(
                'UPDATE career_applications SET status=?, interview_date=?, interview_notes=?, updated_at=? WHERE id=?',
                ['INTERVIEW', `${interviewDate} ${interviewTime}`, interviewNotes||'', createdAt(), id],
                () => {}
            );

            res.status(200).json({ message: `Interview invitation sent to ${applicant.email}` });
        } catch (e) {
            console.error('Interview email error:', e);
            res.status(500).json({ error: 'Failed to send invitation email' });
        }
    });
});

// ═══════════════ EMAIL FUNCTIONS ════════════════════════════

async function sendApplicationNotificationEmail(name, email, phone, jobTitle, dept, experience) {
    await sendMail({
        from:    `"AdConnect Careers" <${process.env.EMAIL_USER}>`,
        to:      ADMIN_EMAIL,
        subject: `📋 New Application: ${jobTitle} — ${name}`,
        html: `
        <body style="font-family:Arial,sans-serif;background:#1A1917;color:#F4F1EE;padding:20px;">
          <div style="max-width:580px;margin:0 auto;background:#252320;border:1px solid #3d3b39;border-radius:12px;overflow:hidden;">
            <div style="background:#F65730;padding:20px 28px;">
              <h2 style="margin:0;color:#fff;">New Career Application</h2>
              <p style="margin:4px 0 0;color:rgba(255,255,255,.8);font-size:13px;">${new Date().toLocaleString('en-KE',{timeZone:'Africa/Nairobi'})}</p>
            </div>
            <div style="padding:28px;">
              <table style="width:100%;border-collapse:collapse;">
                <tr><td style="padding:10px 0;border-bottom:1px solid #3d3b39;color:#7a7874;font-size:12px;width:130px;">Position</td><td style="padding:10px 0;border-bottom:1px solid #3d3b39;font-weight:700;color:#F65730;">${jobTitle}</td></tr>
                <tr><td style="padding:10px 0;border-bottom:1px solid #3d3b39;color:#7a7874;font-size:12px;">Department</td><td style="padding:10px 0;border-bottom:1px solid #3d3b39;">${dept}</td></tr>
                <tr><td style="padding:10px 0;border-bottom:1px solid #3d3b39;color:#7a7874;font-size:12px;">Applicant</td><td style="padding:10px 0;border-bottom:1px solid #3d3b39;font-weight:600;">${name}</td></tr>
                <tr><td style="padding:10px 0;border-bottom:1px solid #3d3b39;color:#7a7874;font-size:12px;">Email</td><td style="padding:10px 0;border-bottom:1px solid #3d3b39;"><a href="mailto:${email}" style="color:#F65730;">${email}</a></td></tr>
                <tr><td style="padding:10px 0;border-bottom:1px solid #3d3b39;color:#7a7874;font-size:12px;">Phone</td><td style="padding:10px 0;border-bottom:1px solid #3d3b39;">${phone||'—'}</td></tr>
                <tr><td style="padding:10px 0;color:#7a7874;font-size:12px;">Experience</td><td style="padding:10px 0;">${experience||'—'}</td></tr>
              </table>
              <div style="margin-top:24px;text-align:center;">
                <a href="${BASE_URL}/admin.html" style="display:inline-block;padding:12px 28px;background:#F65730;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;">View in Admin Panel</a>
              </div>
            </div>
          </div>
        </body>`,
    });
}

async function sendApplicationAcknowledgement(firstName, email, jobTitle) {
    await sendMail({
        from:    `"AdConnect Careers" <${process.env.EMAIL_USER}>`,
        to:      email,
        subject: `Application Received — ${jobTitle} at AdConnect`,
        html: `
        <body style="font-family:Arial,sans-serif;background:#1A1917;color:#F4F1EE;padding:20px;">
          <div style="max-width:560px;margin:0 auto;background:#252320;border:1px solid #3d3b39;border-radius:12px;overflow:hidden;">
            <div style="background:linear-gradient(135deg,#4d4c4b,#646464);padding:28px;text-align:center;">
              <img src="${BASE_URL}/resources/logo.png" alt="AdConnect" style="height:40px;margin-bottom:16px;" />
              <h2 style="margin:0;color:#fff;">Application Received!</h2>
            </div>
            <div style="padding:32px;">
              <p>Hi <strong>${firstName}</strong>,</p>
              <p style="margin-top:12px;line-height:1.7;">Thank you for applying for the <strong style="color:#F65730;">${jobTitle}</strong> position at AdConnect. We've received your application and our team will carefully review it.</p>
              <div style="margin:24px 0;padding:20px;background:#302E2C;border-radius:8px;border-left:3px solid #F65730;">
                <p style="font-weight:700;margin-bottom:8px;">What happens next?</p>
                <p style="font-size:13px;line-height:1.7;color:#B8B4B0;">Our hiring team will review your CV and application within <strong>5–7 business days</strong>. If your profile is a strong match, we'll reach out to schedule an interview.</p>
              </div>
              <p style="font-size:13px;color:#7a7874;">Questions? Reply to this email or reach us at <a href="mailto:careers@adconnect.co.ke" style="color:#F65730;">careers@adconnect.co.ke</a></p>
              <p style="margin-top:24px;">Best regards,<br /><strong>The AdConnect Hiring Team</strong></p>
            </div>
            <div style="padding:16px 28px;border-top:1px solid #3d3b39;text-align:center;font-size:11px;color:#7a7874;">
              AdConnect · Nairobi, Kenya · <a href="${BASE_URL}" style="color:#4ABC4F;">adconnect.co.ke</a>
            </div>
          </div>
        </body>`,
    });
}

async function sendInterviewInvitationEmail(firstName, email, jobTitle, date, time, type, link, location, notes) {
    const dateFormatted = new Date(date).toLocaleDateString('en-KE',{weekday:'long',year:'numeric',month:'long',day:'numeric'});

    await sendMail({
        from:    `"AdConnect Careers" <${process.env.EMAIL_USER}>`,
        to:      email,
        subject: `Interview Invitation — ${jobTitle} at AdConnect`,
        html: `
        <body style="font-family:Arial,sans-serif;background:#1A1917;color:#F4F1EE;padding:20px;">
          <div style="max-width:560px;margin:0 auto;background:#252320;border:1px solid #3d3b39;border-radius:12px;overflow:hidden;">
            <div style="background:#F65730;padding:28px;text-align:center;">
              <div style="font-size:2.5rem;margin-bottom:8px;"></div>
              <h2 style="margin:0;color:#fff;">You're Invited to Interview!</h2>
              <p style="margin:6px 0 0;color:rgba(255,255,255,.85);font-size:14px;">${jobTitle} · AdConnect</p>
            </div>
            <div style="padding:32px;">
              <p>Congratulations <strong>${firstName}</strong>!</p>
              <p style="margin-top:12px;line-height:1.7;">We've reviewed your application and we're excited to invite you for an interview. Please see the details below:</p>

              <div style="margin:24px 0;padding:24px;background:#302E2C;border-radius:10px;">
                <table style="width:100%;border-collapse:collapse;">
                  <tr><td style="padding:10px 0;border-bottom:1px solid #3d3b39;color:#7a7874;font-size:12px;width:120px;">Date</td><td style="padding:10px 0;border-bottom:1px solid #3d3b39;font-weight:700;">${dateFormatted}</td></tr>
                  <tr><td style="padding:10px 0;border-bottom:1px solid #3d3b39;color:#7a7874;font-size:12px;">Time</td><td style="padding:10px 0;border-bottom:1px solid #3d3b39;font-weight:700;">${time} EAT</td></tr>
                  <tr><td style="padding:10px 0;border-bottom:1px solid #3d3b39;color:#7a7874;font-size:12px;">Format</td><td style="padding:10px 0;border-bottom:1px solid #3d3b39;">${type}</td></tr>
                  <tr><td style="padding:10px 0;${notes?'border-bottom:1px solid #3d3b39;':''}color:#7a7874;font-size:12px;">Location</td><td style="padding:10px 0;${notes?'border-bottom:1px solid #3d3b39;':''}">${type==='Online' ? 'Video Call' : location}</td></tr>
                  ${notes ? `<tr><td style="padding:10px 0;color:#7a7874;font-size:12px;vertical-align:top;">Notes</td><td style="padding:10px 0;font-size:13px;line-height:1.6;">${notes}</td></tr>` : ''}
                </table>
              </div>

              ${link ? `
              <div style="text-align:center;margin-bottom:24px;">
                <a href="${link}" style="display:inline-block;padding:13px 32px;background:#F65730;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">
                  Join Video Interview
                </a>
              </div>` : ''}

              <div style="padding:16px;background:#1A1917;border-radius:8px;margin-bottom:20px;">
                <p style="font-weight:700;font-size:13px;margin-bottom:8px;">How to Prepare:</p>
                <ul style="font-size:13px;color:#B8B4B0;line-height:1.8;padding-left:20px;">
                  <li>Review your application and the job description</li>
                  <li>Prepare examples from your past experience</li>
                  <li>Have any portfolio or project links ready</li>
                  <li>Join a few minutes early if it's a video call</li>
                </ul>
              </div>

              <p style="font-size:13px;color:#7a7874;">Need to reschedule? Reply to this email or call us at <a href="tel:+254790064130" style="color:#F65730;">+254 790 064 130</a></p>
              <p style="margin-top:20px;">Looking forward to meeting you!<br /><strong>The AdConnect Hiring Team</strong></p>
            </div>
            <div style="padding:16px 28px;border-top:1px solid #3d3b39;text-align:center;font-size:11px;color:#7a7874;">
              AdConnect · <a href="${BASE_URL}" style="color:#4ABC4F;">adconnect.co.ke</a> · careers@adconnect.co.ke
            </div>
          </div>
        </body>`,
    });
}

// Error handling middleware
router.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: err.message });
});


  return router;
};
