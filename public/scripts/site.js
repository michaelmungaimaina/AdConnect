/* ============================================================
   AdConnect — shared site script (loaded on every public page)
   • SITE.api()      small fetch wrapper for /api
   • SITE.md()       tiny, safe Markdown renderer (blog posts)
   • layout patch    services menu, footer links, socials and phone numbers
                     are filled from the admin panel (Settings + Services)
   ============================================================ */
(function () {
  'use strict';

  var API = '/api/';
  var SITE = (window.SITE = window.SITE || {});
  SITE.base = API;

  /* ── helpers ─────────────────────────────────────────────── */
  SITE.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var esc = SITE.esc;

  SITE.api = function (path, opts) {
    opts = opts || {};
    var init = { method: opts.method || 'GET', headers: {} };
    if (opts.body instanceof FormData) init.body = opts.body;
    else if (opts.body !== undefined) { init.headers['Content-Type'] = 'application/json'; init.body = JSON.stringify(opts.body); }
    return fetch(API + path.replace(/^\//, ''), init).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (!res.ok) { var e = new Error(data.error || 'Something went wrong. Please try again.'); e.status = res.status; throw e; }
        return data;
      });
    });
  };

  SITE.fmtDate = function (d, opts) {
    if (!d) return '';
    var dt = typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) ? new Date(d + 'T00:00:00') : new Date(d);
    if (isNaN(dt)) return String(d);
    return dt.toLocaleDateString('en-KE', opts || { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  };
  SITE.fmtTime = function (t) {
    if (!t) return '';
    var p = String(t).split(':'), h = parseInt(p[0], 10), m = p[1] || '00';
    return (h % 12 || 12) + ':' + m + ' ' + (h >= 12 ? 'PM' : 'AM');
  };

  SITE.toast = function (msg, kind) {
    var el = document.createElement('div');
    el.className = 'site-toast ' + (kind || 'ok');
    el.textContent = msg;
    document.body.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('show'); });
    setTimeout(function () { el.classList.remove('show'); setTimeout(function () { el.remove(); }, 300); }, 4200);
  };

  /* ── Markdown (headings, lists, bold/italic, links, code, quotes, tables-free) ── */
  SITE.md = function (src) {
    var lines = String(src || '').replace(/\r/g, '').split('\n');
    var out = [], list = null, para = [];
    function inline(t) {
      t = esc(t);
      t = t.replace(/`([^`]+)`/g, '<code>$1</code>');
      t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      t = t.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
      t = t.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (m, label, url) {
        if (!/^(https?:\/\/|\/|#|mailto:|tel:)/i.test(url)) return label;
        return '<a href="' + url + '"' + (/^https?:/i.test(url) ? ' target="_blank" rel="noopener"' : '') + '>' + label + '</a>';
      });
      return t;
    }
    function flushPara() { if (para.length) { out.push('<p>' + inline(para.join(' ')) + '</p>'); para = []; } }
    function flushList() { if (list) { out.push('</' + list + '>'); list = null; } }
    lines.forEach(function (raw) {
      var l = raw.trim(), m;
      if (!l) { flushPara(); flushList(); return; }
      if ((m = /^(#{1,4})\s+(.*)$/.exec(l))) { flushPara(); flushList(); var lv = Math.min(m[1].length + 1, 5); out.push('<h' + lv + '>' + inline(m[2]) + '</h' + lv + '>'); return; }
      if ((m = /^[-*]\s+(.*)$/.exec(l))) { flushPara(); if (list !== 'ul') { flushList(); out.push('<ul>'); list = 'ul'; } out.push('<li>' + inline(m[1]) + '</li>'); return; }
      if ((m = /^\d+[.)]\s+(.*)$/.exec(l))) { flushPara(); if (list !== 'ol') { flushList(); out.push('<ol>'); list = 'ol'; } out.push('<li>' + inline(m[1]) + '</li>'); return; }
      if ((m = /^>\s?(.*)$/.exec(l))) { flushPara(); flushList(); out.push('<blockquote>' + inline(m[1]) + '</blockquote>'); return; }
      if (/^(-{3,}|\*{3,})$/.test(l)) { flushPara(); flushList(); out.push('<hr/>'); return; }
      flushList(); para.push(l);
    });
    flushPara(); flushList();
    return out.join('\n');
  };

  /* ── data shared by every page ───────────────────────────── */
  var infoP = null, catsP = null;
  SITE.info = function () { return infoP || (infoP = SITE.api('site-info').catch(function () { return {}; })); };
  SITE.categories = function () { return catsP || (catsP = SITE.api('service-categories').catch(function () { return []; })); };

  var telHref = function (p) { return 'tel:' + String(p || '').replace(/[^\d+]/g, ''); };
  var waHref = function (p) { return 'https://wa.me/' + String(p || '').replace(/[^\d]/g, ''); };

  /* ── layout patch ────────────────────────────────────────── */
  function patchLayout(info, cats) {
    // Services dropdown (desktop) + collapsible list (mobile side panel)
    var items = cats.map(function (c) { return { href: 'our-services.html#' + c.slug, label: c.name }; });
    items.push({ href: 'book.html', label: 'Book a session' }, { href: 'proposal.html', label: 'Submit a proposal' });
    document.querySelectorAll('.dropdown-menu').forEach(function (ul) {
      ul.innerHTML = items.map(function (i) { return '<li><a href="' + i.href + '" class="dropdown-item" role="menuitem">' + esc(i.label) + '</a></li>'; }).join('');
    });
    document.querySelectorAll('#services ul, .sidepanel .collapse ul').forEach(function (ul) {
      ul.innerHTML = items.map(function (i) { return '<li><a href="' + i.href + '" class="dropdown-item">' + esc(i.label) + '</a></li>'; }).join('');
    });

    // "Book a Session" button in both menus (when the page's static menu lacks it)
    var top = document.querySelector('.navbar-nav');
    if (top && !top.querySelector('a[href="book.html"]')) top.insertAdjacentHTML('beforeend', '<li><a href="book.html" class="nav-link nav-cta">Book a Session</a></li>');
    var side = document.querySelector('#mySidePanel div > ul');
    if (side && !side.querySelector(':scope > li > a[href="book.html"]')) side.insertAdjacentHTML('beforeend', '<li><a href="book.html" class="nav-cta" style="margin:8px 0;display:inline-block">Book a Session</a></li>');

    // Footer: services column
    document.querySelectorAll('.footer-v2-col.col-services .footer-v2-links').forEach(function (ul) {
      ul.innerHTML = cats.map(function (c) { return '<li><a href="our-services.html#' + c.slug + '">' + esc(c.name) + '</a></li>'; }).join('');
    });

    // Footer: tagline, location, email
    if (info.tagline) document.querySelectorAll('.footer-v2-tagline').forEach(function (el) { el.textContent = info.tagline; });
    var loc = document.getElementById('footerLocation');
    if (loc && info.address) loc.textContent = info.address;
    if (info.email) document.querySelectorAll('a[href^="mailto:info@"]').forEach(function (a) { a.href = 'mailto:' + info.email; if (!a.children.length && a.textContent.indexOf('@') > -1) a.textContent = info.email; });

    // Footer: social links (hide the ones that have no URL)
    var map = { facebook: 'facebook', instagram: 'instagram', tiktok: 'tiktok', 'x / twitter': 'twitter', twitter: 'twitter', youtube: 'youtube', linkedin: 'linkedin' };
    document.querySelectorAll('.footer-v2-social-link, .social-link').forEach(function (a) {
      var key = map[String(a.getAttribute('aria-label') || '').toLowerCase()];
      var url = key && info.social ? info.social[key] : '';
      if (url) { a.href = url; a.target = '_blank'; a.rel = 'noopener'; } else a.style.display = 'none';
    });

    // Phone numbers (Michael Maina's number sits beside the main one)
    document.querySelectorAll('.footer-v2-contact-pill').forEach(function (a) {
      if (info.phone) { a.href = telHref(info.phone); a.innerHTML = '<i class="fa fa-phone"></i> ' + esc(info.phone); }
      if (info.phone2 && !a.parentNode.querySelector('.footer-v2-contact-pill.second')) {
        var b = a.cloneNode(true); b.classList.add('second');
        b.href = telHref(info.phone2);
        b.innerHTML = '<i class="fa fa-phone"></i> ' + esc(info.phone2) + (info.phone2_label ? ' <small>' + esc(String(info.phone2_label).split('·')[0].trim()) + '</small>' : '');
        a.insertAdjacentElement('afterend', b);
      }
    });
    document.querySelectorAll('[data-site-phone]').forEach(function (el) { el.textContent = info.phone || ''; if (el.tagName === 'A') el.href = telHref(info.phone); });
    document.querySelectorAll('[data-site-phone2]').forEach(function (el) { if (!info.phone2) { el.style.display = 'none'; return; } el.textContent = info.phone2; if (el.tagName === 'A') el.href = telHref(info.phone2); });
    document.querySelectorAll('[data-site-phone2-box]').forEach(function (el) { if (!info.phone2) el.style.display = 'none'; else { el.href = telHref(info.phone2); var l = document.getElementById('contactPhone2Label'); if (l && info.phone2_label) l.textContent = String(info.phone2_label).split('·')[0].trim(); } });
    document.querySelectorAll('[data-site-email]').forEach(function (el) { el.textContent = info.email || ''; if (el.tagName === 'A') el.href = 'mailto:' + info.email; });
    document.querySelectorAll('[data-site-whatsapp]').forEach(function (el) { if (info.whatsapp) el.href = waHref(info.whatsapp); else el.style.display = 'none'; });
    document.querySelectorAll('[data-site-address]').forEach(function (el) { el.textContent = info.address || ''; });
    document.querySelectorAll('[data-site-hours]').forEach(function (el) { el.textContent = info.hours || ''; });
    document.querySelectorAll('[data-site-name]').forEach(function (el) { el.textContent = info.name || 'AdConnect'; });

    // Home page / services page: category grids
    document.querySelectorAll('[data-category-grid]').forEach(function (el) {
      el.innerHTML = cats.map(function (c) {
        return '<a class="svc-card" href="our-services.html#' + c.slug + '"><span class="svc-ico"><i class="fa ' + esc(c.icon || 'fa-star') + '"></i></span>' +
          '<h3>' + esc(c.name) + '</h3><p>' + esc(c.tagline || '') + '</p><span class="svc-more">Explore <i class="fa fa-arrow-right"></i></span></a>';
      }).join('');
    });

    var yr = document.getElementById('current-year');
    if (yr) yr.textContent = new Date().getFullYear();
  }

  /* ── navigation for pages that do not carry their own nav script ── */
  function wireNav() {
    var open = function () { var p = document.getElementById('mySidePanel'); if (p) p.style.left = '0'; };
    var close = function () { var p = document.getElementById('mySidePanel'); if (p) p.style.left = '-320px'; };
    var t = document.getElementById('navbarTogler'); if (t) t.addEventListener('click', open);
    var c = document.getElementById('sidePanelCloseBtn'); if (c) c.addEventListener('click', close);
    document.querySelectorAll('.collapse-btn').forEach(function (item) {
      var trig = item.querySelector('.dropdown-trigger');
      if (trig) trig.addEventListener('click', function (e) { e.preventDefault(); var b = item.querySelector('.collapse'); if (b) b.classList.toggle('show'); });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (document.body.hasAttribute('data-site-nav')) wireNav();
    // pages with "?appointment-booking=true" style links from older bookmarks
    if (/[?&]appointment-booking=true/.test(location.search)) { location.replace('book.html'); return; }
    Promise.all([SITE.info(), SITE.categories()]).then(function (r) { patchLayout(r[0] || {}, Array.isArray(r[1]) ? r[1] : []); });
  });
})();
