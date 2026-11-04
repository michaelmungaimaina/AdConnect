'use strict';
/**
 * E-mail: transporter, themed HTML layout, campaign renderer.
 * If SMTP is not configured the message is logged and treated as "skipped" so the rest of the
 * app keeps working in development.
 */
const nodemailer = require('nodemailer');
const { esc } = require('./util');

module.exports = function createMailer({ settings, theme }) {
  let transporter = null, sig = '';

  async function getTransporter() {
    const s = await settings.getSection('global');
    const host = s.smtp_host || process.env.SMTP_HOST;
    const port = parseInt(s.smtp_port || process.env.SMTP_PORT || '465', 10);
    const user = s.smtp_user || process.env.EMAIL_USER;
    const pass = s.smtp_password || process.env.EMAIL_PASS;
    if (!host || !user || !pass) return null;
    const secure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : port === 465;
    const key = [host, port, user, pass, secure].join('|');
    if (!transporter || key !== sig) {
      transporter = nodemailer.createTransport({ host, port, secure, auth: { user, pass }, pool: true, maxConnections: 3 });
      sig = key;
    }
    return { transporter, user };
  }

  async function company() {
    const g = await settings.getSection('global');
    const base = (process.env.COMPANY_WEBSITE || process.env.APP_BASE_URL || process.env.APP_API_URL || 'http://localhost:3000').replace(/\/+$/, '').replace(/\/api$/, '');
    return {
      name: g.site_name || process.env.COMPANY_NAME || 'AdConnect',
      baseUrl: g.base_url ? g.base_url.replace(/\/+$/, '') : base,
      email: g.contact_email || process.env.COMPANY_EMAIL || 'info@adconnect.co.ke',
      adminEmail: g.admin_email || process.env.ADMIN_EMAIL || process.env.COMPANY_EMAIL || 'info@adconnect.co.ke',
      fromName: g.email_from_name || process.env.EMAIL_FROM_NAME || 'AdConnect Team',
      phone: g.phone || process.env.COMPANY_PHONE || '+254 790 064 130',
      phone2: g.phone_secondary || '+254 799 292 048',
      phone2Label: g.phone_secondary_label || 'Michael Maina',
      phoneLabel: g.phone_label || 'Misgina Fitwi',
      location: g.address || process.env.COMPANY_LOCATION || 'Nairobi, Kenya',
    };
  }

  /** Send one message. Returns { ok, skipped, error }. Never throws. */
  async function send({ to, subject, html, text, fromName, replyTo, headers, bcc }) {
    try {
      const t = await getTransporter();
      const co = await company();
      if (!t) {
        console.log(`✉️  [mail skipped – SMTP not configured] to=${to} subject="${subject}"`);
        return { ok: true, skipped: true };
      }
      await t.transporter.sendMail({
        from: `"${(fromName || co.fromName).replace(/"/g, '')}" <${t.user}>`,
        to, bcc, subject, html,
        text: text || html.replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\n{3,}/g, '\n\n').trim(),
        replyTo: replyTo || co.email,
        headers,
      });
      return { ok: true };
    } catch (e) {
      console.error(`✉️  send failed to=${to}:`, e.message);
      return { ok: false, error: e.message };
    }
  }

  // ── HTML building blocks ───────────────────────────────────
  const FONT = "'DM Sans','Helvetica Neue',Helvetica,Arial,sans-serif";

  /** Absolute URL for a site-relative link. */
  const abs = (base, url) => (/^https?:\/\//i.test(url || '') ? url : `${base}${(url || '/').startsWith('/') ? '' : '/'}${url || ''}`);

  function layout({ co, colors, kicker, title, preheader, bodyHtml, cta, ctaUrl, heroColor, unsubscribeUrl, footerExtra, signature = true }) {
    const c = colors;
    const hero = heroColor || c.primary;
    const btn = (ctaUrl && cta)
      ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 8px;"><tr><td align="center">
           <a href="${esc(abs(co.baseUrl, ctaUrl))}" style="display:inline-block;padding:14px 34px;background:${c.primary};color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;font-family:${FONT};">${esc(cta)}</a>
         </td></tr></table>` : '';
    const sigHtml = signature ? `
      <p style="margin:26px 0 2px;font-size:15px;color:${c.text_secondary};">Warm regards,</p>
    
      <p style="margin:0;font-size:13px;color:${c.text_muted};line-height:1.7;">
        <a href="${esc(co.baseUrl)}" style="color:${c.accent};text-decoration:none;">${esc(co.name)}</a><br/>
        ${esc(co.phoneLabel)}: <a href="tel:${esc(co.phone.replace(/\s+/g, ''))}" style="color:${c.text_muted};text-decoration:none;">${esc(co.phone)}</a><br/>
        ${esc(co.phone2Label)}: <a href="tel:${esc(co.phone2.replace(/\s+/g, ''))}" style="color:${c.text_muted};text-decoration:none;">${esc(co.phone2)}</a>
      </p>` : '';
      // <p style="margin:0 0 2px;font-size:15px;font-weight:700;color:${c.text_primary};">${esc(co.phoneLabel)} &amp; ${esc(co.phone2Label)}</p>
    const unsub = unsubscribeUrl
      ? `<a href="${esc(unsubscribeUrl)}" style="color:${c.primary};text-decoration:none;">Unsubscribe or manage preferences</a> &nbsp;·&nbsp; ` : '';
    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><meta name="color-scheme" content="dark light"/><title>${esc(title || co.name)}</title></head>
<body style="margin:0;padding:0;background:${c.bg};font-family:${FONT};">
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${c.bg};">${esc(preheader)}</div>` : ''}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${c.bg};padding:32px 12px;"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">
  <tr><td style="background:${c.surface_1};border-radius:16px 16px 0 0;padding:22px 32px;border-bottom:1px solid ${c.border};text-align:center;">
    <a href="${esc(co.baseUrl)}" style="text-decoration:none;font-family:'Syne',${FONT};font-size:24px;font-weight:800;letter-spacing:-.5px;"><span style="color:${c.primary};">Ad</span><span style="color:${c.text_primary};">Connect</span></a>
  </td></tr>
  <tr><td style="background:${hero};padding:34px 32px 36px;text-align:center;">
    ${kicker ? `<div style="font-size:11px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;color:rgba(255,255,255,.85);margin-bottom:10px;">${esc(kicker)}</div>` : ''}
    <h1 style="margin:0;font-family:'Syne',${FONT};font-size:26px;line-height:1.25;font-weight:800;color:#ffffff;">${esc(title)}</h1>
  </td></tr>
  <tr><td style="background:${c.surface_1};padding:30px 32px 26px;color:${c.text_secondary};font-size:15px;line-height:1.75;">
    ${bodyHtml}${btn}${sigHtml}
  </td></tr>
  <tr><td style="background:${c.bg};border:1px solid ${c.border};border-top:0;border-radius:0 0 16px 16px;padding:18px 32px;text-align:center;font-size:11px;line-height:1.7;color:${c.text_muted};">
    ${footerExtra ? `<div style="margin-bottom:6px;">${footerExtra}</div>` : ''}
    ${unsub}<a href="${esc(co.baseUrl)}/privacy.html" style="color:${c.text_muted};text-decoration:none;">Privacy Policy</a><br/>
    © ${new Date().getFullYear()} ${esc(co.name)} · ${esc(co.location)}
  </td></tr>
</table></td></tr></table></body></html>`;
  }

  /** Give simple semantic HTML (p/ul/ol/li/blockquote/h3/a/strong) inline styles that survive mail clients. */
  function styleBody(html, c, co) {
    let out = String(html || '');
    out = out
      .replace(/<p>/gi, `<p style="margin:0 0 14px;color:${c.text_secondary};font-size:15px;line-height:1.75;">`)
      .replace(/<h3>/gi, `<h3 style="margin:22px 0 8px;font-family:'Syne',${FONT};font-size:17px;color:${c.text_primary};">`)
      .replace(/<(ul|ol)>/gi, `<$1 style="margin:0 0 16px;padding-left:22px;color:${c.text_secondary};">`)
      .replace(/<li>/gi, `<li style="margin:0 0 7px;font-size:15px;line-height:1.65;">`)
      .replace(/<blockquote>/gi, `<blockquote style="margin:18px 0;padding:14px 18px;background:${c.surface_2};border-left:3px solid ${c.primary};border-radius:0 8px 8px 0;color:${c.text_primary};font-size:14.5px;line-height:1.7;">`)
      .replace(/<strong>/gi, `<strong style="color:${c.text_primary};">`)
      .replace(/<a\s+href="([^"]*)"/gi, (m, href) => `<a href="${abs(co.baseUrl, href)}" style="color:${c.primary};text-decoration:underline;"`);
    return out;
  }

  const fill = (str, vars) => String(str || '').replace(/\{\{\s*(\w+)\s*\}\}/g, (m, k) => (vars[k] !== undefined ? esc(vars[k]) : '')).replace(/\$\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? esc(vars[k]) : ''));
  const fillRaw = (str, vars) => String(str || '').replace(/\{\{\s*(\w+)\s*\}\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : '')).replace(/\$\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : ''));

  /**
   * Render a campaign step / broadcast for one recipient.
   * step: { subject, preheader, kicker, title, body_html, cta_text, cta_url }
   * recipient: { name, email }, links: { unsubscribeUrl }
   */
  async function renderCampaign(step, recipient, links = {}) {
    const co = await company();
    const colors = (await theme.load()).colors;
    const first = String(recipient.name || '').trim().split(/\s+/)[0] || 'there';
    const vars = { firstName: first, name: recipient.name || first, email: recipient.email || '', unsubscribeUrl: links.unsubscribeUrl || '', clientName: recipient.name || first, currentYear: new Date().getFullYear() };
    const body = styleBody(fill(step.body_html, vars), colors, co);
    return {
      subject: fillRaw(step.subject, vars),
      html: layout({ co, colors, kicker: step.kicker, title: fillRaw(step.title, vars), preheader: fillRaw(step.preheader, vars), bodyHtml: body, cta: step.cta_text, ctaUrl: step.cta_url, unsubscribeUrl: links.unsubscribeUrl, footerExtra: `You are receiving this because you subscribed to ${esc(co.name)} updates.` }),
    };
  }

  /** Simple transactional e-mail with a title, paragraphs, optional detail rows and button. */
  async function renderNotice({ kicker, title, intro, rows, outro, cta, ctaUrl, heroColor, preheader, signature = true, unsubscribeUrl }) {
    const co = await company();
    const colors = (await theme.load()).colors;
    const c = colors;
    const rowsHtml = rows && rows.length ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 18px;background:${c.surface_2};border:1px solid ${c.border};border-radius:12px;"><tr><td style="padding:10px 20px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows.filter((r) => r && r[1]).map(([k, v], i, arr) => `
        <tr><td style="padding:10px 0;${i < arr.length - 1 ? `border-bottom:1px solid ${c.border};` : ''}color:${c.text_muted};font-size:13px;width:130px;vertical-align:top;">${esc(k)}</td>
        <td style="padding:10px 0;${i < arr.length - 1 ? `border-bottom:1px solid ${c.border};` : ''}color:${c.text_primary};font-size:14px;font-weight:600;line-height:1.5;">${esc(v)}</td></tr>`).join('')}
      </table></td></tr></table>` : '';
    const body = `${intro ? styleBody(intro, c, co) : ''}${rowsHtml}${outro ? styleBody(outro, c, co) : ''}`;
    return layout({ co, colors, kicker, title, preheader, bodyHtml: body, cta, ctaUrl, heroColor, signature, unsubscribeUrl });
  }

  return { send, layout, styleBody, renderCampaign, renderNotice, company, abs, fill };
};
