'use strict';
/**
 * Google Calendar / Meet integration — optional.
 * Everything degrades gracefully: without credentials/token, createMeetLink() returns null.
 * Authorisation is done once from Admin → Settings → "Google Meet" (no terminal needed,
 * which matters on shared hosting). The token is stored in token.json next to server.js.
 */
const fs = require('fs');
const path = require('path');

const TOKEN_PATH = path.join(__dirname, '..', 'token.json');
let google = null;
try { ({ google } = require('googleapis')); } catch { /* optional dependency */ }

module.exports = function createGoogle() {
  const configured = () => !!(google && process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  const redirectUri = () => process.env.GOOGLE_REDIRECT_URI || `${(process.env.APP_API_URL || 'http://localhost:3000/').replace(/\/+$/, '')}/api/google-oauth/callback`;

  function client() {
    if (!configured()) return null;
    const c = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, redirectUri());
    if (fs.existsSync(TOKEN_PATH)) {
      try { c.setCredentials(JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'))); } catch { /* ignore */ }
    }
    c.on && c.on('tokens', (t) => {
      try {
        const cur = fs.existsSync(TOKEN_PATH) ? JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8')) : {};
        fs.writeFileSync(TOKEN_PATH, JSON.stringify({ ...cur, ...t }));
      } catch { /* ignore */ }
    });
    return c;
  }

  function status() {
    if (!configured()) return { valid: false, configured: false, reason: 'GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not set' };
    if (!fs.existsSync(TOKEN_PATH)) return { valid: false, configured: true, reason: 'Not authorised yet' };
    try {
      const t = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
      // A refresh token never expires on its own, so treat it as valid.
      return { valid: !!(t.refresh_token || (t.expiry_date && t.expiry_date > Date.now())), configured: true, expiry: t.expiry_date || null };
    } catch { return { valid: false, configured: true, reason: 'Token file unreadable' }; }
  }

  function authUrl() {
    const c = client();
    if (!c) return null;
    return c.generateAuthUrl({ access_type: 'offline', prompt: 'consent', scope: ['https://www.googleapis.com/auth/calendar.events'] });
  }

  async function handleCallback(code) {
    const c = client();
    if (!c) throw new Error('Google is not configured');
    const { tokens } = await c.getToken(code);
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
    return tokens;
  }

  async function refresh() {
    const c = client();
    if (!c || !c.credentials.refresh_token) throw new Error('No refresh token – re-authorise first');
    const { credentials } = await c.refreshAccessToken();
    fs.writeFileSync(TOKEN_PATH, JSON.stringify({ ...c.credentials, ...credentials }));
    return credentials;
  }

  /** start/end are 'YYYY-MM-DD HH:mm' in Africa/Nairobi. Returns a meet URL or null. */
  async function createMeetLink({ summary, date, start, end, attendeeEmail }) {
    if (!status().valid) return null;
    try {
      const c = client();
      const cal = google.calendar({ version: 'v3', auth: c });
      const iso = (t) => `${date}T${t}:00+03:00`;
      const r = await cal.events.insert({
        calendarId: 'primary', conferenceDataVersion: 1, sendUpdates: 'none',
        resource: {
          summary: summary || 'AdConnect session',
          start: { dateTime: iso(start), timeZone: 'Africa/Nairobi' },
          end: { dateTime: iso(end), timeZone: 'Africa/Nairobi' },
          attendees: attendeeEmail ? [{ email: attendeeEmail }] : undefined,
          conferenceData: { createRequest: { requestId: `adc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, conferenceSolutionKey: { type: 'hangoutsMeet' } } },
        },
      });
      return (r.data.conferenceData && r.data.conferenceData.entryPoints || []).find((p) => p.entryPointType === 'video')?.uri || r.data.hangoutLink || null;
    } catch (e) {
      console.error('Google Meet error:', e.response?.data?.error?.message || e.message);
      return null;
    }
  }

  return { configured, status, authUrl, handleCallback, refresh, createMeetLink };
};
