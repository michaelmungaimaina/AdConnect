require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { google } = require('googleapis');
const fs = require('fs');
const nodemailer = require('nodemailer');
const config = require('./config');
const readline = require('readline');
const multer = require('multer');
const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");
const rateLimit = require('express-rate-limit'); // npm install express-rate-limit
const helmet    = require('helmet');  
const EMAIL_SEQUENCE = require('./public/scripts/email-sequence.js');
const cron       = require('node-cron'); 

const app = express();
app.use(helmet({ contentSecurityPolicy: false }));


// Middleware
app.use(bodyParser.json());
app.use(express.json());
// Enable CORS for all origins
app.use(cors());

app.use(cors({
    origin: ['http://127.0.0.1:3000', 'http://127.0.0.1:63342', 'http://localhost:63342', 'https://adconnect.com'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  max:      parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);


//
app.use((req, res, next) => {
    console.log(`Incoming request: ${req.method} ${req.url}`);
    next();
});

// ═══════════════════ HELPER ════════════════════════════════════
function tryParseJSON(str, fallback) {
    try { return JSON.parse(str); }
    catch { return fallback; }
}

// Serve API routes under `/api`
app.use('/api', express.json()); // Ensure requests to `/api` parse JSON bodies

// Serve static files (HTML, CSS, JS)
app.use(express.static('public'));

/*/ Handle frontend routing by redirecting all non-API requests to index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});*/

// Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.urlencoded({ extended: false }));

console.log("DB Config:", {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD ? "****" : "MISSING",
    database: process.env.DB_NAME
});

// MySQL Connection
const db = mysql.createPool(config.db);
// Check database connection
db.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Error Connecting to Database:', err);
        return;
    }
    console.log('✅ Connected to the MySQL database.');
    connection.release(); // Always release the connection back to the pool

    // Start Express server
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`🚀 Server running on ${process.env.APP_API_URL || 'http://localhost'}:${PORT}`);
    });
});

// Multer Configuration for File Upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, `${clientID()}${path.extname(file.originalname)}`),
});
// Serve static files from the "uploads" directory
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));
// Ensure the uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// ─── Storage for media uploads ──────────────────────────────
const mediaStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, 'uploads', 'media');
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
app.use('/api/media/files', require('express').static(path.join(__dirname, 'uploads', 'media')));
 
 
// ══════════════════════════════════════════════════════════════
// FAQs ENDPOINTS
// ══════════════════════════════════════════════════════════════
 
app.get('/api/faqs', (req, res) => {
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
 
app.get('/api/faqs/:id', (req, res) => {
  db.query('SELECT * FROM faqs WHERE id = ?', [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!rows.length) return res.status(404).json({ error: 'FAQ not found' });
    res.status(200).json(rows[0]);
  });
});
 
app.post('/api/faqs', (req, res) => {
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
 
app.put('/api/faqs/:id', (req, res) => {
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
 
app.put('/api/faqs/:id/status', (req, res) => {
  const { status } = req.body;
  if (!['PUBLISHED','DRAFT'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
  db.query('UPDATE faqs SET status=?, updated_at=? WHERE id=?', [status, createdAt(), req.params.id], (err) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.status(200).json({ message: 'Status updated' });
  });
});
 
app.delete('/api/faqs/:id', (req, res) => {
  db.query('DELETE FROM faqs WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.status(200).json({ message: 'FAQ deleted' });
  });
});
 
// Public FAQ submission (from website contact form)
app.post('/api/faq-submission', (req, res) => {
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
 
app.get('/api/faq-submissions', (req, res) => {
  db.query('SELECT * FROM faq_submissions ORDER BY created_at DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.status(200).json(rows);
  });
});
 
 
// ══════════════════════════════════════════════════════════════
// MEDIA LIBRARY ENDPOINTS
// ══════════════════════════════════════════════════════════════
 
app.get('/api/media', (req, res) => {
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
      const base = `${process.env.APP_API_URL}api/media/files/`;
      const items = rows.map(r => ({
        ...r,
        url:  r.filename ? `${base}${r.filename}` : null,
        tags: tryParseJSON(r.tags, []),
      }));
      res.status(200).json({ items, total, totalPages, page: parseInt(page) });
    });
  });
});
 
app.post('/api/media', mediaUpload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Image file is required' });
  const { type, alt, tags } = req.body;
  const tagsJSON = JSON.stringify(
    (tags || '').split(',').map(t => t.trim()).filter(Boolean)
  );
 
  // Get image dimensions
  let width = null, height = null;
  try {
    const meta = await sharp(req.file.path).metadata();
    width  = meta.width;
    height = meta.height;
  } catch { /* non-critical */ }
 
  db.query(
    `INSERT INTO media_library (id, filename, original_name, type, alt, tags, size, width, height, mime_type, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [clientID(), req.file.filename, req.file.originalname, type||'general',
     alt||req.file.originalname, tagsJSON, req.file.size, width, height, req.file.mimetype, createdAt()],
    (err) => {
      if (err) { console.error(err); return res.status(500).json({ error: 'Upload failed' }); }
      const url = `${process.env.APP_API_URL}api/media/files/${req.file.filename}`;
      res.status(201).json({ message: 'Uploaded', url, filename: req.file.filename });
    }
  );
});
 
app.put('/api/media/:id', (req, res) => {
  const { alt, tags } = req.body;
  const tagsJSON = JSON.stringify(Array.isArray(tags) ? tags : (tags||'').split(',').map(t=>t.trim()).filter(Boolean));
  db.query('UPDATE media_library SET alt=?, tags=? WHERE id=?', [alt, tagsJSON, req.params.id], (err) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.status(200).json({ message: 'Updated' });
  });
});
 
app.delete('/api/media/:id', (req, res) => {
  db.query('SELECT filename FROM media_library WHERE id=?', [req.params.id], (err, rows) => {
    if (err || !rows.length) return res.status(404).json({ error: 'Not found' });
    const filePath = path.join(__dirname, 'uploads', 'media', rows[0].filename);
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
app.post('/api/analytics/record-visit', (req, res) => {
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
app.get('/api/analytics/unique-ips', (req, res) => {
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
 
 
// ══════════════════════════════════════════════════════════════
// NEWSLETTER SUBSCRIBE
// ══════════════════════════════════════════════════════════════
 
app.post('/api/newsletter-subscribe', (req, res) => {
  const { email } = req.body;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Valid email required' });
  }
  db.query('SELECT id FROM newsletter WHERE email = ?', [email], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (rows.length) return res.status(200).json({ message: "You're already subscribed!" });
    db.query(
      'INSERT INTO newsletter (id, email, created_at) VALUES (?, ?, ?)',
      [clientID(), email, createdAt()],
      (err2) => {
        if (err2) return res.status(500).json({ error: 'Subscribe failed' });
        res.status(201).json({ message: 'Subscribed successfully!' });
      }
    );
  });
});


// Function to handle user creation (register a new user)
app.post('/api/users', (req, res) => {
    const {name, email, password, role, access_level} = req.body;

    // Validate that all required fields are provided
    if (!name || !email || !password || !role || !access_level) {
        return res.status(400).json({error: 'All fields are required'});
    }

    // Check if a user with the same name and email already exists
    const query1 = 'SELECT * FROM users WHERE name = ? AND email = ?';
    db.query(query1, [name, email], (err, rows) => {
        if (err) {
            console.error(err); // Log the error
            return res.status(500).json({error: 'Database error'}); // Return a server error response
        }
        // If the user already exists, return an error
        if (rows.length > 0) {
            return res.status(400).json({error: 'User Already Exists!'});
        }


        // Insert the new user into the database
        const query = `INSERT INTO users (id, name, email, password, role, access_level, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`;
        db.query(query, [clientID(), name, email, password, role, access_level, createdAt()], (err) => {
            if (err) {
                console.error(err); // Log the error
                return res.status(500).json({error: 'Database error'}); // Return a server error response
            }

            // Return a success response with the generated user information
            res.status(201).json({
                message: 'User created successfully',
                user: {clientID, name, email, role, access_level, createdAt},
            });
        });
    });
});

// Function to handle user authentication (Login user)
app.post('/api/auth', (req, res) => {
    const {email, password} = req.body;
    // Ensure email and password values are provided
    if (!email || !password) {
        return res.status(400).json({error: 'Email and password are required'});
    }
    const query = 'SELECT * FROM users WHERE email = ? AND password = ?';
    db.query(query, [email, password], (err, rows) => {
        // Log database error if any occurs
        if (err) {
            console.error(err);
            return res.status(500).json({error: 'Database error'});
        }
        // Check if user exists in the database
        if (rows.length === 0) {
            return res.status(404).json({error: 'User not found'});
        }
        const user = rows[0];
        // Return login success message along with username
        res.status(200).json({message: 'Login successful', username: user.name, role: user.role || 'GEN_USER'});
    });
});


// Endpoint to get all users
app.get('/api/users', (req, res) => {
    const query = 'SELECT * FROM users';
    db.query(query, (err, users) => {
        if (err) {
            console.error(err);
            return res.status(500).json({error: 'Database error'});
        }
        res.status(200).json(users);
    });
});

// Endpoint to get user by id
app.get('/api/users/:id', (req, res) => {
    const {id} = req.params; // Extract the user ID from request parameters
    const query = 'SELECT * FROM users WHERE id = ?'; // Query to retrieve the user by ID
    db.query(query, [id], (err, rows) => {
        if (err) {
            console.error(err); // Log the error if any occurs
            return res.status(500).json({error: 'Database error'}); // Send a 500 response for database error
        }
        if (rows.length === 0) {
            return res.status(404).json({error: 'User not found'}); // Send a 404 response if no user is found
        }
        res.status(200).json(rows[0]); // Send the user data in a success response
    });
});
// Endpoint to update user by id
app.put('/api/users/:id', (req, res) => {
    const {id} = req.params; // Extract the user ID from request parameters
    const {name, email, password, role, access_level} = req.body; // Extract the fields to be updated from the request body
    const query = `UPDATE users SET name = ?, email = ?, password = ?, role = ?, access_level = ? WHERE id = ?`; // Query to update the user
    db.query(query, [name, email, password, role, access_level, id], (err) => {
        if (err) {
            console.error(err); // Log the error if any occurs
            return res.status(500).json({error: 'Database error'}); // Send a 500 response for database error
        }
        res.status(200).json({message: 'User updated successfully'}); // Send a success response
    });
});

// Endpoint to delete user by id
app.delete('/api/users/:id', (req, res) => {
    const {id} = req.params; // Extract the user ID from request parameters
    const query = 'DELETE FROM users WHERE id = ?'; // Query to delete the user
    db.query(query, [id], (err) => {
        if (err) {
            console.error(err); // Log the error if any occurs
            return res.status(500).json({error: 'Database error'}); // Send a 500 response for database error
        }
        res.status(200).json({message: 'User deleted successfully'}); // Send a success response
    });
});

app.post('/api/analytics/track', async (req, res) => {
  const { page_name, page_path, session_id, referrer,
          utm_source, utm_medium, utm_campaign } = req.body;
          console.log("BODY:", req.body);
  if (!page_name) return res.status(400).json({ error: 'page_name required' });

  try {
    await db.execute(
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
app.get('/api/analytics/track', async (req, res) => {
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

    const [rows] = await db.execute(query, params);

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

    const [countResult] = await db.execute(countQuery, countParams);
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
const clientID = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `${year}${month}${day}${hours}${minutes}${seconds}`;
};
const createdAt = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

// Create a new client (lead)
// Endpoint to add a new client
app.post('/api/clients', (req, res) => {
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
        enqueueEmailSequence(clientEmail);
    });
});

// ═══════════════════ BLOG POSTS ═════════════════════════════

// Get all blog posts (with optional status filter)
app.get('/api/blog-posts', (req, res) => {
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
app.get('/api/blog-posts/:id', (req, res) => {
    const { id } = req.params;
    db.query('SELECT * FROM blog_posts WHERE id = ?', [id], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!rows.length) return res.status(404).json({ error: 'Post not found' });
        res.status(200).json(rows[0]);
    });
});

// Create blog post
app.post('/api/blog-posts', (req, res) => {
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
app.put('/api/blog-posts/:id', (req, res) => {
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
app.delete('/api/blog-posts/:id', (req, res) => {
    db.query('DELETE FROM blog_posts WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.status(200).json({ message: 'Post deleted' });
    });
});

// ═══════════════════ PORTFOLIO PROJECTS ══════════════════════

// Get all projects (with optional status filter)
app.get('/api/projects', (req, res) => {
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
app.get('/api/projects/:id', (req, res) => {
    db.query('SELECT * FROM projects WHERE id = ?', [req.params.id], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!rows.length) return res.status(404).json({ error: 'Project not found' });
        const p = rows[0];
        res.status(200).json({ ...p, tags: tryParseJSON(p.tags, []) });
    });
});

// Create project (with optional thumbnail upload)
const projectUpload = multer({ storage });

app.post('/api/projects', projectUpload.single('thumbnail'), (req, res) => {
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
app.put('/api/projects/:id', (req, res) => {
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
app.delete('/api/projects/:id', (req, res) => {
    db.query('DELETE FROM projects WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.status(200).json({ message: 'Project deleted' });
    });
});

// Endpoint to generate and download Excel
app.post("/api/download/excel", async (req, res) => {
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
app.post('/api/lead-exists', (req, res) => {
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
app.get('/api/clients', (req, res) => {
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
app.get('/api/clients/:id', (req, res) => {
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

// Endpoint to send a subsequent email to a client
app.post('/api/sendSubsequentEmail', (req, res) => {
    const { clientID } = req.body;
    console.log(clientID);

    const clientQuery = 'SELECT * FROM clients WHERE clientID = ?';
    db.query(clientQuery, [clientID], (err, client) => {
        if (err) {
            console.error('Database Error:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (client.length === 0) {
            return res.status(404).json({ error: 'Client not found' });
        }

        console.log(`Client Subscription Value: "${client[0].clientSubScription}"`);
        if (client[0].clientSubScription?.trim().toUpperCase() !== 'SUBSCRIBED') {
            return res.status(400).json({ error: 'Client is not subscribed to marketing emails' });
        }

        const templateQuery = 'SELECT subject, body FROM email_templates WHERE status = ?';
        db.query(templateQuery, [client[0].clientStatus], (err, template) => {
            if (err) {
                console.error('Database Error:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            if (template.length === 0) {
                return res.status(404).json({ error: `No email template found for status: ${client[0].clientStatus}` });
            }

            const emailBody = template[0].body.replace(/\$\{clientName\}/g, client[0].clientName);
            sendSubSequentEmail(client[0].clientEmail, template[0].subject, emailBody)
                .then(() => {
                    const statusOrder = ['1ST CONTACT', '2ND CONTACT', '3RD CONTACT', '30TH CONTACT', '5TH CONTACT'];
                    const currentStatusIndex = statusOrder.indexOf(client[0].clientStatus.trim().toUpperCase());
                    const newStatus =
                        currentStatusIndex !== -1 && currentStatusIndex < statusOrder.length - 1
                            ? statusOrder[currentStatusIndex + 1]
                            : client[0].clientStatus;

                    const updateQuery = 'UPDATE clients SET clientStatus = ?, updated_at = CURRENT_TIMESTAMP WHERE clientID = ?';
                    db.query(updateQuery, [newStatus, clientID], (err) => {
                        if (err) {
                            console.error('Database Error:', err);
                            return res.status(500).json({ error: 'Database error' });
                        }
                        res.status(200).json({ message: 'Email sent and status updated successfully!' });
                    });
                })
                .catch((err) => {
                    console.error('Email Sending Error:', err);
                    res.status(500).json({ error: 'An error occurred while sending the email' });
                });
        });
    });
});

// Endpoint to fetch email template by status
app.get('/api/emailTemplate', async (req, res) => {
    try {
        const { status } = req.query;
        if (!status) {
            return res.status(400).json({ error: 'Status is required' });
        }
        const query = 'SELECT subject, body FROM email_templates WHERE status = ?';
        const [result] = await db.execute(query, [status]);
        if (result.length === 0) {
            return res.status(404).json({ error: 'No email template found for this status' });
        }
        res.status(200).json({ subject: result[0].subject, body: result[0].body });
    } catch (error) {
        console.error('Error fetching email template:', error);
        res.status(500).json({ error: 'An error occurred while fetching the email template' });
    }
});

// Unsubscribe a lead by ID
app.put('/api/unsubscribeLead', async (req, res) => {
    const { clientID } = req.body;
    try {
        if (!clientID) {
            return res.status(404).json({ error: 'No Lead Id Passed' });
        }
        await db.execute(
            `UPDATE clients SET clientSubScription = ?, created_at = ? WHERE clientID = ?`,
            ['UNSUBSCRIBED', new Date(), clientID]
        );
        res.status(200).json({ message: 'Lead Unsubscribed Successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while unsubscribing!' });
    }
});

/// Update a lead by ID
app.put('/api/clients/:id', (req, res) => {
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
app.delete('/api/clients/:id', (req, res) => {
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



/// Create a new appointment booking
app.post('/api/appointments', (req, res) => {
    const {
        clientName,
        clientEmail,
        clientPhone,
        clientLocation,
        appointmentDate,
        appointmentTime,
        appointmentType,
        appointmentStatus,
        appointmentNotes,
        meetingLink
    } = req.body;

    // Check if all required fields are provided
    if (!appointmentDate || !clientPhone) {
        return res.status(400).json({ error: 'Missing required fields: appointmentDate, or clientPhone' });
    }

    // SQL query to insert a new appointment
    const insertQuery = `
        INSERT INTO appointments (clientId, name, email, phone, location, appointmentDate, appointmentTime, appointmentType, appointmentStatus, appointmentNotes, meetingLink,created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)
    `;

    db.query(insertQuery, [clientID(), clientName, clientEmail, clientPhone, clientLocation, appointmentDate, appointmentTime, appointmentType, appointmentStatus, appointmentNotes, meetingLink, createdAt()], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'An error occurred while booking the appointment' });
        }

        // Respond with the newly created appointment
        res.status(201).json({
            message: 'Appointment Booked successfully',
            appointment: {
                // auto-generated ID will be in result.insertId
                clientName, clientEmail, clientPhone, clientLocation,
                appointmentDate, appointmentTime, appointmentType, appointmentStatus,
                appointmentNotes, meetingLink
            }
        });
    });
});

// Get all appointments
app.get('/api/appointments', (req, res) => {
    console.log('Getting all appointments');

    // SQL query to fetch all appointments
    const query = 'SELECT * FROM appointments';

    // Execute the query
    db.query(query, (err, appointments) => {
        if (err) {
            console.error('Backend Error: ', err);
            return res.status(500).json({ error: 'An error occurred while retrieving appointments' });
        }

        // Respond with the fetched appointments
        res.status(200).json(appointments);
    });
});

// Get a single appointment by ID
app.get('/api/appointments/:id', (req, res) => {
    const appointmentId = req.params.id;

    // SQL query to fetch the appointment by ID
    const query = 'SELECT * FROM appointments WHERE clientId = ?';

    // Execute the query with the appointment ID
    db.query(query, [appointmentId], (err, appointment) => {
        if (err) {
            console.error('Backend Error: ', err);
            return res.status(500).json({ error: 'An error occurred while retrieving the appointment' });
        }

        // If the appointment does not exist, return 404
        if (appointment.length === 0) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        // Respond with the fetched appointment
        res.status(200).json(appointment[0]);
    });
});

// Get appointments by appointment date
app.get('/api/appointments-by-date/:appointmentDate', (req, res) => {
    const appointmentDate = req.params.appointmentDate;

    // Log the input date for debugging
    console.log('Received appointmentDate:', appointmentDate);

    // SQL query to fetch appointments for the given date
    const query = 'SELECT appointmentTime FROM appointments WHERE appointmentDate = ?';

    // Execute the query
    db.query(query, [appointmentDate], (err, appointments) => {
        if (err) {
            console.error('Backend Error:', err);
            return res.status(500).json({ error: 'An error occurred while retrieving appointment times' });
        }

        // Log the database result
        console.log('Database response:', appointments);

        if (appointments.length === 0) {
            return res.status(404).json({ error: 'No appointments found for the given date' });
        }

        res.status(200).json({
            message: 'Appointment time(s) retrieved successfully',
            appointmentTime: appointments,
        });
    });
});

// Reschedule meeting and Notify client
app.put('/api/rescheduleMeeting', (req, res) => {
    const {
        clientId, name, email, phone, location, appointmentDate, appointmentTime,
        appointmentType, appointmentStatus, appointmentNotes, meetingLink
    } = req.body;

    // SQL query to check if the appointment exists
    const checkQuery = 'SELECT * FROM appointments WHERE clientId = ?';

    db.query(checkQuery, [clientId], (err, existingAppointment) => {
        if (err) {
            console.error('Backend Error:', err);
            return res.status(500).json({ error: 'An error occurred while checking the appointment' });
        }

        // If the appointment does not exist, return 404
        if (existingAppointment.length === 0) {
            console.log('Appointment not found');
            return res.status(404).json({ error: 'Appointment not found' });
        }

        // SQL query to update the appointment
        const updateQuery = `
            UPDATE appointments
            SET clientId = ?, name = ?, email = ?, phone = ?, location = ?, appointmentDate = ?,
                appointmentTime = ?, appointmentType = ?, appointmentStatus = ?, appointmentNotes = ?, meetingLink = ?, created_at = ?
            WHERE clientId = ?
        `;

        // Execute the update query
        db.query(updateQuery, [clientId, name, email, phone, location, appointmentDate, appointmentTime, appointmentType, appointmentStatus, appointmentNotes, meetingLink, createdAt(), clientId], (updateErr) => {
            if (updateErr) {
                console.error('Backend Error:', updateErr);
                return res.status(500).json({ error: 'An error occurred while updating the appointment' });
            }

            // Send Email Notification
            sendRescheduleEmail(name.split(' ')[0], email, appointmentDate, appointmentTime, location, appointmentNotes, meetingLink);
            sendBookingReactionEmail(name.split(' ')[0], email, appointmentDate, appointmentTime, location, appointmentNotes, meetingLink);

            // Respond with a success message
            console.log('Meeting Rescheduled successfully');
            res.status(200).json({
                message: 'Meeting Rescheduled successfully',
                appointment: {
                    clientId, name, email, phone, location, appointmentDate, appointmentTime, appointmentType, appointmentStatus, appointmentNotes, meetingLink
                }
            });
        });
    });
});

// Reminder notification to client
app.put('/api/reminder-email', (req, res) => {
    console.log(req.body);
    const { clientId, name, email, phone, location, appointmentDate, appointmentTime, appointmentType, appointmentStatus, appointmentNotes, meetingLink } = req.body;

    // SQL query to check if the appointment exists
    const checkQuery = 'SELECT * FROM appointments WHERE clientId = ?';

    db.query(checkQuery, [clientId], (err, existingAppointment) => {
        if (err) {
            console.error('Backend Error:', err);
            return res.status(500).json({ error: 'An error occurred while checking the appointment' });
        }

        // If the appointment does not exist, return 404
        if (existingAppointment.length === 0) {
            console.log('Appointment not found');
            return res.status(404).json({ error: 'Appointment not found' });
        }

        /* SQL query to update the appointment reminder status
       const updateQuery =
           UPDATE appointments
           SET clientId = ?, name = ?, email = ?, phone = ?, location = ?, appointmentDate = ?, appointmentTime = ?, appointmentType = ?, status = ?, notes = ?, meetingLink = ?, created_at = ?
           WHERE clientId = ?
       ;*/

        // Execute the update query
        // await db.execute(updateQuery, [clientId,name, email, phone, location, appointmentDate, appointmentTime, appointmentType, appointmentStatus, appointmentNotes, meetingLink, createdAt, clientId]);

        // Split name to get first name
        const [fname] = name.split(' ');

        // Send Email Notification
        sendReminderEmail(fname, email, appointmentDate, appointmentTime, location, appointmentNotes, meetingLink);
        // Respond with a success message
        console.log('Reminder Sent successfully');
        res.status(200).json({
            message: 'Reminder Sent successfully',
            appointment: {
                clientId, name, email, phone, location, appointmentDate, appointmentTime, appointmentType, appointmentStatus, appointmentNotes, meetingLink
            }
        });
    });
});

// Update an appointment by ID
app.put('/api/appointments/:id', (req, res) => {
    const appointmentId = req.params.id;
    const { status } = req.body;

    // SQL query to check if the appointment exists
    const checkQuery = 'SELECT * FROM appointments WHERE clientId = ?';

    db.query(checkQuery, [appointmentId], (err, existingAppointment) => {
        if (err) {
            console.error('Backend Error:', err);
            return res.status(500).json({ error: 'An error occurred while checking the appointment' });
        }

        // If the appointment does not exist, return 404
        if (existingAppointment.length === 0) {
            console.log('Appointment not found');
            return res.status(404).json({ error: 'Appointment not found' });
        }

        // SQL query to update the appointment
        const updateQuery = `
            UPDATE appointments
            SET appointmentStatus = ?
            WHERE clientId = ?
        `;

        // Execute the update query
        db.query(updateQuery, [status, appointmentId], (updateErr) => {
            if (updateErr) {
                console.error('Backend Error:', updateErr);
                return res.status(500).json({ error: 'An error occurred while updating the appointment' });
            }

            // Respond with a success message
            console.log('Appointment Status updated successfully');
            res.status(200).json({
                message: 'Appointment Status updated successfully',
                appointment: {
                    id: appointmentId,
                    status
                }
            });
        });
    });
});

// Delete an appointment by ID
app.delete('/api/appointments/:id', (req, res) => {
    const appointmentId = req.params.id;

    // SQL query to check if the appointment exists
    const checkQuery = 'SELECT * FROM appointments WHERE clientId = ?';

    db.query(checkQuery, [appointmentId], (err, existingAppointment) => {
        if (err) {
            console.error('Backend Error:', err);
            return res.status(500).json({ error: 'An error occurred while checking the appointment' });
        }

        // If the appointment does not exist, return 404
        if (existingAppointment.length === 0) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        // SQL query to delete the appointment
        const deleteQuery = 'DELETE FROM appointments WHERE clientId = ?';

        db.query(deleteQuery, [appointmentId], (deleteErr) => {
            if (deleteErr) {
                console.error('Backend Error:', deleteErr);
                return res.status(500).json({ error: 'An error occurred while deleting the appointment' });
            }

            // Respond with a success message
            res.status(200).json({ message: 'Appointment deleted successfully' });
        });
    });
});


// Get all Video Data
app.get('/api/video-data-active', (req, res) => {
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
            video: item.video ? `${process.env.APP_API_URL}api/uploads/${path.basename(item.video)}` : null
        }));
        console.log(result);
        // Respond with the list of about data
        res.status(200).json(result);
    });
});

// Get all Video Data
app.get('/api/video-data', (req, res) => {
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
            video: item.video ? `${process.env.APP_API_URL}api/uploads/${path.basename(item.video)}` : null
        }));
        console.log(result);
        // Respond with the list of about data
        res.status(200).json(result);
    });
});

const upload = multer({ storage: storage });

// Upload Video
app.post('/api/video-data', upload.single('video'), (req, res) => {
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
app.put('/api/video-data-update-status/:id', (req, res) => {
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
app.delete('/api/video-data/:id', (req, res) => {
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
app.get('/api/about-data-active', (req, res) => {
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
            icon: item.icon ? `${process.env.APP_API_URL}api/uploads/${path.basename(item.icon)}` : null
        }));
        console.log(about);
        // Respond with the list of about data
        res.status(200).json(about);
    });
});

// Get all About Data
app.get('/api/about-data', (req, res) => {
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
            icon: item.icon ? `${process.env.APP_API_URL}api/uploads/${path.basename(item.icon)}` : null
        }));
        console.log(about);
        // Respond with the list of about data
        res.status(200).json(about);
    });
});

app.post('/api/about-data', upload.single('icon'), (req, res) => {
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
        const imageUrl = `${process.env.APP_API_URL}api/uploads/${req.file.filename}`;

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
app.put('/api/about-data/:id', (req, res) => {
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
app.put('/api/about-data-update-status/:id', (req, res) => {
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
app.delete('/api/about-data/:id', (req, res) => {
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
app.post('/api/marketing-strategy-applications', (req, res) => {
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
app.get('/api/marketing-strategy-applications', (req, res) => {
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
app.get('/api/marketing-strategy-applications/:id', (req, res) => {
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
app.put('/api/marketing-strategy-applications/:id', (req, res) => {
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
app.delete('/api/marketing-strategy-applications/:id', (req, res) => {
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



async function sendWelcomeEmail(clientName, clientEmail) {
    const mailOptions = {
        from: `"Adconnect Team" <${process.env.EMAIL_USER}>`, // Sender email
        to: clientEmail, // Recipient email
        subject: 'Welcome to Adconnect – Your Partner in Real Estate Marketing Success 🎉',
        html: `
           <head>
<meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Welcome to AdConnect</title>
</head>
<body style="margin:0;padding:0;background:#0e0e0e;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0e0e0e;padding:40px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">
 
  <!-- Logo -->
  <tr><td style="background:#1a1917;border-radius:16px 16px 0 0;padding:28px 40px;border-bottom:1px solid #2a2826;text-align:center;">
    <img src="https://adconnect.co.ke/resources/logo.png" alt="AdConnect" width="130" style="display:block;margin:0 auto;border-radius:8px;"/>
  </td></tr>
 
  <!-- Hero -->
  <tr><td style="background:linear-gradient(135deg,#F65730,#c43d1a,#1a1917);padding:44px 40px 48px;text-align:center;">
    <div style="font-size:42px;margin-bottom:14px;">🎉</div>
    <h1 style="margin:0 0 10px;font-size:30px;font-weight:900;color:#fff;letter-spacing:-0.5px;line-height:1.15;">Welcome to AdConnect!</h1>
    <p style="margin:0;font-size:15px;color:rgba(255,255,255,.82);line-height:1.65;">You've just taken the first step towards transforming your real estate marketing.</p>
  </td></tr>
 
  <!-- Body -->
  <tr><td style="background:#1a1917;padding:36px 40px 32px;">
    <p style="margin:0 0 18px;font-size:15px;color:#B8B4B0;line-height:1.8;">Hello <strong style="color:#fff;">${clientName}</strong>,</p>
    <p style="margin:0 0 18px;font-size:15px;color:#B8B4B0;line-height:1.8;">
      I'm <strong style="color:#F65730;">Misgina Fitwi</strong>, and on behalf of the entire AdConnect team — welcome aboard! We're genuinely excited to partner with you and help your real estate business thrive in the digital space.
    </p>
    <p style="margin:0 0 28px;font-size:15px;color:#B8B4B0;line-height:1.8;">
      Our mission is straightforward: help real estate companies like yours generate high-quality leads, reduce ad costs, and close more deals through powerful, data-driven campaigns.
    </p>
 
    <!-- Feature cards -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
      <tr><td style="background:#252320;border-radius:12px;padding:24px;border:1px solid #3d3b39;">
        <p style="margin:0 0 18px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#F65730;">What you can expect</p>
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td width="46" valign="top" style="padding-right:14px;padding-bottom:18px;">
              <div style="width:38px;height:38px;background:rgba(246,87,48,.12);border:1px solid rgba(246,87,48,.3);border-radius:9px;text-align:center;line-height:38px;font-size:17px;">📣</div>
            </td>
            <td valign="top" style="padding-bottom:18px;border-bottom:1px solid #2a2826;">
              <p style="margin:0 0 3px;font-size:14px;font-weight:700;color:#fff;">Targeted Advertising That Converts</p>
              <p style="margin:0;font-size:13px;color:#7a7874;line-height:1.6;">High-ROI campaigns on Facebook, Instagram, TikTok, and Google — built specifically for real estate audiences.</p>
            </td>
          </tr>
          <tr>
            <td width="46" valign="top" style="padding-right:14px;padding-top:16px;padding-bottom:18px;">
              <div style="width:38px;height:38px;background:rgba(74,188,79,.12);border:1px solid rgba(74,188,79,.3);border-radius:9px;text-align:center;line-height:38px;font-size:17px;">🔧</div>
            </td>
            <td valign="top" style="padding-top:16px;padding-bottom:18px;border-bottom:1px solid #2a2826;">
              <p style="margin:0 0 3px;font-size:14px;font-weight:700;color:#fff;">Expert Support, Always Available</p>
              <p style="margin:0;font-size:13px;color:#7a7874;line-height:1.6;">Our experienced developers, content creators, and marketing specialists are in your corner every step of the way.</p>
            </td>
          </tr>
          <tr>
            <td width="46" valign="top" style="padding-right:14px;padding-top:16px;">
              <div style="width:38px;height:38px;background:rgba(52,152,219,.12);border:1px solid rgba(52,152,219,.3);border-radius:9px;text-align:center;line-height:38px;font-size:17px;">📈</div>
            </td>
            <td valign="top" style="padding-top:16px;">
              <p style="margin:0 0 3px;font-size:14px;font-weight:700;color:#fff;">Performance Tracking & Insights</p>
              <p style="margin:0;font-size:13px;color:#7a7874;line-height:1.6;">Regular analytics reports and strategy calls to continuously optimize your campaigns for maximum ROI.</p>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
 
    <p style="margin:0 0 28px;font-size:15px;color:#B8B4B0;line-height:1.8;">We're here to take the complexity out of digital marketing so you can focus on what you do best — building your real estate business.</p>
 
    <!-- CTA Button -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;">
      <tr><td align="center">
        <a href="https://adconnect.co.ke/?appointment-booking=true" style="display:inline-block;padding:14px 36px;background:#F65730;color:#fff;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;letter-spacing:0.3px;">
          Book Your Free Consultation →
        </a>
      </td></tr>
    </table>
 
    <p style="margin:0 0 4px;font-size:15px;color:#B8B4B0;">Looking forward to helping you grow!</p>
    <p style="margin:4px 0 2px;font-size:15px;font-weight:700;color:#fff;">Misgina Fitwi</p>
    <p style="margin:0;font-size:13px;color:#7a7874;">
      <a href="https://www.adconnect.co.ke" style="color:#4ABC4F;text-decoration:none;">AdConnect Team</a> &nbsp;·&nbsp; <a href="tel:+254790064130" style="color:#7a7874;text-decoration:none;">+254 790 064 130</a>
    </p>
  </td></tr>
 
  <!-- Footer -->
  <tr><td style="background:#111110;border-radius:0 0 16px 16px;padding:20px 40px;border-top:1px solid #2a2826;text-align:center;">
    <p style="margin:0 0 8px;font-size:11px;color:#555;line-height:1.6;">You're receiving this because you signed up at <a href="https://adconnect.co.ke" style="color:#4ABC4F;text-decoration:none;">adconnect.co.ke</a></p>
    <p style="margin:0;font-size:11px;color:#444;">
      © 2025 AdConnect · Nairobi, Kenya &nbsp;·&nbsp;
      <a href="https://adconnect.co.ke/unsubscribe.html" style="color:#F65730;text-decoration:none;">Unsubscribe</a> &nbsp;·&nbsp;
      <a href="https://adconnect.co.ke/privacy.html" style="color:#555;text-decoration:none;">Privacy Policy</a>
    </p>
  </td></tr>
 
</table>
</td></tr>
</table>
</body>
      `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Welcome email sent successfully!');
    } catch (error) {
        console.error('Error sending welcome email:', error);
        throw error;
    }
}

/**
 * Send a welcome email to the client
 * @param {string} clientName - Name of the client
 * @param {string} clientEmail - Email of the client
 */
async function sendBookingEmail(clientName, clientEmail, meetingDate, meetingTime, meetingLocation, meetingAgenda, meetingLink) {
    const mailOptions = {
        from: `"Adconnect Team" <${process.env.EMAIL_USER}>`, // Sender email
        to: clientEmail, // Recipient email
        subject: 'Meeting Confirmation: Consultation with Adconnect Team',
        html: `
           <meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>Booking Confirmed — AdConnect</title></head>
<body style="margin:0;padding:0;background:#0e0e0e;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0e0e0e;padding:40px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">
 
  <!-- Logo -->
  <tr><td style="background:#1a1917;border-radius:16px 16px 0 0;padding:28px 40px;border-bottom:1px solid #2a2826;text-align:center;">
    <img src="https://adconnect.co.ke/resources/logo.png" alt="AdConnect" width="130" style="display:block;margin:0 auto;border-radius:8px;"/>
  </td></tr>
 
  <!-- Hero — green accent for confirmation -->
  <tr><td style="background:linear-gradient(135deg,#1a4a1c,#2d7a30,#1a1917);padding:40px 40px 44px;text-align:center;">
    <div style="width:64px;height:64px;background:rgba(74,188,79,.2);border:2px solid #4ABC4F;border-radius:50%;text-align:center;line-height:64px;font-size:28px;margin:0 auto 16px;">✅</div>
    <h1 style="margin:0 0 10px;font-size:26px;font-weight:900;color:#fff;letter-spacing:-0.3px;">Booking Confirmed!</h1>
    <p style="margin:0;font-size:15px;color:rgba(255,255,255,.8);line-height:1.65;">Your consultation with AdConnect is all set.</p>
  </td></tr>
 
  <!-- Body -->
  <tr><td style="background:#1a1917;padding:36px 40px 32px;">
    <p style="margin:0 0 20px;font-size:15px;color:#B8B4B0;line-height:1.8;">Dear <strong style="color:#fff;">${clientName}</strong>,</p>
    <p style="margin:0 0 24px;font-size:15px;color:#B8B4B0;line-height:1.8;">
      We're looking forward to meeting with you! Your consultation session has been confirmed with the following details:
    </p>
 
    <!-- Booking Details Card -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
      <tr><td style="background:#252320;border-radius:12px;padding:24px 28px;border:1px solid #3d3b39;">
        <p style="margin:0 0 16px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#4ABC4F;">Meeting Details</p>
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #2a2826;color:#7a7874;font-size:13px;width:120px;">📅 Date</td>
            <td style="padding:10px 0;border-bottom:1px solid #2a2826;font-size:14px;font-weight:600;color:#fff;">${meetingDate}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #2a2826;color:#7a7874;font-size:13px;">🕐 Time</td>
            <td style="padding:10px 0;border-bottom:1px solid #2a2826;font-size:14px;font-weight:600;color:#fff;">${meetingTime} EAT</td>
          </tr>
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #2a2826;color:#7a7874;font-size:13px;">📍 Location</td>
            <td style="padding:10px 0;border-bottom:1px solid #2a2826;font-size:14px;color:#B8B4B0;">${meetingLocation}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;color:#7a7874;font-size:13px;vertical-align:top;">💬 Agenda</td>
            <td style="padding:10px 0;font-size:14px;color:#B8B4B0;line-height:1.6;">${meetingAgenda}</td>
          </tr>
        </table>
      </td></tr>
    </table>
 
    <!-- Join Button -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
      <tr><td align="center">
        <a href="${meetingLink}" style="display:inline-block;padding:14px 40px;background:#F65730;color:#fff;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;">
          🎥 Join Meeting
        </a>
      </td></tr>
    </table>
 
    <!-- Preparation tip -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
      <tr><td style="background:#1e1c1a;border-radius:10px;border-left:3px solid #F65730;padding:16px 20px;">
        <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#F65730;">How to Prepare</p>
        <p style="margin:0;font-size:13px;color:#7a7874;line-height:1.6;">Feel free to bring any questions, current ad performance data, or examples of your current marketing efforts. The more we know upfront, the more value we can deliver in your session.</p>
      </td></tr>
    </table>
 
    <p style="margin:0 0 20px;font-size:14px;color:#7a7874;line-height:1.8;">Need to reschedule? Reply to this email or call us at <a href="tel:+254790064130" style="color:#F65730;text-decoration:none;">+254 790 064 130</a>.</p>
    <p style="margin:0 0 4px;font-size:15px;color:#B8B4B0;">Looking forward to connecting with you,</p>
    <p style="margin:4px 0 2px;font-size:15px;font-weight:700;color:#fff;">Misgina Fitwi</p>
    <p style="margin:0;font-size:13px;color:#7a7874;"><a href="https://adconnect.co.ke" style="color:#4ABC4F;text-decoration:none;">AdConnect Team</a> &nbsp;·&nbsp; <a href="tel:+254790064130" style="color:#7a7874;text-decoration:none;">+254 790 064 130</a></p>
  </td></tr>
 
  <!-- Footer -->
  <tr><td style="background:#111110;border-radius:0 0 16px 16px;padding:20px 40px;border-top:1px solid #2a2826;text-align:center;">
    <p style="margin:0;font-size:11px;color:#444;">© 2025 AdConnect · Nairobi, Kenya &nbsp;·&nbsp; <a href="https://adconnect.co.ke/privacy.html" style="color:#555;text-decoration:none;">Privacy Policy</a></p>
  </td></tr>
 
</table>
</td></tr>
</table>
</body>
      `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Booking email sent successfully!');
    } catch (error) {
        console.error('Error sending booking email:', error);
        throw error;
    }
}

/**]
 * Function for sending follow-up emails
 */
async function sendSubSequentEmail(to, subject, body) {
    const mailOptions = {
        from: `"Adconnect Team" <${process.env.EMAIL_USER}>`, // Sender email
        to: `${to}`, // Recipient email
        subject: `${subject}`,
        html: `${body}`,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Follow-Up Email sent successfully!');
    } catch (error) {
        console.error('Error sending follow-up email:', error);
        throw error;
    }
}

/**
 * Send a Reschedule email to the client
 * @param {string} clientName - Name of the client
 * @param {string} clientEmail - Email of the client
 */
async function sendRescheduleEmail(clientName, clientEmail, meetingDate, meetingTime, meetingLocation, meetingAgenda, meetingLink) {
    const mailOptions = {
        from: `"Adconnect Team" <${process.env.EMAIL_USER}>`, // Sender email
        to: clientEmail, // Recipient email
        subject: 'Meeting Reschedule: Consultation with Adconnect',
        html: `
        <meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>Meeting Rescheduled — AdConnect</title></head>
<body style="margin:0;padding:0;background:#0e0e0e;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0e0e0e;padding:40px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">
 
  <tr><td style="background:#1a1917;border-radius:16px 16px 0 0;padding:28px 40px;border-bottom:1px solid #2a2826;text-align:center;">
    <img src="https://adconnect.co.ke/resources/logo.png" alt="AdConnect" width="130" style="display:block;margin:0 auto;border-radius:8px;"/>
  </td></tr>
 
  <!-- Hero — orange/amber for change notification -->
  <tr><td style="background:linear-gradient(135deg,#4a3000,#c87d00,#1a1917);padding:40px 40px 44px;text-align:center;">
    <div style="width:64px;height:64px;background:rgba(245,166,35,.15);border:2px solid #F5A623;border-radius:50%;text-align:center;line-height:64px;font-size:26px;margin:0 auto 16px;">📅</div>
    <h1 style="margin:0 0 10px;font-size:26px;font-weight:900;color:#fff;letter-spacing:-0.3px;">Meeting Rescheduled</h1>
    <p style="margin:0;font-size:15px;color:rgba(255,255,255,.8);line-height:1.65;">Your consultation has been moved to a new time.</p>
  </td></tr>
 
  <tr><td style="background:#1a1917;padding:36px 40px 32px;">
    <p style="margin:0 0 20px;font-size:15px;color:#B8B4B0;line-height:1.8;">Dear <strong style="color:#fff;">${clientName}</strong>,</p>
    <p style="margin:0 0 24px;font-size:15px;color:#B8B4B0;line-height:1.8;">
      We wanted to inform you that your upcoming consultation meeting with AdConnect has been rescheduled. Please take note of the updated details below:
    </p>
 
    <!-- Updated Details -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
      <tr><td style="background:#252320;border-radius:12px;padding:24px 28px;border:1px solid #3d3b39;">
        <p style="margin:0 0 16px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#F5A623;">Updated Meeting Details</p>
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr><td style="padding:10px 0;border-bottom:1px solid #2a2826;color:#7a7874;font-size:13px;width:120px;">📅 New Date</td><td style="padding:10px 0;border-bottom:1px solid #2a2826;font-size:14px;font-weight:600;color:#fff;">${meetingDate}</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #2a2826;color:#7a7874;font-size:13px;">🕐 New Time</td><td style="padding:10px 0;border-bottom:1px solid #2a2826;font-size:14px;font-weight:600;color:#fff;">${meetingTime} EAT</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #2a2826;color:#7a7874;font-size:13px;">📍 Location</td><td style="padding:10px 0;border-bottom:1px solid #2a2826;font-size:14px;color:#B8B4B0;">${meetingLocation}</td></tr>
          <tr><td style="padding:10px 0;color:#7a7874;font-size:13px;vertical-align:top;">💬 Agenda</td><td style="padding:10px 0;font-size:14px;color:#B8B4B0;line-height:1.6;">${meetingAgenda}</td></tr>
        </table>
      </td></tr>
    </table>
 
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
      <tr><td align="center">
        <a href="${meetingLink}" style="display:inline-block;padding:14px 40px;background:#F65730;color:#fff;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;">
          🎥 Join Meeting
        </a>
      </td></tr>
    </table>
 
    <p style="margin:0 0 20px;font-size:14px;color:#7a7874;line-height:1.8;">
      We apologize for any inconvenience this may cause. If you have any questions or need to reschedule again, don't hesitate to reach out.
    </p>
    <p style="margin:0 0 4px;font-size:15px;color:#B8B4B0;">Looking forward to connecting with you,</p>
    <p style="margin:4px 0 2px;font-size:15px;font-weight:700;color:#fff;">Misgina Fitwi</p>
    <p style="margin:0;font-size:13px;color:#7a7874;"><a href="https://adconnect.co.ke" style="color:#4ABC4F;text-decoration:none;">AdConnect Team</a> &nbsp;·&nbsp; <a href="tel:+254790064130" style="color:#7a7874;text-decoration:none;">+254 790 064 130</a></p>
  </td></tr>
 
  <tr><td style="background:#111110;border-radius:0 0 16px 16px;padding:20px 40px;border-top:1px solid #2a2826;text-align:center;">
    <p style="margin:0;font-size:11px;color:#444;">© 2025 AdConnect · Nairobi, Kenya &nbsp;·&nbsp; <a href="https://adconnect.co.ke/privacy.html" style="color:#555;text-decoration:none;">Privacy Policy</a></p>
  </td></tr>
 
</table>
</td></tr>
</table>
</body>
`,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Reschedule email sent successfully!');
    } catch (error) {
        console.error('Error sending reschedule email:', error);
        throw error;
    }
}

/**
 * Send a Reschedule email to the client
 * @param {string} clientName - Name of the client
 * @param {string} clientEmail - Email of the client
 */
async function sendReminderEmail(clientName, clientEmail, meetingDate, meetingTime, meetingLocation, meetingAgenda, meetingLink) {
    const mailOptions = {
        from: `"Adconnect Team" <${process.env.EMAIL_USER}>`, // Sender email
        to: clientEmail, // Recipient email
        subject: 'Meeting Reminder: Consultation with Adconnect',
        html: `
        <head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Meeting Reminder — AdConnect</title>
</head>
<body style="margin:0;padding:0;background:#0e0e0e;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0e0e0e;padding:40px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

  <!-- Logo -->
  <tr><td style="background:#1a1917;border-radius:16px 16px 0 0;padding:28px 40px;border-bottom:1px solid #2a2826;text-align:center;">
    <img src="https://adconnect.co.ke/resources/logo.png" alt="AdConnect" width="130" style="display:block;margin:0 auto;border-radius:8px;"/>
  </td></tr>

  <!-- Hero — orange accent for reminder -->
  <tr><td style="background:linear-gradient(135deg,#2a1f1a,#4a2c1a,#1a1917);padding:40px 40px 44px;text-align:center;">
    <div style="width:64px;height:64px;background:rgba(246,87,48,.18);border:2px solid #F65730;border-radius:50%;text-align:center;line-height:64px;font-size:28px;margin:0 auto 16px;">🔔</div>
    <h1 style="margin:0 0 10px;font-size:26px;font-weight:900;color:#fff;letter-spacing:-0.3px;">Meeting Reminder</h1>
    <p style="margin:0;font-size:15px;color:rgba(255,255,255,.8);line-height:1.65;">Your upcoming consultation with AdConnect is approaching.</p>
  </td></tr>

  <!-- Body -->
  <tr><td style="background:#1a1917;padding:36px 40px 32px;">
    <p style="margin:0 0 20px;font-size:15px;color:#B8B4B0;line-height:1.8;">Dear <strong style="color:#fff;">${clientName}</strong>,</p>
    <p style="margin:0 0 24px;font-size:15px;color:#B8B4B0;line-height:1.8;">
      This is a friendly reminder of your upcoming consultation meeting as detailed below:
    </p>

    <!-- Meeting Details Card -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
      <tr><td style="background:#252320;border-radius:12px;padding:24px 28px;border:1px solid #3d3b39;">
        <p style="margin:0 0 16px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#F65730;">Meeting Details</p>
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #2a2826;color:#7a7874;font-size:13px;width:120px;">📅 Date</td>
            <td style="padding:10px 0;border-bottom:1px solid #2a2826;font-size:14px;font-weight:600;color:#fff;">${meetingDate}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #2a2826;color:#7a7874;font-size:13px;">🕐 Time</td>
            <td style="padding:10px 0;border-bottom:1px solid #2a2826;font-size:14px;font-weight:600;color:#fff;">${meetingTime} EAT</td>
          </tr>
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #2a2826;color:#7a7874;font-size:13px;">📍 Location</td>
            <td style="padding:10px 0;border-bottom:1px solid #2a2826;font-size:14px;color:#B8B4B0;">${meetingLocation}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;color:#7a7874;font-size:13px;vertical-align:top;">💬 Agenda</td>
            <td style="padding:10px 0;font-size:14px;color:#B8B4B0;line-height:1.6;">${meetingAgenda}</td>
          </tr>
        </table>
      </td></tr>
    </table>

    <!-- CTA Button -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
      <tr><td align="center">
        <a href="${meetingLink}" style="display:inline-block;padding:14px 40px;background:#F65730;color:#fff;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;">
          🎥 Proceed to Meeting
        </a>
      </td></tr>
    </table>

    <!-- Tip -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
      <tr><td style="background:#1e1c1a;border-radius:10px;border-left:3px solid #4ABC4F;padding:16px 20px;">
        <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#4ABC4F;">Before You Join</p>
        <p style="margin:0;font-size:13px;color:#7a7874;line-height:1.6;">Please ensure you have a stable internet connection and any relevant materials ready ahead of time. We look forward to a productive session.</p>
      </td></tr>
    </table>

    <p style="margin:0 0 20px;font-size:14px;color:#7a7874;line-height:1.8;">Need to reschedule? Reply to this email or call us at <a href="tel:+254790064130" style="color:#F65730;text-decoration:none;">+254 790 064 130</a>.</p>
    <p style="margin:0 0 4px;font-size:15px;color:#B8B4B0;">Looking forward to connecting with you,</p>
    <p style="margin:4px 0 2px;font-size:15px;font-weight:700;color:#fff;">Misgina Fitwi</p>
    <p style="margin:0;font-size:13px;color:#7a7874;"><a href="https://adconnect.co.ke" style="color:#4ABC4F;text-decoration:none;">AdConnect Team</a> &nbsp;·&nbsp; <a href="tel:+254790064130" style="color:#7a7874;text-decoration:none;">+254 790 064 130</a></p>
  </td></tr>

  <!-- Footer -->
  <tr><td style="background:#111110;border-radius:0 0 16px 16px;padding:20px 40px;border-top:1px solid #2a2826;text-align:center;">
    <p style="margin:0;font-size:11px;color:#444;">© 2025 AdConnect · Nairobi, Kenya &nbsp;·&nbsp; <a href="https://adconnect.co.ke/privacy.html" style="color:#555;text-decoration:none;">Privacy Policy</a> &nbsp;·&nbsp; <a href="https://adconnect.co.ke/unsubscribe" style="color:#555;text-decoration:none;">Unsubscribe</a></p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
`,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Reminder email sent successfully!');
    } catch (error) {
        console.error('Error sending reminder email:', error);
        throw error;
    }
}

/**
 * Send a email to admin
 * @param {string} clientName - Name of the client
 * @param {string} clientEmail - Email of the client
 */
async function sendBookingReactionEmail(clientName, meetingDate, meetingTime, meetingLocation, meetingAgenda, meetingLink) {
    const mailOptions = {
        from: `"Adconnect Team" <${process.env.EMAIL_USER}>`, // Sender email
        to: 'info@adconnect.co.ke', // Recipient email
        subject: `New Appointment - ${clientName}`,
        html: `
           <head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>Booking Confirmed — AdConnect</title></head>
<body style="margin:0;padding:0;background:#0e0e0e;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0e0e0e;padding:40px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">
 
  <!-- Logo -->
  <tr><td style="background:#1a1917;border-radius:16px 16px 0 0;padding:28px 40px;border-bottom:1px solid #2a2826;text-align:center;">
    <img src="https://adconnect.co.ke/resources/logo.png" alt="AdConnect" width="130" style="display:block;margin:0 auto;border-radius:8px;"/>
  </td></tr>
 
  <!-- Hero — green accent for confirmation -->
  <tr><td style="background:linear-gradient(135deg,#1a4a1c,#2d7a30,#1a1917);padding:40px 40px 44px;text-align:center;">
    <div style="width:64px;height:64px;background:rgba(74,188,79,.2);border:2px solid #4ABC4F;border-radius:50%;text-align:center;line-height:64px;font-size:28px;margin:0 auto 16px;">✅</div>
    <h1 style="margin:0 0 10px;font-size:26px;font-weight:900;color:#fff;letter-spacing:-0.3px;">Booking Confirmed!</h1>
    <p style="margin:0;font-size:15px;color:rgba(255,255,255,.8);line-height:1.65;">Your consultation with AdConnect is all set.</p>
  </td></tr>
 
  <!-- Body -->
  <tr><td style="background:#1a1917;padding:36px 40px 32px;">
    <p style="margin:0 0 20px;font-size:15px;color:#B8B4B0;line-height:1.8;">Dear <strong style="color:#fff;">${clientName}</strong>,</p>
    <p style="margin:0 0 24px;font-size:15px;color:#B8B4B0;line-height:1.8;">
      We're looking forward to meeting with you! Your consultation session has been confirmed with the following details:
    </p>
 
    <!-- Booking Details Card -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
      <tr><td style="background:#252320;border-radius:12px;padding:24px 28px;border:1px solid #3d3b39;">
        <p style="margin:0 0 16px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#4ABC4F;">Meeting Details</p>
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #2a2826;color:#7a7874;font-size:13px;width:120px;">📅 Date</td>
            <td style="padding:10px 0;border-bottom:1px solid #2a2826;font-size:14px;font-weight:600;color:#fff;">${meetingDate}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #2a2826;color:#7a7874;font-size:13px;">🕐 Time</td>
            <td style="padding:10px 0;border-bottom:1px solid #2a2826;font-size:14px;font-weight:600;color:#fff;">${meetingTime} EAT</td>
          </tr>
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #2a2826;color:#7a7874;font-size:13px;">📍 Location</td>
            <td style="padding:10px 0;border-bottom:1px solid #2a2826;font-size:14px;color:#B8B4B0;">${meetingLocation}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;color:#7a7874;font-size:13px;vertical-align:top;">💬 Agenda</td>
            <td style="padding:10px 0;font-size:14px;color:#B8B4B0;line-height:1.6;">${meetingAgenda}</td>
          </tr>
        </table>
      </td></tr>
    </table>
 
    <!-- Join Button -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
      <tr><td align="center">
        <a href="${meetingLink}" style="display:inline-block;padding:14px 40px;background:#F65730;color:#fff;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;">
          🎥 Join Meeting
        </a>
      </td></tr>
    </table>
 
    <!-- Preparation tip -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
      <tr><td style="background:#1e1c1a;border-radius:10px;border-left:3px solid #F65730;padding:16px 20px;">
        <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#F65730;">How to Prepare</p>
        <p style="margin:0;font-size:13px;color:#7a7874;line-height:1.6;">Feel free to bring any questions, current ad performance data, or examples of your current marketing efforts. The more we know upfront, the more value we can deliver in your session.</p>
      </td></tr>
    </table>
 
    <p style="margin:0 0 20px;font-size:14px;color:#7a7874;line-height:1.8;">Need to reschedule? Reply to this email or call us at <a href="tel:+254790064130" style="color:#F65730;text-decoration:none;">+254 790 064 130</a>.</p>
    <p style="margin:0 0 4px;font-size:15px;color:#B8B4B0;">Looking forward to connecting with you,</p>
    <p style="margin:4px 0 2px;font-size:15px;font-weight:700;color:#fff;">Misgina Fitwi</p>
    <p style="margin:0;font-size:13px;color:#7a7874;"><a href="https://adconnect.co.ke" style="color:#4ABC4F;text-decoration:none;">AdConnect Team</a> &nbsp;·&nbsp; <a href="tel:+254790064130" style="color:#7a7874;text-decoration:none;">+254 790 064 130</a></p>
  </td></tr>
 
  <!-- Footer -->
  <tr><td style="background:#111110;border-radius:0 0 16px 16px;padding:20px 40px;border-top:1px solid #2a2826;text-align:center;">
    <p style="margin:0;font-size:11px;color:#444;">© 2025 AdConnect · Nairobi, Kenya &nbsp;·&nbsp; <a href="https://adconnect.co.ke/privacy.html" style="color:#555;text-decoration:none;">Privacy Policy</a></p>
  </td></tr>
 
</table>
</td></tr>
</table>
</body>
      `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Booking email sent successfully!');
    } catch (error) {
        console.error('Error sending booking email:', error);
        throw error;
    }
}

app.post('/api/send-booking-reaction-email', async (req, res) => {
    const { clientName,  meetingDate, meetingTime, meetingLocation, meetingAgenda, meetingLink } = req.body;

    if (!clientName || !meetingDate || !meetingTime || !meetingLocation || !meetingAgenda || !meetingLink) {
        console.log('All fields are required');
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        console.log(req.body);
        await sendBookingReactionEmail(clientName, meetingDate, meetingTime, meetingLocation, meetingAgenda, meetingLink);
        console.log('Booking email sent successfully');
        res.status(200).json({ message: 'Reaction email sent successfully' });
    } catch (error) {
        console.error('Failed to send email:', error);
        res.status(500).json({ error: 'Failed to send email' });
    }
});

app.post('/api/send-booking-email', async (req, res) => {
    const { clientName, clientEmail, meetingDate, meetingTime, meetingLocation, meetingAgenda, meetingLink } = req.body;

    if (!clientName || !clientEmail || !meetingDate || !meetingTime || !meetingLocation || !meetingAgenda || !meetingLink) {
        console.log('All fields are required');
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        console.log(req.body);
        await sendBookingEmail(clientName, clientEmail, meetingDate, meetingTime, meetingLocation, meetingAgenda, meetingLink);
        console.log('Booking email sent successfully');
        res.status(200).json({ message: 'Booking email sent successfully' });
    } catch (error) {
        console.error('Failed to send email:', error);
        res.status(500).json({ error: 'Failed to send email' });
    }
});

// Send a welcome email to the client
app.post('/api/send-welcome-email', async (req, res) => {
    const { clientName, clientEmail } = req.body;

    if (!clientName || !clientEmail) {
        console.log('Client name and email are required');
        return res.status(400).json({ error: 'Client name and email are required' });
    }

    try {
        console.log(req.body);
        await sendWelcomeEmail(clientName, clientEmail);
        console.log('Welcome email sent successfully');
        res.status(200).json({ message: 'Welcome email sent successfully' });
    } catch (error) {
        console.error('Failed to send email:', error);
        res.status(500).json({ error: 'Failed to send email' });
    }
});

// Configure the Nodemailer transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST, // Your mail server domain
    port: process.env.SMTP_PORT, // Typically 587 for TLS or 465 for SSL
    secure: true, // True for SSL, false for TLS
    auth: {
        user: process.env.EMAIL_USER, // email from the .env file
        pass: process.env.EMAIL_PASS, // email password or app password
    },
});

/// Load your OAuth2 credentials
//const credentialsPath = path.join(__dirname, 'credentials.json');
//const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));

// Initialize OAuth2 client
//const { client_id, client_secret, redirect_uris } = credentials.web;
const oAuth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI);

// Token file path (to store access and refresh tokens)
const tokenPath = path.join(__dirname, 'token.json');

// Get and store the token (for one-time authorization)
async function getAndStoreToken() {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline', // Ensures a refresh token is returned
        scope: ['https://www.googleapis.com/auth/calendar'], // The required scope for calendar access
    });

    console.log('Authorize this app by visiting this URL:', authUrl);

    // After visiting the URL, paste the authorization code here
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    rl.question('Enter the code from the page: ', async (code) => {
        rl.close();

        try {
            const { tokens } = await oAuth2Client.getToken(code);
            oAuth2Client.setCredentials(tokens);

            // Save the token to a file for later use
            fs.writeFileSync(tokenPath, JSON.stringify(tokens));
            console.log('Token stored to', tokenPath);
        } catch (err) {
            console.error('Error retrieving access token', err);
        }
    });
}

// Set credentials (load tokens from file)
function setCredentials() {
    if (fs.existsSync(tokenPath)) {
        const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
        oAuth2Client.setCredentials(token);
    } else {
        console.error('No token file found. Run `getAndStoreToken` to authorize the app.');
    }
}

// Refresh token if expired
async function refreshToken() {
    const token = oAuth2Client.credentials;
    if (token && token.refresh_token) {
        try {
            const { credentials } = await oAuth2Client.refreshAccessToken();
            oAuth2Client.setCredentials(credentials);
            fs.writeFileSync(tokenPath, JSON.stringify(credentials)); // Save refreshed token
            console.log('Token refreshed');
        } catch (error) {
            console.error('Error refreshing token', error);
        }
    } else {
        console.error('No refresh token available');
    }
}

// Function to convert "2025-01-20 10:00:00" into the ISO 8601 format "2025-01-20T10:00:00-07:00"
function convertToISO8601(dateTimeString) {
    const [date, time] = dateTimeString.split(' ');  // Split the date and time
    const formattedDateTime = new Date(`${date}T${time}+03:00`);  // Append time zone offset
    return formattedDateTime.toISOString();  // Convert to ISO format
}

// Create a Google Meet Link (via Calendar Event)
async function createMeetLink(summary, startDateTime, endDateTime) {
    const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

    try {
        const event = {
            summary: summary || 'Adconnect Online Consultation', // Replace with your event summary
            start: {
                dateTime: convertToISO8601(startDateTime), // Replace with your time
                timeZone: 'Africa/Nairobi',
            },
            end: {
                dateTime: convertToISO8601(endDateTime), // Replace with your time
                timeZone: 'Africa/Nairobi',
            },
            conferenceData: {
                createRequest: {
                    requestId: 'random-string-or-id',
                    conferenceSolutionKey: { type: 'hangoutsMeet' },
                },
            },
        };

        const response = await calendar.events.insert({
            calendarId: 'primary',
            resource: event,
            conferenceDataVersion: 1,
        });

        const hangoutLink =
            response.data.conferenceData?.entryPoints?.find(
                (point) => point.entryPointType === 'video'
            )?.uri;

        if (hangoutLink) {
            console.log('Google Meet Link:', hangoutLink);
        } else {
            console.log('No Google Meet link generated.');
        }

        return hangoutLink || null;
    } catch (error) {
        console.error('Error creating Google Meet event:', error.response?.data || error.message);
    }
}

// API Endpoint to create Google Meet link
app.post('/api/create-meet-link', async (req, res) => {
    console.log('Request Body:', req.body);  // Log the request body
    const { eventTitle, startDateTime, endDateTime } = req.body;

    if (!eventTitle || !startDateTime || !endDateTime) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    try {
        const meetLink = await createMeetLink(eventTitle, startDateTime, endDateTime);
        if (meetLink) {
            return res.json({ meetLink });
        } else {
            return res.status(500).json({ error: 'Failed to create Google Meet link' });
        }
    } catch (error) {
        console.error('Error in creating Google Meet link:', error.message);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Example usage
(async () => {
    try {
        if (!fs.existsSync(tokenPath)) {
            await getAndStoreToken(); // Authorize the app and store the token
        } else {
            setCredentials(); // Load the token and set it in the OAuth2 client

            // Check if the token is expired, and refresh it if necessary
            const token = oAuth2Client.credentials;
            if (token.expiry_date && token.expiry_date < Date.now()) {
                console.log('Token expired, refreshing...');
                await refreshToken(); // Refresh the token if expired
            }

            const meetLink = await createMeetLink('Adconnect Online Consultation', '2025-01-20 10:00:00', '2025-01-20 10:30:00');
            console.log('Generated Google Meet link:', meetLink);
        }
    } catch (error) {
        console.error('Error:', error);
    }
})();

// ═══════════════ SITE SETTINGS ══════════════════════════════

/**
 * GET /api/site-settings/:section
 * Retrieve settings for a specific section (homepage, about, services…)
 */
app.get('/api/site-settings/:section', (req, res) => {
    const { section } = req.params;
    db.query(
        'SELECT setting_key, setting_value FROM site_settings WHERE section = ?',
        [section],
        (err, rows) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            // Convert rows to key-value object
            const data = {};
            rows.forEach(r => { data[r.setting_key] = r.setting_value; });
            res.status(200).json(data);
        }
    );
});

/**
 * PUT /api/site-settings/:section
 * Upsert multiple settings for a section.
 * Body: { key1: 'value1', key2: 'value2', … }
 */
app.put('/api/site-settings/:section', (req, res) => {
    const { section } = req.params;
    const settings    = req.body;

    if (!settings || !Object.keys(settings).length) {
        return res.status(400).json({ error: 'No settings provided' });
    }

    const queries = Object.entries(settings).map(([key, value]) => {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO site_settings (section, setting_key, setting_value, updated_at)
                VALUES (?, ?, ?, NOW())
                ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()
            `;
            db.query(sql, [section, key, value], (err) => {
                if (err) reject(err); else resolve();
            });
        });
    });

    Promise.all(queries)
        .then(() => res.status(200).json({ message: 'Settings updated successfully' }))
        .catch(err => { console.error(err); res.status(500).json({ error: 'Database error' }); });
});

// ═══════════════ TESTIMONIALS ═══════════════════════════════

/**
 * GET /api/testimonials
 * All active testimonials
 */
app.get('/api/testimonials', (req, res) => {
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
app.get('/api/testimonials/:id', (req, res) => {
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
app.post('/api/testimonials', testimonialUpload.single('photo'), (req, res) => {
    const { name, company, text, stars, status, display_order } = req.body;
    if (!name || !text) return res.status(400).json({ error: 'Name and testimonial text are required' });

    const photo = req.file ? req.file.path : null;
    const photoUrl = photo ? `${process.env.APP_API_URL}api/uploads/${require('path').basename(photo)}` : null;
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
app.put('/api/testimonials/:id', (req, res) => {
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
app.delete('/api/testimonials/:id', (req, res) => {
    db.query('DELETE FROM testimonials WHERE id=?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.status(200).json({ message: 'Deleted' });
    });
});

app.post('/api/test-server', (req, res) => {
    res.status(200).json({ message: 'Test route works!' });
});

// ── CV Upload storage ────────────────────────────────────────
const cvStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, 'uploads', 'cvs');
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
app.use('/api/cvs', express.static(path.join(__dirname, 'uploads', 'cvs')));

// ═══════════════ JOB LISTINGS ════════════════════════════════

/** GET /api/careers  — public, returns OPEN jobs */
app.get('/api/careers', (req, res) => {
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
app.get('/api/careers/:id', (req, res) => {
    db.query('SELECT * FROM career_listings WHERE id = ?', [req.params.id], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!rows.length) return res.status(404).json({ error: 'Job not found' });
        const r = rows[0];
        res.status(200).json({ ...r, tags: tryParseJSON(r.tags, []) });
    });
});

/** POST /api/careers  — admin creates a job */
app.post('/api/careers', (req, res) => {
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
app.put('/api/careers/:id', (req, res) => {
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
app.delete('/api/careers/:id', (req, res) => {
    db.query('DELETE FROM career_listings WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.status(200).json({ message: 'Job deleted' });
    });
});

// ═══════════════ CAREER APPLICATIONS ════════════════════════

/** POST /api/career-applications  — public, with CV upload */
app.post('/api/career-applications', cvUpload.single('cv'), (req, res) => {
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
              current_role, experience, motivation, portfolio, cv_filename, status, created_at)
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
app.get('/api/career-applications', (req, res) => {
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
app.get('/api/career-applications/:id', (req, res) => {
    db.query('SELECT * FROM career_applications WHERE id = ?', [req.params.id], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!rows.length) return res.status(404).json({ error: 'Application not found' });
        // Build CV download URL
        const app = rows[0];
        app.cv_url = app.cv_filename
            ? `${process.env.APP_API_URL}api/cvs/${app.cv_filename}`
            : null;
        res.status(200).json(app);
    });
});

/** PUT /api/career-applications/:id/status  — update status */
app.put('/api/career-applications/:id/status', (req, res) => {
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
app.put('/api/career-applications/:id/notes', (req, res) => {
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
app.delete('/api/career-applications/:id', (req, res) => {
    db.query('SELECT cv_filename FROM career_applications WHERE id=?', [req.params.id], (err, rows) => {
        if (!err && rows.length && rows[0].cv_filename) {
            const cvPath = path.join(__dirname, 'uploads', 'cvs', rows[0].cv_filename);
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
app.post('/api/career-applications/:id/invite', async (req, res) => {
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
    await transporter.sendMail({
        from:    `"AdConnect Careers" <${process.env.EMAIL_USER}>`,
        to:      process.env.ADMIN_EMAIL || 'info@adconnect.co.ke',
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
                <a href="${process.env.APP_BASE_URL}/admin.html" style="display:inline-block;padding:12px 28px;background:#F65730;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;">View in Admin Panel</a>
              </div>
            </div>
          </div>
        </body>`,
    });
}

async function sendApplicationAcknowledgement(firstName, email, jobTitle) {
    await transporter.sendMail({
        from:    `"AdConnect Careers" <${process.env.EMAIL_USER}>`,
        to:      email,
        subject: `Application Received — ${jobTitle} at AdConnect`,
        html: `
        <body style="font-family:Arial,sans-serif;background:#1A1917;color:#F4F1EE;padding:20px;">
          <div style="max-width:560px;margin:0 auto;background:#252320;border:1px solid #3d3b39;border-radius:12px;overflow:hidden;">
            <div style="background:linear-gradient(135deg,#4d4c4b,#646464);padding:28px;text-align:center;">
              <img src="${process.env.APP_BASE_URL}/resources/logo.png" alt="AdConnect" style="height:40px;margin-bottom:16px;" />
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
              AdConnect · Nairobi, Kenya · <a href="${process.env.APP_BASE_URL}" style="color:#4ABC4F;">adconnect.co.ke</a>
            </div>
          </div>
        </body>`,
    });
}

async function sendInterviewInvitationEmail(firstName, email, jobTitle, date, time, type, link, location, notes) {
    const dateFormatted = new Date(date).toLocaleDateString('en-KE',{weekday:'long',year:'numeric',month:'long',day:'numeric'});

    await transporter.sendMail({
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
              AdConnect · <a href="${process.env.APP_BASE_URL}" style="color:#4ABC4F;">adconnect.co.ke</a> · careers@adconnect.co.ke
            </div>
          </div>
        </body>`,
    });
}

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: err.message });
});

// 404 Not Found middleware
app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
});

// ─────────────────────────────────────────────────────────────
// HELPER: replace template variables in email HTML
// ─────────────────────────────────────────────────────────────
function renderEmailTemplate(html, vars) {
  let out = html;
  Object.entries(vars).forEach(([k, v]) => {
    const re = new RegExp(`\\$\\{${k}\\}`, 'g');
    out = out.replace(re, v || '');
  });
  return out;
}
 
// ─────────────────────────────────────────────────────────────
// CHECK SUBSCRIPTION STATUS  GET /api/subscription-status
// ─────────────────────────────────────────────────────────────
app.get('/api/subscription-status', (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'Email required' });
 
  db.query(
    'SELECT id, clientSubScription FROM clients WHERE clientEmail = ?',
    [email.trim().toLowerCase()],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (!rows.length) return res.status(200).json({ status: 'NOT_FOUND' });
      const status = rows[0].clientSubScription?.trim().toUpperCase() === 'SUBSCRIBED'
        ? 'SUBSCRIBED' : 'UNSUBSCRIBED';
      res.status(200).json({ status });
    }
  );
});
 
// ─────────────────────────────────────────────────────────────
// UNSUBSCRIBE  POST /api/unsubscribe
// ─────────────────────────────────────────────────────────────
app.post('/api/unsubscribe', async (req, res) => {
  const { email, reason } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
 
  const emailLower = email.trim().toLowerCase();
 
  db.query(
    'SELECT id, clientName FROM clients WHERE clientEmail = ?',
    [emailLower],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (!rows.length) return res.status(404).json({ error: 'Email not found' });
 
      // Update subscription status
      db.query(
        `UPDATE clients SET clientSubScription = 'UNSUBSCRIBED', updated_at = ? WHERE clientEmail = ?`,
        [createdAt(), emailLower],
        (err2) => {
          if (err2) return res.status(500).json({ error: 'Database error' });
 
          // Log the unsubscribe reason
          if (reason) {
            db.query(
              `INSERT IGNORE INTO unsubscribe_log (id, email, reason, created_at) VALUES (?, ?, ?, ?)`,
              [clientID(), emailLower, reason, createdAt()],
              () => {} // non-critical
            );
          }
 
          // Pause their email sequence
          db.query(
            `UPDATE email_sequence_queue SET status = 'PAUSED' WHERE email = ? AND status = 'PENDING'`,
            [emailLower],
            () => {}
          );
 
          // Send goodbye email
          sendUnsubscribeConfirmation(rows[0].clientName || emailLower, emailLower)
            .catch(e => console.error('Unsubscribe confirmation email error:', e));
 
          console.log(`Unsubscribed: ${emailLower} | Reason: ${reason || 'not specified'}`);
          res.status(200).json({ message: 'Successfully unsubscribed' });
        }
      );
    }
  );
});
 
// ─────────────────────────────────────────────────────────────
// RESUBSCRIBE  POST /api/resubscribe
// ─────────────────────────────────────────────────────────────
app.post('/api/resubscribe', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  const emailLower = email.trim().toLowerCase();
 
  db.query(
    `UPDATE clients SET clientSubScription = 'SUBSCRIBED', updated_at = ? WHERE clientEmail = ?`,
    [createdAt(), emailLower],
    (err) => {
      if (err) return res.status(500).json({ error: 'Database error' });
 
      // Resume or restart their email sequence
      db.query(
        `UPDATE email_sequence_queue SET status = 'PENDING' WHERE email = ? AND status = 'PAUSED'`,
        [emailLower],
        (err2, result) => {
          // If nothing was paused, restart from current position
          if (!err2 && result.affectedRows === 0) {
            enqueueEmailSequence(emailLower);
          }
        }
      );
 
      res.status(200).json({ message: 'Successfully re-subscribed' });
    }
  );
});
 
// ─────────────────────────────────────────────────────────────
// EMAIL PREFERENCES  PUT /api/email-preferences
// ─────────────────────────────────────────────────────────────
app.put('/api/email-preferences', (req, res) => {
  const { email, preferences } = req.body;
  if (!email || !preferences) return res.status(400).json({ error: 'Email and preferences required' });
 
  const prefsJSON = JSON.stringify(preferences);
  const emailLower = email.trim().toLowerCase();
 
  // Upsert preferences
  db.query(
    `INSERT INTO email_preferences (id, email, preferences, updated_at) VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE preferences = ?, updated_at = ?`,
    [clientID(), emailLower, prefsJSON, createdAt(), prefsJSON, createdAt()],
    (err) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.status(200).json({ message: 'Preferences updated' });
    }
  );
});
 
// ─────────────────────────────────────────────────────────────
// ENQUEUE EMAIL SEQUENCE — called when a new lead is created
// ─────────────────────────────────────────────────────────────
function enqueueEmailSequence(email) {
  const now = new Date();
 
  // Insert all 20 emails into the queue with scheduled_at = now + day offset
  EMAIL_SEQUENCE.forEach((emailDef) => {
    const scheduled = new Date(now.getTime() + emailDef.day * 24 * 60 * 60 * 1000);
    const scheduledAt = scheduled.toISOString().slice(0, 19).replace('T', ' ');
 
    db.query(
      `INSERT IGNORE INTO email_sequence_queue
       (id, email, sequence_day, subject, category, scheduled_at, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'PENDING', ?)`,
      [clientID(), email.toLowerCase(), emailDef.day, emailDef.subject, emailDef.category, scheduledAt, createdAt()],
      (err) => {
        if (err) console.error(`Queue insert error (day ${emailDef.day}):`, err.message);
      }
    );
  });
 
  console.log(`📧 Email sequence queued for: ${email} (${EMAIL_SEQUENCE.length} emails)`);
}
 
// EXPORT so it can be called from client creation route
module.exports.enqueueEmailSequence = enqueueEmailSequence;
 
// ─────────────────────────────────────────────────────────────
// CRON JOB — Runs every 15 minutes to send due emails
// ─────────────────────────────────────────────────────────────
cron.schedule('*/15 * * * *', async () => {
  console.log('📨 Email sequence cron running…');
 
  const query = `
    SELECT q.*, c.clientName, c.clientSubScription
    FROM email_sequence_queue q
    JOIN clients c ON c.clientEmail = q.email
    WHERE q.status = 'PENDING'
      AND q.scheduled_at <= NOW()
      AND c.clientSubScription = 'SUBSCRIBED'
    LIMIT 20
  `;
 
  db.query(query, async (err, rows) => {
    if (err) { console.error('Cron query error:', err); return; }
    if (!rows.length) return;
 
    console.log(`Found ${rows.length} emails to send`);
 
    for (const row of rows) {
      const emailDef = EMAIL_SEQUENCE.find(e => e.day === row.sequence_day);
      if (!emailDef) {
        db.query(`UPDATE email_sequence_queue SET status = 'SKIPPED' WHERE id = ?`, [row.id], () => {});
        continue;
      }
 
      // Check per-category preference
      const prefAllowed = await checkEmailPreference(row.email, emailDef.category);
      if (!prefAllowed) {
        db.query(`UPDATE email_sequence_queue SET status = 'SKIPPED_PREF' WHERE id = ?`, [row.id], () => {});
        continue;
      }
 
      const unsubUrl = `https://adconnect.co.ke/unsubscribe?email=${encodeURIComponent(row.email)}`;
      const html = renderEmailTemplate(emailDef.body, {
        clientName:     row.clientName || row.email.split('@')[0],
        currentYear:    new Date().getFullYear(),
        unsubscribeUrl: unsubUrl,
      });
 
      try {
        await transporter.sendMail({
          from:    `"AdConnect" <${process.env.EMAIL_USER}>`,
          to:      row.email,
          subject: emailDef.subject,
          html,
        });
 
        // Mark as sent
        db.query(
          `UPDATE email_sequence_queue SET status = 'SENT', sent_at = ? WHERE id = ?`,
          [createdAt(), row.id],
          () => {}
        );
 
        console.log(`✅ Sent Day ${row.sequence_day} to ${row.email}`);
      } catch (sendErr) {
        console.error(`❌ Failed to send to ${row.email}:`, sendErr.message);
        // Increment retry count; after 3 failures mark as FAILED
        db.query(
          `UPDATE email_sequence_queue
           SET retry_count = retry_count + 1,
               status = IF(retry_count >= 2, 'FAILED', 'PENDING'),
               scheduled_at = DATE_ADD(NOW(), INTERVAL 30 MINUTE)
           WHERE id = ?`,
          [row.id],
          () => {}
        );
      }
    }
  });
});
 
// ─────────────────────────────────────────────────────────────
// CHECK EMAIL PREFERENCE
// ─────────────────────────────────────────────────────────────
function checkEmailPreference(email, category) {
  return new Promise((resolve) => {
    db.query('SELECT preferences FROM email_preferences WHERE email = ?', [email], (err, rows) => {
      if (err || !rows.length) { resolve(true); return; } // No preferences = send all
      try {
        const prefs = JSON.parse(rows[0].preferences);
        // Map category to preference key
        const map = {
          'digital-marketing': 'marketing',
          'web-development':   'product',
          'android-dev':       'product',
          'system-dev':        'product',
          'value':             'news',
        };
        const key = map[category] || 'marketing';
        resolve(prefs[key] !== false); // default allow
      } catch { resolve(true); }
    });
  });
}
 
// ─────────────────────────────────────────────────────────────
// UNSUBSCRIBE CONFIRMATION EMAIL
// ─────────────────────────────────────────────────────────────
async function sendUnsubscribeConfirmation(clientName, email) {
  const resubUrl = `https://adconnect.co.ke/unsubscribe?email=${encodeURIComponent(email)}`;
  await transporter.sendMail({
    from:    `"AdConnect" <${process.env.EMAIL_USER}>`,
    to:      email,
    subject: 'You\'ve been unsubscribed from AdConnect emails',
    html: `
    <!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
    <body style="background:#0f0e0d;font-family:Arial,sans-serif;padding:20px;">
      <div style="max-width:520px;margin:0 auto;background:#1a1917;border-radius:14px;overflow:hidden;border:1px solid #2d2b29;">
        <div style="background:#252320;padding:28px 36px;border-bottom:1px solid #2d2b29;text-align:center;">
          <div style="font-family:sans-serif;font-size:1.1rem;font-weight:900;margin-bottom:16px;">
            <span style="color:#F65730;">Ad</span><span style="color:#f4f1ee;">Connect</span>
          </div>
          <div style="font-size:2rem;margin-bottom:12px;">👋</div>
          <h2 style="color:#f4f1ee;font-size:1.2rem;font-weight:700;">You're Unsubscribed</h2>
        </div>
        <div style="padding:28px 36px;">
          <p style="color:#b8b4b0;font-size:14px;line-height:1.7;margin-bottom:16px;">Hi <strong style="color:#f4f1ee;">${clientName}</strong>,</p>
          <p style="color:#b8b4b0;font-size:14px;line-height:1.7;margin-bottom:16px;">You've been successfully unsubscribed from AdConnect marketing emails. You won't receive any more messages from us.</p>
          <p style="color:#b8b4b0;font-size:14px;line-height:1.7;margin-bottom:24px;">Changed your mind? You can re-subscribe at any time — no hard feelings.</p>
          <div style="text-align:center;margin-bottom:20px;">
            <a href="${resubUrl}" style="display:inline-block;padding:12px 28px;background:#4ABC4F;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;">Re-Subscribe</a>
          </div>
          <p style="color:#555;font-size:12px;text-align:center;">AdConnect · Nairobi, Kenya · <a href="https://adconnect.co.ke" style="color:#F65730;text-decoration:none;">adconnect.co.ke</a></p>
          <p style="color:#2d2b29;font-size:11px;text-align:center;font-style:italic;margin-top:6px;">Designed, Built and Managed by AdConnect Development Team</p>
        </div>
      </div>
    </body></html>`,
  });
}
 
// ─────────────────────────────────────────────────────────────
// ADMIN ENDPOINTS — Sequence Management
// ─────────────────────────────────────────────────────────────
 
// View all queued emails
app.get('/api/email-sequence-queue', (req, res) => {
  const { email, status, limit = 100 } = req.query;
  let sql = 'SELECT * FROM email_sequence_queue WHERE 1=1';
  const params = [];
  if (email)  { sql += ' AND email = ?';  params.push(email); }
  if (status) { sql += ' AND status = ?'; params.push(status); }
  sql += ' ORDER BY scheduled_at ASC LIMIT ?';
  params.push(parseInt(limit));
  db.query(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.status(200).json(rows);
  });
});
 
// Get sequence stats
app.get('/api/email-sequence-stats', (req, res) => {
  const sql = `
    SELECT
      status,
      COUNT(*) as count,
      category,
      MIN(scheduled_at) as earliest,
      MAX(sent_at) as latest_sent
    FROM email_sequence_queue
    GROUP BY status, category
    ORDER BY status, category
  `;
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.status(200).json(rows);
  });
});
 
// Manually trigger sequence for a specific email (admin use)
app.post('/api/email-sequence-queue/enqueue', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  enqueueEmailSequence(email.trim().toLowerCase());
  res.status(201).json({ message: `Sequence queued for ${email}` });
});
 
// Cancel remaining sequence for an email
app.delete('/api/email-sequence-queue/:email', (req, res) => {
  const email = decodeURIComponent(req.params.email);
  db.query(
    `UPDATE email_sequence_queue SET status = 'CANCELLED' WHERE email = ? AND status = 'PENDING'`,
    [email],
    (err, result) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.status(200).json({ message: `${result.affectedRows} emails cancelled for ${email}` });
    }
  );
});

// Export the app for testing
module.exports = app;

/**


 async function sendEmails() {
 try {
 const connection = await pool.getConnection();

 // Get clients who need emails
 const [clients] = await connection.query(`
 SELECT clientEmail, clientName, clientStatus
 FROM clients
 WHERE clientStatus IN ('1ST CONTACT', '2ND CONTACT', '3RD CONTACT')
 `);

 for (let client of clients) {
 let subject, message;

 if (client.clientStatus === '1ST CONTACT') {
 subject = "Welcome!";
 message = "Thank you for reaching out. Let's connect!";
 } else if (client.clientStatus === '2ND CONTACT') {
 subject = "Follow-up";
 message = "Just checking in to see how we can assist you.";
 } else if (client.clientStatus === '3RD CONTACT') {
 subject = "Final Reminder";
 message = "This is your last chance to connect with us!";
 }

 // Send email
 await transporter.sendMail({
 from: '"Your Company" <your_email@gmail.com>',
 to: client.clientEmail,
 subject: subject,
 text: `Hello ${client.clientName},\n\n${message}`
 });

 console.log(`Email sent to ${client.clientEmail}`);
 }

 connection.release();
 } catch (error) {
 console.error("Error sending emails:", error);
 }
 }

 // Run the function
 sendEmails();



 DELIMITER $$

 CREATE EVENT update_client_status
 ON SCHEDULE EVERY 2 DAY
 DO
 BEGIN
 -- Update to '2ND CONTACT' if it's currently '1ST CONTACT'
 UPDATE clients
 SET clientStatus = '2ND CONTACT'
 WHERE clientStatus = '1ST CONTACT';

 -- Update to '3RD CONTACT' if it's currently '2ND CONTACT'
 UPDATE clients
 SET clientStatus = '3RD CONTACT'
 WHERE clientStatus = '2ND CONTACT';

 -- Add more updates as needed
 END $$

 DELIMITER ;

 async function sendEmails() {
 try {
 const connection = await pool.getConnection();

 // Get clients who need emails
 const [clients] = await connection.query(`
 SELECT clientEmail, clientName, clientStatus
 FROM clients
 WHERE clientStatus IN ('1ST CONTACT', '2ND CONTACT', '3RD CONTACT', 'FINAL CONTACT')
 `);

 for (let client of clients) {
 let subject, message;

 switch (client.clientStatus) {
 case '1ST CONTACT':
 subject = "Welcome!";
 message = "Thank you for reaching out. Let's connect!";
 break;
 case '2ND CONTACT':
 subject = "Follow-up";
 message = "Just checking in to see how we can assist you.";
 break;
 case '3RD CONTACT':
 subject = "Reminder";
 message = "We'd love to hear back from you soon!";
 break;
 case 'FINAL CONTACT':
 subject = "Final Notice";
 message = "This is your last chance to connect with us!";
 break;
 }

 // Send email
 await transporter.sendMail({
 from: '"Your Company" <your_email@gmail.com>',
 to: client.clientEmail,
 subject: subject,
 text: `Hello ${client.clientName},\n\n${message}`
 });

 console.log(`Email sent to ${client.clientEmail}`);
 }

 connection.release();
 } catch (error) {
 console.error("Error sending emails:", error);
 }
 }


 DELIMITER $$

 CREATE EVENT update_client_status
 ON SCHEDULE EVERY 2 DAY
 DO
 BEGIN
 UPDATE clients
 SET clientStatus =
 CASE
 WHEN clientStatus = '1ST CONTACT' THEN '2ND CONTACT'
 WHEN clientStatus = '2ND CONTACT' THEN '3RD CONTACT'
 WHEN clientStatus = '3RD CONTACT' THEN 'FINAL CONTACT'
 ELSE clientStatus
 END
 WHERE clientStatus IN ('1ST CONTACT', '2ND CONTACT', '3RD CONTACT');
 END $$

 DELIMITER ;



 SET GLOBAL event_scheduler = ON;
 */

 // ═══════════════════ SQL MIGRATION ════════════════════════════
/*
Run these SQL statements to create the new tables:

-- Blog Posts Table
CREATE TABLE IF NOT EXISTS blog_posts (
    id           VARCHAR(20) PRIMARY KEY,
    title        VARCHAR(255) NOT NULL,
    category     VARCHAR(100) DEFAULT 'General',
    status       ENUM('DRAFT','PUBLISHED') DEFAULT 'DRAFT',
    excerpt      TEXT,
    content      LONGTEXT,
    author       VARCHAR(100),
    coverImage   VARCHAR(500),
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Projects Table
CREATE TABLE IF NOT EXISTS projects (
    id           VARCHAR(20) PRIMARY KEY,
    name         VARCHAR(255) NOT NULL,
    type         ENUM('Website','Android App','UI/UX Design','Software','Marketing') DEFAULT 'Website',
    description  TEXT NOT NULL,
    tags         JSON,
    url          VARCHAR(500),
    thumbnail    VARCHAR(500),
    status       ENUM('ACTIVE','DRAFT') DEFAULT 'ACTIVE',
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Add role column to users if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS role_level ENUM('SUPER_ADMIN','ADMIN','EDITOR','GEN_USER') DEFAULT 'GEN_USER';
-- Note: 'role' column already exists in your schema, so just ensure it accepts these values
ALTER TABLE users MODIFY COLUMN role VARCHAR(50) DEFAULT 'GEN_USER';

-- Site Settings Table (homepage CMS)
CREATE TABLE IF NOT EXISTS site_settings (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    section       VARCHAR(80)  NOT NULL DEFAULT 'homepage',
    setting_key   VARCHAR(100) NOT NULL,
    setting_value TEXT,
    updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_section_key (section, setting_key)
);

-- Seed default homepage settings
INSERT IGNORE INTO site_settings (section, setting_key, setting_value) VALUES
('homepage', 'hero_eyebrow',      "Kenya's #1 Real Estate Marketing Agency"),
('homepage', 'hero_headline',     "Powering <span class='accent'>Real Estate</span> Businesses with <span class='accent-g'>HI-ROI</span> Digital Marketing"),
('homepage', 'hero_subheadline',  "Boost your lead generation, reduce ad costs, and grow your real estate business with tailored ad strategies across Facebook, Instagram, Google and beyond."),
('homepage', 'hero_cta_primary',  "Watch Free Strategy Video"),
('homepage', 'hero_cta_secondary',"Book Free Consultation"),
('homepage', 'stat_clients',      "50+"),
('homepage', 'stat_roi',          "200%"),
('homepage', 'result_1',          "200%"),
('homepage', 'result_2',          "50+"),
('homepage', 'result_3',          "60%"),
('homepage', 'result_4',          "4+");

-- Testimonials Table
CREATE TABLE IF NOT EXISTS testimonials (
    id            VARCHAR(20) PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    company       VARCHAR(150),
    text          TEXT NOT NULL,
    stars         TINYINT DEFAULT 5,
    photo         VARCHAR(500),
    status        ENUM('ACTIVE','INACTIVE') DEFAULT 'ACTIVE',
    display_order INT DEFAULT 0,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Seed default testimonials
INSERT IGNORE INTO testimonials (id, name, company, text, stars, status, display_order) VALUES
('t001', 'Irene Nyokabi', 'Elixir Salon & Spa', '"AdConnect has been instrumental in helping us reach our target audience and generate high-quality leads. Their team is professional, responsive, and always delivers on time. Our bookings increased by 180% within the first 3 months!"', 5, 'ACTIVE', 1),
('t002', 'Eng. James', 'Ricosam Engineering', '"Our project involved integrating multiple third-party APIs. AdConnect handled it flawlessly and optimised the process to ensure fast load times. Their technical expertise is truly impressive."', 5, 'ACTIVE', 2),
('t003', 'John Kamau', 'Songa Real Estate', '"Our company required a custom web application and AdConnect delivered beyond expectations. Their developers were thorough and the application is intuitive and scalable."', 4, 'ACTIVE', 3);
*/