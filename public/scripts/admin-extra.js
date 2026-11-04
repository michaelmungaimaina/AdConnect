/* ============================================================
   AdConnect admin — services, bookings, proposals, subscribers,
   campaigns, messages and appearance panels.
   Depends on admin-core.js (token) and admin.js (toast, loader, session).
   ============================================================ */
'use strict';

const AX = (() => {
  const API = '/api/';
  const $ = (id) => document.getElementById(id);
  const E = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ok = (m) => toast(m);
  const bad = (e) => toast((e && e.message) || String(e), 'error');
  const dayOf = (d) => (d ? new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
  const when = (d) => (d ? new Date(d).toLocaleString('en-KE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—');
  const t12 = (t) => { if (!t) return ''; const [h, m] = String(t).split(':'); const H = parseInt(h, 10); return `${H % 12 || 12}:${m} ${H >= 12 ? 'PM' : 'AM'}`; };
  const isStaffAdmin = () => ['SUPER_ADMIN', 'ADMIN'].includes(window.session && window.session.role);
  const debounce = (fn, ms = 300) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

  async function call(path, opts = {}) {
    const init = { method: opts.method || 'GET', headers: {} };
    if (opts.body instanceof FormData) init.body = opts.body;
    else if (opts.body !== undefined) { init.headers['Content-Type'] = 'application/json'; init.body = JSON.stringify(opts.body); }
    const res = await fetch(API + path, init);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data;
  }
  const withLoader = async (msg, fn) => { showLoader(msg); try { return await fn(); } finally { hideLoader(); } };

  /* ── dialog ──────────────────────────────────────────────── */
  function dlg(title, body, buttons = []) {
    $('adlgTitle').textContent = title;
    $('adlgBody').innerHTML = body;
    const foot = $('adlgFoot'); foot.innerHTML = '';
    buttons.forEach((b) => {
      const el = document.createElement('button');
      el.className = `btn btn-sm ${b.cls || 'btn-secondary'}`;
      el.innerHTML = b.label;
      el.addEventListener('click', async () => {
        el.disabled = true;
        try { await b.fn(); } catch (e) { bad(e); } finally { el.disabled = false; }
      });
      foot.appendChild(el);
    });
    const d = $('adlg');
    if (!d.open) d.showModal();
    return d;
  }
  const closeDlg = () => { const d = $('adlg'); if (d.open) d.close(); };

  /* ── tiny form builder ───────────────────────────────────── */
  function formHtml(fields, v = {}) {
    return `<div class="form-grid">${fields.map((f) => {
      const val = v[f.k] == null ? (f.def == null ? '' : f.def) : v[f.k];
      const id = `f_${f.k}`;
      let input;
      if (f.type === 'textarea') input = `<textarea class="input-field" id="${id}" ${f.ph ? `placeholder="${E(f.ph)}"` : ''}>${E(val)}</textarea>`;
      else if (f.type === 'select') input = `<select class="input-field" id="${id}">${f.opts.map((o) => { const [ov, ol] = Array.isArray(o) ? o : [o, o]; return `<option value="${E(ov)}" ${String(ov) === String(val) ? 'selected' : ''}>${E(ol)}</option>`; }).join('')}</select>`;
      else if (f.type === 'checkbox') return `<div class="${f.span2 ? 'span2' : ''}"><label class="label" style="display:flex;gap:8px;align-items:center;cursor:pointer"><input type="checkbox" id="${id}" ${val === true || val === 1 || val === '1' || val === 'true' ? 'checked' : ''}/> ${E(f.label)}</label></div>`;
      else input = `<input class="input-field" id="${id}" type="${f.type || 'text'}" value="${E(val)}" ${f.ph ? `placeholder="${E(f.ph)}"` : ''} ${f.min != null ? `min="${f.min}"` : ''} ${f.max != null ? `max="${f.max}"` : ''}/>`;
      return `<div class="${f.span2 ? 'span2' : ''}"><label class="label" for="${id}">${E(f.label)}</label>${input}${f.hint ? `<div style="font-size:.72rem;color:var(--clr-text-muted);margin-top:4px">${E(f.hint)}</div>` : ''}</div>`;
    }).join('')}</div>`;
  }
  function readForm(fields) {
    const out = {};
    fields.forEach((f) => { const el = $(`f_${f.k}`); out[f.k] = f.type === 'checkbox' ? el.checked : el.value.trim(); });
    return out;
  }

  const badge = (s, map = {}) => {
    const cls = map[s] || { CONFIRMED: 'badge-success', COMPLETED: 'badge-success', SUBSCRIBED: 'badge-success', ACCEPTED: 'badge-success', ACTIVE: 'badge-success', SENT: 'badge-success', REPLIED: 'badge-success',
      PENDING: 'badge-warning', NEW: 'badge-info', UNDER_REVIEW: 'badge-info', RESCHEDULED: 'badge-info', QUOTED: 'badge-info', NEEDS_INFO: 'badge-warning', UNREAD: 'badge-warning', DRAFT: 'badge-warning', SENDING: 'badge-info', PAUSED: 'badge-warning', HIDDEN: 'badge-default',
      CANCELLED: 'badge-error', NO_SHOW: 'badge-error', DECLINED: 'badge-error', UNSUBSCRIBED: 'badge-default', BOUNCED: 'badge-error', FAILED: 'badge-error' }[s] || 'badge-default';
    return `<span class="badge ${cls}">${E(String(s || '—').replace(/_/g, ' '))}</span>`;
  };
  const row = (cells) => `<tr>${cells.map(([label, html, cls]) => `<td data-label="${E(label)}"${cls ? ` class="${cls}"` : ''}>${html}</td>`).join('')}</tr>`;
  const empty = (cols, msg) => `<tr><td colspan="${cols}" style="text-align:center;padding:var(--space-8);color:var(--clr-text-muted);">${E(msg)}</td></tr>`;
  const iconBtn = (icon, title, onclick, cls = 'btn-ghost') => `<button class="btn ${cls} btn-sm btn-icon" title="${E(title)}" aria-label="${E(title)}" onclick="${onclick}"><i class="fa ${icon}"></i></button>`;
  const tabs = (id, onPick) => { const bar = $(id); bar.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; bar.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b)); onPick(b.dataset.t); }); };

  /* ═══════════ SERVICES ═══════════ */
  const catFields = [
    { k: 'name', label: 'Category name' }, { k: 'slug', label: 'URL slug', hint: 'Leave blank to generate from the name' },
    { k: 'tagline', label: 'Tagline', span2: true }, { k: 'description', label: 'Description', type: 'textarea', span2: true },
    { k: 'icon', label: 'Icon (Font Awesome class)', def: 'fa-star', hint: 'e.g. fa-bullhorn, fa-code, fa-database' }, { k: 'sort_order', label: 'Sort order', type: 'number', def: 0 },
    { k: 'session_minutes', label: 'Session length (minutes)', type: 'number', def: 30, min: 10, max: 240 }, { k: 'status', label: 'Visibility', type: 'select', opts: [['ACTIVE', 'Visible'], ['HIDDEN', 'Hidden']] },
    { k: 'host_name', label: 'Session host name', def: 'AdConnect Team' }, { k: 'host_key', label: 'Calendar key', def: 'team', hint: 'Categories with the same key share one calendar (no double-booking)' },
    { k: 'allow_booking', label: 'Accept session bookings', type: 'checkbox', def: true }, { k: 'allow_proposal', label: 'Accept project proposals', type: 'checkbox', def: true },
  ];
  const svcFields = [
    { k: 'name', label: 'Service name' }, { k: 'icon', label: 'Icon', def: 'fa-check' },
    { k: 'summary', label: 'Short summary', span2: true }, { k: 'description', label: 'Full description', type: 'textarea', span2: true },
    { k: 'features', label: 'Key features (one per line)', type: 'textarea', span2: true },
    { k: 'starting_price', label: 'Starting price', ph: 'e.g. KES 15,000 or "On request"' }, { k: 'delivery_time', label: 'Typical delivery', ph: 'e.g. 2–4 weeks' },
    { k: 'sort_order', label: 'Sort order', type: 'number', def: 0 }, { k: 'status', label: 'Visibility', type: 'select', opts: [['ACTIVE', 'Visible'], ['HIDDEN', 'Hidden']] },
    { k: 'featured', label: 'Featured service', type: 'checkbox', span2: true },
  ];
  const services = {
    list: [],
    async load() {
      try {
        services.list = await call('service-categories?all=1');
        const body = $('servicesBody');
        if (!services.list.length) { body.innerHTML = '<div class="content-panel" style="padding:30px;text-align:center;color:var(--clr-text-muted)">No categories yet — add your first one.</div>'; return; }
        body.innerHTML = services.list.map((c) => `
          <div class="content-panel" style="margin-bottom:16px">
            <div class="panel-header" style="align-items:flex-start;gap:10px">
              <div style="display:flex;gap:12px;align-items:center;min-width:0"><span style="width:40px;height:40px;border-radius:10px;background:var(--clr-primary-light);color:var(--clr-primary);display:grid;place-items:center;flex:none"><i class="fa ${E(c.icon)}"></i></span>
                <div style="min-width:0"><b>${E(c.name)}</b> ${badge(c.status)}<div style="font-size:.78rem;color:var(--clr-text-muted)">${E(c.tagline || '')}</div>
                <div class="chips" style="margin-top:6px"><span class="chip">${c.session_minutes} min</span><span class="chip">${E(c.host_name || 'team')}</span>${c.allow_booking ? '<span class="chip">Booking</span>' : ''}${c.allow_proposal ? '<span class="chip">Proposals</span>' : ''}<span class="chip">/${E(c.slug)}</span></div></div></div>
              <div class="panel-actions">${iconBtn('fa-plus', 'Add service', `AX.services.editSvc('${c.id}')`, 'btn-accent')}${iconBtn('fa-pen', 'Edit category', `AX.services.editCat('${c.id}')`)}${iconBtn('fa-trash', 'Delete category', `AX.services.delCat('${c.id}')`, 'btn-danger')}</div>
            </div>
            <div class="data-table-wrapper"><table class="data-table"><thead><tr><th>Service</th><th>Price</th><th>Delivery</th><th>Status</th><th>Actions</th></tr></thead><tbody>
            ${(c.services || []).map((s) => row([['Service', `<strong>${E(s.name)}</strong>${s.featured ? ' <span class="chip">★</span>' : ''}<div style="font-size:.74rem;color:var(--clr-text-muted)">${E(s.summary || '')}</div>`], ['Price', E(s.starting_price || '—')], ['Delivery', E(s.delivery_time || '—')], ['Status', badge(s.status)],
              ['', iconBtn('fa-pen', 'Edit', `AX.services.editSvc('${c.id}','${s.id}')`) + iconBtn('fa-trash', 'Delete', `AX.services.delSvc('${s.id}')`, 'btn-danger'), 'actions-cell']])).join('') || empty(5, 'No services in this category yet')}
            </tbody></table></div></div>`).join('');
      } catch (e) { bad(e); }
    },
    editCat(id) {
      const c = services.list.find((x) => x.id === id) || {};
      dlg(id ? 'Edit category' : 'New category', formHtml(catFields, c), [
        { label: 'Cancel', fn: closeDlg },
        { label: '<i class="fa fa-save"></i> Save', cls: 'btn-primary', fn: async () => {
          const b = readForm(catFields); if (!b.name) throw new Error('Name is required');
          const r = await call(id ? `service-categories/${id}` : 'service-categories', { method: id ? 'PUT' : 'POST', body: b });
          ok(r.message); closeDlg(); services.load();
        } }]);
    },
    editSvc(catId, id) {
      const cat = services.list.find((x) => x.id === catId); const s = ((cat && cat.services) || []).find((x) => x.id === id) || {};
      dlg(id ? 'Edit service' : `New service in ${cat ? cat.name : ''}`, formHtml(svcFields, { ...s, features: (s.features || []).join('\n') }), [
        { label: 'Cancel', fn: closeDlg },
        { label: '<i class="fa fa-save"></i> Save', cls: 'btn-primary', fn: async () => {
          const b = readForm(svcFields); if (!b.name) throw new Error('Name is required'); b.category_id = catId;
          const r = await call(id ? `services/${id}` : 'services', { method: id ? 'PUT' : 'POST', body: b });
          ok(r.message); closeDlg(); services.load();
        } }]);
    },
    async delCat(id) { if (!confirm('Delete this category and ALL its services?')) return; try { ok((await call(`service-categories/${id}`, { method: 'DELETE' })).message); services.load(); } catch (e) { bad(e); } },
    async delSvc(id) { if (!confirm('Delete this service?')) return; try { ok((await call(`services/${id}`, { method: 'DELETE' })).message); services.load(); } catch (e) { bad(e); } },
  };

  /* ═══════════ BOOKINGS ═══════════ */
  const DAYS = [[1, 'Mon'], [2, 'Tue'], [3, 'Wed'], [4, 'Thu'], [5, 'Fri'], [6, 'Sat'], [7, 'Sun']];
  const bookings = {
    list: [], inited: false,
    init() {
      if (bookings.inited) return; bookings.inited = true;
      tabs('bookingTabs', (t) => { $('bookingList').hidden = t !== 'list'; $('bookingRules').hidden = t !== 'rules'; if (t === 'rules') bookings.loadRules(); });
      const re = debounce(() => bookings.load());
      ['bkSearch'].forEach((i) => $(i).addEventListener('input', re));
      ['bkStatus', 'bkCat', 'bkFrom', 'bkTo'].forEach((i) => $(i).addEventListener('change', () => bookings.load()));
    },
    async load() {
      bookings.init();
      try {
        const cats = await call('service-categories');
        const cur = $('bkCat').value;
        $('bkCat').innerHTML = '<option value="">All categories</option>' + cats.map((c) => `<option value="${E(c.slug)}">${E(c.name)}</option>`).join('');
        $('bkCat').value = cur;
        const qs = new URLSearchParams({ status: $('bkStatus').value, category: $('bkCat').value, from: $('bkFrom').value, to: $('bkTo').value, q: $('bkSearch').value });
        [...qs.keys()].forEach((k) => { if (!qs.get(k)) qs.delete(k); });
        const [list, stats] = await Promise.all([call(`bookings?${qs}`), call('bookings/stats')]);
        bookings.list = list;
        const by = Object.fromEntries(stats.byStatus.map((s) => [s.status, s.n]));
        $('bookingKpis').innerHTML = [['Upcoming', stats.upcoming], ['Pending', by.PENDING || 0], ['Confirmed', by.CONFIRMED || 0], ['Completed', by.COMPLETED || 0], ['Cancelled', by.CANCELLED || 0]].map(([l, n]) => `<div class="kpi"><b>${n}</b><span>${l}</span></div>`).join('');
        setBadge('bkBadge', by.PENDING || 0);
        $('bkRows').innerHTML = list.length ? list.map((b, i) => row([
          ['Ref', `<span style="font-family:var(--font-mono);font-size:.74rem">${E(b.reference)}</span>`],
          ['Client', `<strong>${E(b.name)}</strong><div style="font-size:.74rem;color:var(--clr-text-muted)">${E(b.email)}<br>${E(b.phone)}</div>`],
          ['Service', `${E(b.category_name)}${b.service_name ? `<div style="font-size:.74rem;color:var(--clr-text-muted)">${E(b.service_name)}</div>` : ''}`],
          ['When', `${E(dayOf(b.booking_date))}<div style="font-size:.74rem;color:var(--clr-text-muted)">${t12(b.start_time)} – ${t12(b.end_time)}</div>`],
          ['Format', E({ ONLINE: 'Online', IN_PERSON: 'In person', PHONE: 'Phone' }[b.session_mode] || b.session_mode)],
          ['Status', badge(b.status)],
          ['', (b.status === 'PENDING' ? iconBtn('fa-check', 'Confirm', `AX.bookings.quick(${i},'CONFIRMED')`, 'btn-accent') : '') + iconBtn('fa-eye', 'Open', `AX.bookings.open(${i})`), 'actions-cell'],
        ])).join('') : empty(7, 'No bookings match your filters');
      } catch (e) { bad(e); }
    },
    async quick(i, status) { try { ok((await call(`bookings/${bookings.list[i].id}`, { method: 'PUT', body: { status } })).message); bookings.load(); } catch (e) { bad(e); } },
    open(i) {
      const b = bookings.list[i];
      const f = [
        { k: 'status', label: 'Status', type: 'select', opts: ['PENDING', 'CONFIRMED', 'RESCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'] },
        { k: 'session_mode', label: 'Format', type: 'select', opts: [['ONLINE', 'Online (Meet)'], ['IN_PERSON', 'In person'], ['PHONE', 'Phone call']] },
        { k: 'booking_date', label: 'Date', type: 'date' }, { k: 'start_time', label: 'Start time', type: 'time' },
        { k: 'meeting_link', label: 'Meeting link', span2: true }, { k: 'location', label: 'Location', span2: true },
        { k: 'admin_notes', label: 'Internal notes', type: 'textarea', span2: true },
        { k: 'notify', label: 'E-mail the client about changes', type: 'checkbox', def: true, span2: true },
      ];
      const info = `<dl class="kv"><dt>Reference</dt><dd>${E(b.reference)}</dd><dt>Client</dt><dd>${E(b.name)}${b.company ? ` · ${E(b.company)}` : ''}</dd><dt>Contact</dt><dd><a href="mailto:${E(b.email)}">${E(b.email)}</a> · <a href="tel:${E(b.phone)}">${E(b.phone)}</a></dd><dt>Service</dt><dd>${E(b.category_name)}${b.service_name ? ' — ' + E(b.service_name) : ''}</dd><dt>Host</dt><dd>${E(b.host_name || '—')}</dd><dt>Topic</dt><dd>${E(b.topic || '—')}</dd></dl>`;
      dlg(`Booking ${b.reference}`, info + formHtml(f, { ...b, notify: true }), [
        { label: '<i class="fa fa-trash"></i>', cls: 'btn-danger', fn: async () => { if (!confirm('Delete this booking permanently?')) return; ok((await call(`bookings/${b.id}`, { method: 'DELETE' })).message); closeDlg(); bookings.load(); } },
        { label: '<i class="fa fa-bell"></i> Reminder', fn: async () => ok((await call(`bookings/${b.id}/reminder`, { method: 'POST' })).message) },
        { label: '<i class="fa fa-video"></i> Meet link', fn: async () => { const r = await call(`bookings/${b.id}/meet-link`, { method: 'POST' }); $('f_meeting_link').value = r.meeting_link; ok('Meet link created'); } },
        { label: '<i class="fa fa-save"></i> Save', cls: 'btn-primary', fn: async () => {
          const v = readForm(f); const r = await call(`bookings/${b.id}`, { method: 'PUT', body: v });
          ok(r.message); closeDlg(); bookings.load();
        } }]);
    },
    async loadRules() {
      try {
        const s = await call('site-settings/booking');
        const days = String(s.days || '1,2,3,4,5,6').split(',').map(Number);
        $('rulesForm').innerHTML = `
          <div class="span2"><label class="label">Days available</label><div class="chips" id="ruleDays">${DAYS.map(([n, l]) => `<label class="chip" style="cursor:pointer;display:inline-flex;gap:6px;align-items:center;padding:6px 12px"><input type="checkbox" value="${n}" ${days.includes(n) ? 'checked' : ''}/>${l}</label>`).join('')}</div></div>
          <div><label class="label">Opens</label><input class="input-field" type="time" id="rl_start" value="${E(s.start || '09:00')}"/></div>
          <div><label class="label">Closes (last session must end by)</label><input class="input-field" type="time" id="rl_end" value="${E(s.end || '17:00')}"/></div>
          <div><label class="label">Minimum notice (hours)</label><input class="input-field" type="number" min="0" id="rl_notice" value="${E(s.min_notice_hours || 12)}"/></div>
          <div><label class="label">Bookable up to (days ahead)</label><input class="input-field" type="number" min="1" id="rl_ahead" value="${E(s.max_days_ahead || 60)}"/></div>
          <div><label class="label">Buffer between sessions (minutes)</label><input class="input-field" type="number" min="0" id="rl_buffer" value="${E(s.buffer_minutes || 0)}"/></div>
          <div><label class="label" style="display:flex;gap:8px;align-items:center;margin-top:26px"><input type="checkbox" id="rl_auto" ${s.auto_confirm === 'true' ? 'checked' : ''}/> Confirm bookings automatically</label></div>
          <div class="span2"><label class="label">Blocked dates (YYYY-MM-DD, separated by commas or new lines)</label><textarea class="input-field" id="rl_blocked">${E(String(s.blocked_dates || '').replace(/[,\s]+/g, '\n'))}</textarea></div>
          <div class="span2"><label class="label">In-person location</label><input class="input-field" id="rl_loc" value="${E(s.in_person_location || '')}"/></div>
          <div class="span2"><label class="label">Note shown to clients booking online</label><input class="input-field" id="rl_note" value="${E(s.online_provider_note || '')}"/></div>`;
      } catch (e) { bad(e); }
    },
    async saveRules() {
      try {
        const days = [...document.querySelectorAll('#ruleDays input:checked')].map((i) => i.value).join(',');
        if (!days) throw new Error('Select at least one day');
        const body = { days, start: $('rl_start').value, end: $('rl_end').value, min_notice_hours: $('rl_notice').value, max_days_ahead: $('rl_ahead').value, buffer_minutes: $('rl_buffer').value,
          auto_confirm: String($('rl_auto').checked), blocked_dates: $('rl_blocked').value.split(/[\s,]+/).filter(Boolean).join(','), in_person_location: $('rl_loc').value, online_provider_note: $('rl_note').value };
        if (body.start >= body.end) throw new Error('Closing time must be after opening time');
        ok((await call('site-settings/booking', { method: 'PUT', body })).message);
      } catch (e) { bad(e); }
    },
  };

  /* ═══════════ PROPOSALS ═══════════ */
  const PSTAT = ['NEW', 'UNDER_REVIEW', 'NEEDS_INFO', 'QUOTED', 'ACCEPTED', 'DECLINED', 'COMPLETED'];
  const proposals = {
    list: [], inited: false,
    async load() {
      if (!proposals.inited) {
        proposals.inited = true;
        $('prSearch').addEventListener('input', debounce(() => proposals.load()));
        ['prStatus', 'prCat'].forEach((i) => $(i).addEventListener('change', () => proposals.load()));
      }
      try {
        const cats = await call('service-categories'); const cur = $('prCat').value;
        $('prCat').innerHTML = '<option value="">All categories</option>' + cats.map((c) => `<option value="${E(c.slug)}">${E(c.name)}</option>`).join(''); $('prCat').value = cur;
        const qs = new URLSearchParams({ status: $('prStatus').value, category: $('prCat').value, q: $('prSearch').value }); [...qs.keys()].forEach((k) => { if (!qs.get(k)) qs.delete(k); });
        proposals.list = await call(`proposals?${qs}`);
        setBadge('prBadge', proposals.list.filter((p) => p.status === 'NEW').length);
        $('prRows').innerHTML = proposals.list.length ? proposals.list.map((p, i) => row([
          ['Ref', `<span style="font-family:var(--font-mono);font-size:.74rem">${E(p.reference)}</span>`],
          ['Client', `<strong>${E(p.name)}</strong><div style="font-size:.74rem;color:var(--clr-text-muted)">${E(p.email)}${p.company ? '<br>' + E(p.company) : ''}</div>`],
          ['Project', `<strong>${E(p.title)}</strong><div style="font-size:.74rem;color:var(--clr-text-muted)">${E([p.budget_range, p.timeline].filter(Boolean).join(' · '))}</div>`],
          ['Category', E(p.category_name || '—')], ['Files', p.file_count ? `<i class="fa fa-paperclip"></i> ${p.file_count}` : '—'],
          ['Status', badge(p.status)], ['Received', E(dayOf(p.created_at))],
          ['', iconBtn('fa-eye', 'Open', `AX.proposals.open(${i})`), 'actions-cell'],
        ])).join('') : empty(8, 'No proposals yet');
      } catch (e) { bad(e); }
    },
    async open(i) {
      try {
        const p = await call(`proposals/${proposals.list[i].id}`);
        const files = p.files.map((f) => `<div class="file-chip" style="display:flex;gap:10px;align-items:center;padding:8px 10px;border:1px solid var(--clr-border);border-radius:8px;margin-bottom:6px"><i class="fa fa-file" style="color:var(--clr-primary)"></i><span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${E(f.original_name)}</span><span style="color:var(--clr-text-muted);font-size:.74rem">${(f.size / 1048576).toFixed(1)} MB</span><button class="btn btn-secondary btn-sm" onclick="AX.proposals.download('${p.id}','${f.id}','${E(f.original_name).replace(/'/g, '')}')"><i class="fa fa-download"></i></button></div>`).join('') || '<div style="color:var(--clr-text-muted)">No files attached</div>';
        const replies = p.replies.map((r) => `<div style="border-left:3px solid var(--clr-primary);padding:4px 10px;margin-bottom:8px"><b>${E(r.subject)}</b><div style="font-size:.72rem;color:var(--clr-text-muted)">${E(r.sent_by)} · ${when(r.created_at)}${r.email_ok ? '' : ' · e-mail failed'}</div><div style="white-space:pre-wrap;font-size:.86rem">${E(r.body)}</div></div>`).join('');
        const f = [{ k: 'status', label: 'Status', type: 'select', opts: PSTAT }, { k: 'quote_amount', label: 'Quote amount', ph: 'e.g. KES 120,000' }, { k: 'admin_notes', label: 'Internal notes', type: 'textarea', span2: true },
          { k: 'notify', label: 'E-mail the client when the status changes', type: 'checkbox', span2: true }];
        dlg(`Proposal ${p.reference}`, `<dl class="kv"><dt>Client</dt><dd>${E(p.name)}${p.company ? ' · ' + E(p.company) : ''}</dd><dt>Contact</dt><dd><a href="mailto:${E(p.email)}">${E(p.email)}</a>${p.phone ? ' · <a href="tel:' + E(p.phone) + '">' + E(p.phone) + '</a>' : ''}</dd>
          <dt>Category</dt><dd>${E(p.category_name || '—')}${p.service_name ? ' — ' + E(p.service_name) : ''}</dd><dt>Budget</dt><dd>${E(p.budget_range || '—')}</dd><dt>Timeline</dt><dd>${E(p.timeline || '—')}</dd><dt>Project</dt><dd><b>${E(p.title)}</b></dd></dl>
          <div style="white-space:pre-wrap;background:var(--clr-surface-2);padding:12px;border-radius:8px;font-size:.88rem">${E(p.summary || '(no description)')}</div>
          <div><b style="font-size:.8rem">Attachments</b><div style="margin-top:8px">${files}</div></div>${formHtml(f, p)}
          ${replies ? `<div><b style="font-size:.8rem">Conversation</b><div style="margin-top:8px">${replies}</div></div>` : ''}`, [
          { label: '<i class="fa fa-trash"></i>', cls: 'btn-danger', fn: async () => { if (!confirm('Delete this proposal and its files?')) return; ok((await call(`proposals/${p.id}`, { method: 'DELETE' })).message); closeDlg(); proposals.load(); } },
          { label: '<i class="fa fa-reply"></i> Reply', fn: () => proposals.reply(p) },
          { label: '<i class="fa fa-save"></i> Save', cls: 'btn-primary', fn: async () => { ok((await call(`proposals/${p.id}`, { method: 'PUT', body: readForm(f) })).message); closeDlg(); proposals.load(); } }]);
      } catch (e) { bad(e); }
    },
    reply(p) {
      const f = [{ k: 'subject', label: 'Subject', def: `Re: your proposal ${p.reference}`, span2: true }, { k: 'body', label: 'Message', type: 'textarea', span2: true }, { k: 'status', label: 'Also set status to', type: 'select', opts: [['', '(leave unchanged)'], ...PSTAT] }];
      dlg(`Reply to ${p.name}`, formHtml(f, {}), [{ label: 'Back', fn: () => proposals.open(proposals.list.findIndex((x) => x.id === p.id)) },
        { label: '<i class="fa fa-paper-plane"></i> Send', cls: 'btn-primary', fn: async () => { const v = readForm(f); if (!v.body) throw new Error('Write a message first'); ok((await call(`proposals/${p.id}/reply`, { method: 'POST', body: v })).message); closeDlg(); proposals.load(); } }]);
    },
    download(id, fid, name) { downloadAuthed(`${API}proposals/${id}/files/${fid}`, name).catch(bad); },
  };

  /* ═══════════ SUBSCRIBERS ═══════════ */
  const TOPICS = ['digital-marketing', 'web-development', 'software-development', 'software-design', 'database-management', 'consulting', 'data-analytics', 'training'];
  const subs = {
    list: [], inited: false,
    async load() {
      if (!subs.inited) {
        subs.inited = true;
        $('sbSearch').addEventListener('input', debounce(() => subs.load()));
        ['sbStatus', 'sbSource'].forEach((i) => $(i).addEventListener('change', () => subs.load()));
      }
      try {
        const qs = new URLSearchParams({ status: $('sbStatus').value, source: $('sbSource').value, q: $('sbSearch').value }); [...qs.keys()].forEach((k) => { if (!qs.get(k)) qs.delete(k); });
        const [list, st] = await Promise.all([call(`subscribers?${qs}`), call('subscribers/stats')]);
        subs.list = list;
        $('subKpis').innerHTML = [['Subscribed', st.subscribed], ['Pending', st.pending], ['Unsubscribed', st.unsubscribed], ['New (30 days)', st.last30], ['Emails sent (30 days)', st.sent30], ['Due now', st.due]].map(([l, n]) => `<div class="kpi"><b>${n}</b><span>${l}</span></div>`).join('');
        const cur = $('sbSource').value;
        $('sbSource').innerHTML = '<option value="">All sources</option>' + st.sources.map((s) => `<option value="${E(s.source)}">${E(s.source)} (${s.count})</option>`).join(''); $('sbSource').value = cur;
        $('sbRows').innerHTML = list.length ? list.map((s, i) => {
          let ints = []; try { ints = JSON.parse(s.interests || '[]'); } catch { /* ignore */ }
          return row([['Email', `<strong>${E(s.email)}</strong>${s.phone ? `<div style="font-size:.74rem;color:var(--clr-text-muted)">${E(s.phone)}</div>` : ''}`], ['Name', E(s.name || '—')],
            ['Interests', ints.length ? `<div class="chips">${ints.map((x) => `<span class="chip">${E(x.replace(/-/g, ' '))}</span>`).join('')}</div>` : '<span style="color:var(--clr-text-muted)">All</span>'],
            ['Source', E(s.source || '—')], ['Progress', s.current_step >= 0 ? `Email ${s.current_step}${s.next_send_at ? `<div style="font-size:.72rem;color:var(--clr-text-muted)">next ${when(s.next_send_at)}</div>` : ''}` : 'Not started'],
            ['Status', badge(s.status)], ['', iconBtn('fa-pen', 'Edit', `AX.subs.edit(${i})`) + iconBtn('fa-clock-rotate-left', 'Email history', `AX.subs.history(${i})`) + iconBtn('fa-trash', 'Delete', `AX.subs.del(${i})`, 'btn-danger'), 'actions-cell']]);
        }).join('') : empty(7, 'No subscribers match your filters');
      } catch (e) { bad(e); }
    },
    edit(i) {
      const s = i == null ? {} : subs.list[i]; let ints = []; try { ints = JSON.parse(s.interests || '[]'); } catch { /* ignore */ }
      const f = [{ k: 'email', label: 'Email', span2: i == null ? false : true }, { k: 'name', label: 'Name' }, { k: 'phone', label: 'Phone' },
        { k: 'status', label: 'Status', type: 'select', opts: ['SUBSCRIBED', 'PENDING', 'UNSUBSCRIBED', 'BOUNCED'], def: 'SUBSCRIBED' }, { k: 'notes', label: 'Notes', type: 'textarea', span2: true }];
      const topics = `<div class="span2"><label class="label">Interests (none selected = everything)</label><div class="chips" id="sbTopics">${TOPICS.map((t) => `<label class="chip" style="cursor:pointer;padding:6px 12px;display:inline-flex;gap:6px;align-items:center"><input type="checkbox" value="${t}" ${ints.includes(t) ? 'checked' : ''}/>${t.replace(/-/g, ' ')}</label>`).join('')}</div></div>`;
      let html = formHtml(f, s).replace('</div></div>', `</div>${topics}</div>`);
      if (i == null) html += '<label class="label" style="display:flex;gap:8px;align-items:center;margin-top:10px"><input type="checkbox" id="sbWelcome" checked/> Send the welcome email now</label>';
      else html = `<div style="font-size:.8rem;color:var(--clr-text-muted)">Editing <b>${E(s.email)}</b></div>` + html.replace(/<div class="span2"?[^>]*><label class="label" for="f_email">.*?<\/div>/s, '');
      dlg(i == null ? 'Add subscriber' : 'Edit subscriber', html, [{ label: 'Cancel', fn: closeDlg },
        { label: '<i class="fa fa-save"></i> Save', cls: 'btn-primary', fn: async () => {
          const v = i == null ? readForm(f) : { ...readForm(f.filter((x) => x.k !== 'email')) };
          v.interests = [...document.querySelectorAll('#sbTopics input:checked')].map((x) => x.value);
          if (i == null) { v.send_welcome = $('sbWelcome').checked; ok((await call('subscribers', { method: 'POST', body: v })).message); }
          else ok((await call(`subscribers/${s.id}`, { method: 'PUT', body: v })).message);
          closeDlg(); subs.load();
        } }]);
    },
    async del(i) { if (!confirm(`Delete ${subs.list[i].email}?`)) return; try { ok((await call(`subscribers/${subs.list[i].id}`, { method: 'DELETE' })).message); subs.load(); } catch (e) { bad(e); } },
    async history(i) {
      const s = subs.list[i];
      try {
        const log = await call(`subscribers/${s.id}/log`);
        dlg(`Emails sent to ${s.email}`, log.length ? `<div class="data-table-wrapper"><table class="data-table"><thead><tr><th>When</th><th>Type</th><th>Step</th><th>Subject</th><th>Result</th></tr></thead><tbody>${log.map((l) => row([['When', when(l.created_at)], ['Type', E(l.kind)], ['Step', l.step == null ? '—' : l.step], ['Subject', E(l.subject)], ['Result', badge(l.status) + (l.error ? `<div style="font-size:.7rem;color:var(--clr-error)">${E(l.error)}</div>` : '')]])).join('')}</tbody></table></div>` : '<div style="color:var(--clr-text-muted)">Nothing sent yet.</div>',
          [{ label: 'Restart sequence', fn: async () => { if (!confirm('Restart the email sequence from the welcome email?')) return; ok((await call(`subscribers/${s.id}/reset`, { method: 'POST' })).message); closeDlg(); subs.load(); } },
            { label: 'Send next email now', fn: async () => { ok((await call(`subscribers/${s.id}/send-step`, { method: 'POST', body: {} })).message); closeDlg(); subs.load(); } },
            { label: 'Close', cls: 'btn-primary', fn: closeDlg }]);
      } catch (e) { bad(e); }
    },
    exportCsv() { downloadAuthed(`${API}subscribers/export`, 'subscribers.csv').catch(bad); },
    importDlg() {
      dlg('Import subscribers', `<p style="font-size:.86rem">Upload a CSV with a header row. Columns: <code>email</code> (required), <code>name</code>, <code>phone</code>, <code>interests</code> (separated by ; ), <code>status</code>, <code>subscribed_at</code> (YYYY-MM-DD).</p>
        <input type="file" id="impFile" accept=".csv,text/csv" class="input-field"/>
        <label class="label" style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="impWelcome"/> Send the welcome email to new subscribers</label>
        <div style="font-size:.74rem;color:var(--clr-text-muted)">Imported people who joined earlier continue the sequence from the right point instead of starting again.</div>`,
        [{ label: 'Cancel', fn: closeDlg }, { label: '<i class="fa fa-upload"></i> Import', cls: 'btn-primary', fn: async () => {
          const file = $('impFile').files[0]; if (!file) throw new Error('Choose a CSV file');
          const rows = parseCsv(await file.text()); if (!rows.length) throw new Error('No rows found');
          const r = await call('subscribers/import', { method: 'POST', body: { rows, send_welcome: $('impWelcome').checked } });
          ok(r.message); closeDlg(); subs.load();
        } }]);
    },
  };
  function parseCsv(text) {
    const lines = []; let cur = [], field = '', q = false;
    text = text.replace(/^﻿/, '');
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) { if (c === '"' && text[i + 1] === '"') { field += '"'; i++; } else if (c === '"') q = false; else field += c; }
      else if (c === '"') q = true;
      else if (c === ',') { cur.push(field); field = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; cur.push(field); field = ''; if (cur.some((x) => x.trim())) lines.push(cur); cur = []; }
      else field += c;
    }
    cur.push(field); if (cur.some((x) => x.trim())) lines.push(cur);
    const head = (lines.shift() || []).map((h) => h.trim().toLowerCase());
    return lines.map((l) => Object.fromEntries(head.map((h, i) => [h, (l[i] || '').trim()])));
  }

  /* ═══════════ CAMPAIGNS ═══════════ */
  const CATS = ['welcome', 'general', ...TOPICS];
  const camp = {
    tab: 'steps', inited: false, steps: [], bcs: [],
    load() { if (!camp.inited) { camp.inited = true; tabs('campTabs', (t) => { camp.tab = t; camp.refresh(); }); } camp.refresh(); },
    refresh() { ({ steps: camp.showSteps, broadcasts: camp.showBroadcasts, log: camp.showLog, settings: camp.showSettings })[camp.tab](); },
    async showSteps() {
      try {
        const [steps, st] = await Promise.all([call('campaign/steps'), call('campaign/stats')]);
        camp.steps = steps;
        $('campBody').innerHTML = `<div class="kpis" style="margin-bottom:14px">${[['Sequence', st.enabled ? 'On' : 'Paused'], ['Active emails', st.active_steps], ['Sent (all time)', st.sent], ['Failed', st.failed]].map(([l, n]) => `<div class="kpi"><b>${n}</b><span>${l}</span></div>`).join('')}</div>
          <div class="toolbar" style="margin-bottom:12px"><button class="btn btn-accent btn-sm" onclick="AX.camp.editStep()"><i class="fa fa-plus"></i> New email</button><button class="btn btn-secondary btn-sm" onclick="AX.camp.run()"><i class="fa fa-play"></i> Send due emails now</button></div>
          <div style="display:grid;gap:8px">${steps.map((s) => `<div class="step-edit"><span class="no">#${s.step}</span><div class="tt"><b>${E(s.subject)}</b><small>Day ${s.day_offset} · ${E(s.category)} · sent ${s.sent_count}× ${s.status === 'ACTIVE' ? '' : '· ' + s.status}</small></div>${iconBtn('fa-eye', 'Preview', `AX.camp.preview('${s.id}')`)}${iconBtn('fa-pen', 'Edit', `AX.camp.editStep('${s.id}')`)}${iconBtn('fa-trash', 'Delete', `AX.camp.delStep('${s.id}')`, 'btn-danger')}</div>`).join('')}</div>`;
      } catch (e) { bad(e); }
    },
    stepFields: [
      { k: 'subject', label: 'Subject line', span2: true }, { k: 'preheader', label: 'Preview text', span2: true }, { k: 'kicker', label: 'Small label above the title' }, { k: 'title', label: 'Email heading' },
      { k: 'day_offset', label: 'Send on day (after subscribing)', type: 'number', def: 0, min: 0 }, { k: 'category', label: 'Topic', type: 'select', opts: CATS },
      { k: 'body_html', label: 'Body (HTML: <p>, <ul>, <strong>, <a>) — use {{firstName}} to personalise', type: 'textarea', span2: true },
      { k: 'cta_text', label: 'Button text' }, { k: 'cta_url', label: 'Button link (/book.html or full URL)' }, { k: 'status', label: 'Status', type: 'select', opts: [['ACTIVE', 'Active'], ['PAUSED', 'Paused']] },
    ],
    editStep(id) {
      const s = camp.steps.find((x) => x.id === id) || {};
      const f = camp.stepFields;
      dlg(id ? `Edit email #${s.step}` : 'New email', formHtml(f, s).replace('<textarea class="input-field" id="f_body_html"', '<textarea class="input-field" style="min-height:240px;font-family:var(--font-mono);font-size:.82rem" id="f_body_html"'), [
        { label: 'Cancel', fn: closeDlg }, { label: '<i class="fa fa-eye"></i> Preview', fn: () => camp.previewDraft(readForm(f)) },
        { label: '<i class="fa fa-paper-plane"></i> Test', fn: () => camp.testDraft(readForm(f)) },
        { label: '<i class="fa fa-save"></i> Save', cls: 'btn-primary', fn: async () => { const v = readForm(f); ok((await call(id ? `campaign/steps/${id}` : 'campaign/steps', { method: id ? 'PUT' : 'POST', body: v })).message); closeDlg(); camp.refresh(); } }]);
    },
    async preview(id) { try { const r = await call('campaign/preview', { method: 'POST', body: { id } }); camp.frame(r.subject, r.html); } catch (e) { bad(e); } },
    async previewDraft(v) { try { const r = await call('campaign/preview', { method: 'POST', body: v }); camp.frame(r.subject, r.html); } catch (e) { bad(e); } },
    frame(subject, html) {
      const w = window.open('', '_blank');
      if (!w) { toast('Allow pop-ups to preview the email', 'error'); return; }
      w.document.write(`<title>${E(subject)}</title><body style="margin:0">${html}</body>`); w.document.close();
    },
    async testDraft(v) { const to = prompt('Send a test to which address?', (window.session && session.email) || ''); if (!to) return; try { ok((await call('campaign/test', { method: 'POST', body: { ...v, to } })).message); } catch (e) { bad(e); } },
    async delStep(id) { if (!confirm('Delete this email from the sequence?')) return; try { ok((await call(`campaign/steps/${id}`, { method: 'DELETE' })).message); camp.refresh(); } catch (e) { bad(e); } },
    async run() { try { const r = await withLoader('Sending…', () => call('campaign/run', { method: 'POST' })); ok(r.busy ? 'A run is already in progress' : `Checked ${r.checked}: ${r.sent} sent, ${r.failed} failed`); camp.refresh(); } catch (e) { bad(e); } },

    async showBroadcasts() {
      try {
        camp.bcs = await call('broadcasts');
        $('campBody').innerHTML = `<div class="toolbar" style="margin-bottom:12px"><button class="btn btn-accent btn-sm" onclick="AX.camp.editBc()"><i class="fa fa-plus"></i> New broadcast</button></div>
          <div class="content-panel"><div class="data-table-wrapper"><table class="data-table"><thead><tr><th>Subject</th><th>Audience</th><th>Status</th><th>Sent</th><th>Actions</th></tr></thead><tbody>${camp.bcs.length ? camp.bcs.map((b, i) => row([
          ['Subject', `<strong>${E(b.subject)}</strong>`], ['Audience', E(b.audience)], ['Status', badge(b.status)], ['Sent', b.status === 'DRAFT' ? '—' : `${b.sent_count}/${b.recipients}${b.failed_count ? ` (${b.failed_count} failed)` : ''}<div style="font-size:.72rem;color:var(--clr-text-muted)">${when(b.sent_at)}</div>`],
          ['', (b.status === 'DRAFT' ? iconBtn('fa-pen', 'Edit', `AX.camp.editBc(${i})`) + iconBtn('fa-paper-plane', 'Send', `AX.camp.sendBc(${i})`, 'btn-accent') : '') + iconBtn('fa-trash', 'Delete', `AX.camp.delBc(${i})`, 'btn-danger'), 'actions-cell']])).join('') : empty(5, 'No broadcasts yet — write one to email all your subscribers at once')}</tbody></table></div></div>`;
      } catch (e) { bad(e); }
    },
    editBc(i) {
      const b = i == null ? {} : camp.bcs[i];
      const f = [{ k: 'subject', label: 'Subject line', span2: true }, { k: 'preheader', label: 'Preview text', span2: true }, { k: 'title', label: 'Heading' },
        { k: 'audience', label: 'Send to', type: 'select', opts: [['ALL', 'All subscribers'], ...TOPICS.map((t) => [`interest:${t}`, `Interested in ${t.replace(/-/g, ' ')}`])] },
        { k: 'body_html', label: 'Message (HTML: <p>, <ul>, <strong>, <a>) — {{firstName}} personalises', type: 'textarea', span2: true }, { k: 'cta_text', label: 'Button text' }, { k: 'cta_url', label: 'Button link' }];
      dlg(i == null ? 'New broadcast' : 'Edit broadcast', formHtml(f, b).replace('<textarea class="input-field" id="f_body_html"', '<textarea class="input-field" style="min-height:220px;font-family:var(--font-mono);font-size:.82rem" id="f_body_html"') + '<div id="audCount" style="font-size:.8rem;color:var(--clr-text-muted)"></div>', [
        { label: 'Cancel', fn: closeDlg },
        { label: '<i class="fa fa-users"></i> Count recipients', fn: async () => { const a = $('f_audience').value; const r = await call(`broadcasts/audience?audience=${encodeURIComponent(a)}`); $('audCount').textContent = `${r.count} subscriber${r.count === 1 ? '' : 's'} will receive this.`; } },
        { label: '<i class="fa fa-save"></i> Save draft', cls: 'btn-primary', fn: async () => { const v = readForm(f); ok((await call(i == null ? 'broadcasts' : `broadcasts/${b.id}`, { method: i == null ? 'POST' : 'PUT', body: v })).message); closeDlg(); camp.refresh(); } }]);
    },
    async sendBc(i) {
      const b = camp.bcs[i];
      try {
        const test = prompt('Send a test email first? Enter an address (or leave blank to skip):', (window.session && session.email) || '');
        if (test) { ok((await call(`broadcasts/${b.id}/test`, { method: 'POST', body: { to: test } })).message); }
        const n = (await call(`broadcasts/audience?audience=${encodeURIComponent(b.audience)}`)).count;
        if (!confirm(`Send "${b.subject}" to ${n} subscriber${n === 1 ? '' : 's'} now? This cannot be undone.`)) return;
        ok((await call(`broadcasts/${b.id}/send`, { method: 'POST' })).message); setTimeout(camp.refresh, 1500);
      } catch (e) { bad(e); }
    },
    async delBc(i) { if (!confirm('Delete this broadcast?')) return; try { ok((await call(`broadcasts/${camp.bcs[i].id}`, { method: 'DELETE' })).message); camp.refresh(); } catch (e) { bad(e); } },

    async showLog() {
      try {
        const log = await call('campaign/log');
        $('campBody').innerHTML = `<div class="content-panel"><div class="data-table-wrapper"><table class="data-table"><thead><tr><th>When</th><th>To</th><th>Type</th><th>Step</th><th>Subject</th><th>Result</th></tr></thead><tbody>${log.length ? log.map((l) => row([['When', when(l.created_at)], ['To', E(l.email)], ['Type', E(l.kind)], ['Step', l.step == null ? '—' : l.step], ['Subject', E(l.subject)], ['Result', badge(l.status) + (l.error ? `<div style="font-size:.7rem;color:var(--clr-error)">${E(l.error)}</div>` : '')]])).join('') : empty(6, 'Nothing has been sent yet')}</tbody></table></div></div>`;
      } catch (e) { bad(e); }
    },
    async showSettings() {
      try {
        const s = await call('campaign/settings');
        $('campBody').innerHTML = `<div class="content-panel" style="padding:20px"><div class="form-grid">
          <div class="span2"><label class="label" style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="cs_enabled" ${s.enabled !== 'false' ? 'checked' : ''}/> Drip sequence is running</label></div>
          <div class="span2"><label class="label" style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="cs_double" ${s.double_opt_in === 'true' ? 'checked' : ''}/> Require e-mail confirmation (double opt-in)</label></div>
          <div class="span2"><label class="label" style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="cs_interest" ${s.respect_interests === 'true' ? 'checked' : ''}/> Only send topic emails that match each subscriber's interests</label></div>
          <div><label class="label">Minimum days between emails</label><input class="input-field" type="number" min="0" step="0.5" id="cs_gap" value="${E(s.min_gap_days || 1)}"/></div>
          <div><label class="label">Emails per run (every 15 minutes)</label><input class="input-field" type="number" min="1" max="200" id="cs_batch" value="${E(s.batch_size || 25)}"/></div></div>
          <div style="margin-top:16px"><button class="btn btn-primary btn-sm" onclick="AX.camp.saveSettings()"><i class="fa fa-save"></i> Save</button></div>
          <p style="font-size:.8rem;margin-top:14px;color:var(--clr-text-muted)">On shared hosting you can also trigger sending from a cPanel cron job: <code>curl -s "https://YOUR-SITE/api/campaign/cron?key=YOUR_CRON_SECRET"</code></p></div>`;
      } catch (e) { bad(e); }
    },
    async saveSettings() {
      try { ok((await call('campaign/settings', { method: 'PUT', body: { enabled: $('cs_enabled').checked, double_opt_in: $('cs_double').checked, respect_interests: $('cs_interest').checked, min_gap_days: $('cs_gap').value, batch_size: $('cs_batch').value } })).message); } catch (e) { bad(e); }
    },
  };

  /* ═══════════ MESSAGES ═══════════ */
  const msgs = {
    list: [],
    async load() {
      try {
        msgs.list = await call('contact-messages');
        setBadge('msgBadge', msgs.list.filter((m) => m.status === 'UNREAD').length);
        $('msgRows').innerHTML = msgs.list.length ? msgs.list.map((m, i) => row([
          ['From', `<strong>${E(m.name)}</strong><div style="font-size:.74rem;color:var(--clr-text-muted)">${E(m.email)}${m.phone ? '<br>' + E(m.phone) : ''}</div>`], ['Subject', E(m.subject || '—')],
          ['Message', `<div style="max-width:340px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${E(m.message)}</div>`], ['Status', badge(m.status)], ['Received', E(when(m.created_at))],
          ['', iconBtn('fa-eye', 'Open', `AX.msgs.open(${i})`), 'actions-cell']])).join('') : empty(6, 'No messages yet');
      } catch (e) { bad(e); }
    },
    async open(i) {
      const m = msgs.list[i];
      if (m.status === 'UNREAD') call(`contact-messages/${m.messageId}/status`, { method: 'PUT', body: { status: 'READ' } }).then(() => msgs.load()).catch(() => {});
      const f = [{ k: 'body', label: 'Reply', type: 'textarea', span2: true }];
      dlg(m.subject || `Message from ${m.name}`, `<dl class="kv"><dt>From</dt><dd>${E(m.name)} · <a href="mailto:${E(m.email)}">${E(m.email)}</a>${m.phone ? ` · <a href="tel:${E(m.phone)}">${E(m.phone)}</a>` : ''}</dd><dt>Received</dt><dd>${E(when(m.created_at))}</dd></dl>
        <div style="white-space:pre-wrap;background:var(--clr-surface-2);padding:12px;border-radius:8px;font-size:.9rem">${E(m.message)}</div>
        ${m.reply_text ? `<div style="border-left:3px solid var(--clr-accent);padding-left:10px"><b style="font-size:.78rem">Your reply · ${E(when(m.replied_at))}</b><div style="white-space:pre-wrap;font-size:.86rem">${E(m.reply_text)}</div></div>` : ''}${formHtml(f, {})}`, [
        { label: '<i class="fa fa-trash"></i>', cls: 'btn-danger', fn: async () => { if (!confirm('Delete this message?')) return; await call(`contact-messages/${m.messageId}`, { method: 'DELETE' }); closeDlg(); msgs.load(); } },
        { label: 'Archive', fn: async () => { await call(`contact-messages/${m.messageId}/status`, { method: 'PUT', body: { status: 'ARCHIVED' } }); closeDlg(); msgs.load(); } },
        { label: '<i class="fa fa-paper-plane"></i> Send reply', cls: 'btn-primary', fn: async () => { const v = readForm(f); if (!v.body) throw new Error('Write a reply first'); ok((await call(`contact-messages/${m.messageId}/reply`, { method: 'POST', body: v })).message); closeDlg(); msgs.load(); } }]);
    },
  };

  /* ═══════════ APPEARANCE ═══════════ */
  const theme = {
    data: null, colors: {}, preset: 'custom',
    async load() {
      try {
        theme.data = await call('theme'); theme.colors = { ...theme.data.colors }; theme.preset = theme.data.preset;
        $('presetRow').innerHTML = theme.data.presets.map((p) => `<button class="preset ${p.key === theme.preset ? 'on' : ''}" data-k="${p.key}"><div class="dots">${['primary', 'accent', 'bg', 'surface_1'].map((k) => `<i style="background:${p.colors[k]}"></i>`).join('')}</div><b style="font-size:.82rem">${E(p.name)}</b></button>`).join('');
        $('presetRow').querySelectorAll('.preset').forEach((b) => b.addEventListener('click', () => { const p = theme.data.presets.find((x) => x.key === b.dataset.k); theme.colors = { ...p.colors }; theme.preset = p.key; theme.draw(); }));
        theme.draw();
      } catch (e) { bad(e); }
    },
    draw() {
      const groups = {}; theme.data.tokens.forEach((t) => { (groups[t.group] = groups[t.group] || []).push(t); });
      $('swatchWrap').innerHTML = Object.entries(groups).map(([g, list]) => `<h6 style="margin:12px 0 8px;color:var(--clr-text-muted);text-transform:uppercase;letter-spacing:.5px">${E(g)}</h6><div class="swatch-grid">${list.map((t) => `<div class="swatch"><input type="color" data-k="${t.key}" value="${E(theme.colors[t.key])}" aria-label="${E(t.label)}"/><label>${E(t.label)}</label><input class="input-field" type="text" data-k="${t.key}" value="${E(theme.colors[t.key])}" maxlength="7"/></div>`).join('')}</div>`).join('');
      $('swatchWrap').querySelectorAll('input').forEach((inp) => inp.addEventListener('input', () => {
        let v = inp.value.trim(); if (inp.type === 'text') { if (!/^#[0-9a-f]{6}$/i.test(v)) return; }
        theme.colors[inp.dataset.k] = v.toUpperCase(); theme.preset = 'custom';
        $('swatchWrap').querySelectorAll(`input[data-k="${inp.dataset.k}"]`).forEach((o) => { if (o !== inp) o.value = v.toUpperCase(); });
        theme.preview(); document.querySelectorAll('#presetRow .preset').forEach((b) => b.classList.remove('on'));
      }));
      document.querySelectorAll('#presetRow .preset').forEach((b) => b.classList.toggle('on', b.dataset.k === theme.preset));
      theme.preview();
    },
    lum(h) { const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; },
    ratio(a, b) { const x = theme.lum(a), y = theme.lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); },
    preview() {
      const c = theme.colors, p = $('themePreview');
      p.style.background = c.surface_1; p.style.borderColor = c.border; p.style.color = c.text_secondary;
      p.querySelector('h3').style.color = c.text_primary; $('pvKicker').style.color = c.primary; $('pvText').style.color = c.text_secondary;
      const onP = theme.lum(c.primary) > 0.5 ? '#111111' : '#FFFFFF';
      Object.assign($('pvBtn').style, { background: c.primary, color: onP }); Object.assign($('pvAcc').style, { background: c.accent, color: theme.lum(c.accent) > 0.5 ? '#111' : '#fff' });
      const r1 = theme.ratio(c.text_primary, c.bg), r2 = theme.ratio(c.primary, c.bg);
      $('pvWarn').textContent = r1 < 4.5 ? '⚠ Main text has low contrast against the page background.' : r2 < 3 ? '⚠ The primary colour is hard to see against the page background.' : '✓ Contrast looks good.';
      $('pvWarn').style.color = r1 < 4.5 || r2 < 3 ? 'var(--clr-warning)' : 'var(--clr-accent)';
    },
    async save() { try { const r = await call('theme', { method: 'PUT', body: { colors: theme.colors, preset: theme.preset } }); ok('Theme saved — the whole site now uses these colours'); refreshAdminTheme(); theme.data.colors = r.colors; } catch (e) { bad(e); } },
    async reset() { if (!confirm('Reset to the original AdConnect colours?')) return; try { await call('theme/reset', { method: 'POST' }); ok('Theme reset'); refreshAdminTheme(); theme.load(); } catch (e) { bad(e); } },
  };
  function refreshAdminTheme() { const l = document.querySelector('link[href^="/api/theme.css"]'); if (l) l.href = `/api/theme.css?v=${Date.now()}`; }

  /* ═══════════ misc ═══════════ */
  async function changePassword() {
    try {
      const current = $('pwCurrent').value, next = $('pwNew').value;
      if (!current || next.length < 8) throw new Error('Enter your current password and a new one of at least 8 characters');
      ok((await call('auth/change-password', { method: 'POST', body: { current, next } })).message || 'Password updated');
      $('pwCurrent').value = ''; $('pwNew').value = '';
    } catch (e) { bad(e); }
  }

  // Label every table cell with its column heading (used by the mobile card layout), including tables built by admin.js
  function labelTables() {
    document.querySelectorAll('table.data-table').forEach((t) => {
      const heads = [...t.querySelectorAll('thead th')].map((h) => h.textContent.trim());
      t.querySelectorAll('tbody tr').forEach((tr) => [...tr.children].forEach((td, i) => { if (!td.hasAttribute('data-label') && heads[i] && !td.hasAttribute('colspan')) td.setAttribute('data-label', heads[i]); if (/actions/i.test(heads[i] || '')) td.classList.add('actions-cell'); }));
    });
  }
  document.addEventListener('DOMContentLoaded', () => {
    const main = $('adminMain'); if (!main) return;
    let pending = false;
    new MutationObserver(() => { if (pending) return; pending = true; requestAnimationFrame(() => { pending = false; labelTables(); }); }).observe(main, { childList: true, subtree: true });
    $('adlg').addEventListener('click', (e) => { if (e.target === $('adlg')) closeDlg(); });
  });

  return { services, bookings, proposals, subs, camp, msgs, theme, closeDlg, changePassword };
})();
window.AX = AX;
