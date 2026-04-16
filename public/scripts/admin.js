/**
 * AdConnect Admin Panel — admin.js
 * Role-based access: SUPER_ADMIN | ADMIN | EDITOR | GEN_USER
 */

'use strict';

// ── Config ────────────────────────────────────────────────────
//const DOMAIN = 'https://adconnect.co.ke/api/';
 const DOMAIN = 'http://localhost:3000/api/';

// ── Role Permissions ──────────────────────────────────────────
const ROLE_PERMISSIONS = {
  SUPER_ADMIN: ['dashboard','analytics','content','blog','portfolio','leads','appointments','applications','users','settings','homepage','testimonials','careers', 'career-apps', 'faqs', 'media'],
  ADMIN:       ['dashboard','analytics','content','blog','portfolio','leads','appointments','applications','settings','homepage','testimonials','careers', 'career-apps', 'faqs', 'media'],
  EDITOR:      ['dashboard','content','blog','portfolio','homepage','testimonials','faqs','media'],
  GEN_USER:    ['dashboard'],
};

// ── State ─────────────────────────────────────────────────────
let session = { user: null, role: null };
let userList = [], leadList = [], appointmentList = [], aboutList = [],
    videoList = [], applicationList = [], blogList = [], projectList = [];
let currentPanel = 'dashboard';
let editIndex = null, aboutIndex = null, appointmentIndex = null;
let editFlags = { isTitle:false, isIntro:false, isMission:false, isExperience:false };
let careerListings = [], careerApplications = [], currentAppId = null, editJobId = null;
let faqsList = [], editFAQId = null;
let mediaList = [], mediaPage = 1, mediaTotalPages = 1;
let mediaFilesToUpload = [];
let currentMediaId = null;
let charts = window.charts || {};

// ── DOM Refs ──────────────────────────────────────────────────
const $ = id => document.getElementById(id);

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  $('dashboardDate').textContent = new Date().toLocaleDateString('en-KE', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
  $('footerText').textContent = `© ${new Date().getFullYear()} AdConnect · Admin Panel`;

  // Wire sidebar search inputs
  wireSearch('searchUserInput',       '#panel-users .data-table tbody tr');
  wireSearch('searchLeadsInput',      '#panel-leads .data-table tbody tr');
  wireSearch('searchAppointmentInput','#panel-appointments .data-table tbody tr');
  wireSearch('searchApplicationInput','#panel-applications .data-table tbody tr');
  wireSearch('searchBlogInput',       '#panel-blog .data-table tbody tr');

  // Mobile guard
  if (window.innerWidth < 1024) {
    document.querySelectorAll('.admin-only-desktop').forEach(el => el.style.display = 'none');
  }
});

// ── Utilities ─────────────────────────────────────────────────
const showLoader = msg => {
  $('loaderPopup').style.height = '100%';
  if (msg) $('loadingText').textContent = msg;
};
const hideLoader = () => {
  $('loaderPopup').style.height = '0%';
  $('loadingText').textContent = '';
};

const toast = (msg, type = 'success') => {
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3500);
};

const confirm_action = msg => window.confirm(msg);

function wireSearch(inputId, rowSelector) {
  const el = $(inputId);
  if (!el) return;
  el.addEventListener('input', () => {
    const q = el.value.toLowerCase();
    document.querySelectorAll(rowSelector).forEach(row => {
      row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  });
}

function openModal(id) { $(id).style.height = '100%'; `$(id).style.width = '100%';` }
function closeModal(id) { $(id).style.height = '0%'; }

function closeAllModals() {
  ['userPopUp','appointmentPopup','aboutPopup','applicationPopup',
   'aboutRegisterPopup','videoRegisterPopup','blogPopup','projectPopup',
   'aboutPhotoPopup','aboutVideoPopup'].forEach(closeModal);
}

// legacy
function closePopup() { closeAllModals(); }

async function loadAnalyticsComplete() {
  showLoader('Loading analytics…');
  try {
    const [leadsRes, apptsRes, appsRes, visitsRes] = await Promise.allSettled([
      fetch(`${DOMAIN}clients`).then(r => r.json()),
      fetch(`${DOMAIN}appointments`).then(r => r.json()),
      fetch(`${DOMAIN}marketing-strategy-applications`).then(r => r.json()),
      fetch(`${DOMAIN}site-analytics/summary`).then(r => r.json()).catch(() => ({
        totalVisits: 0, uniqueIPs: 0, todayVisits: 0, weekVisits: 0, dailyVisits: [],
      })),
    ]);
 
    const leads = leadsRes.value  || [];
    const appts = apptsRes.value  || [];
    const apps  = (appsRes.value?.applications) || [];
    const visits = visitsRes.value || {};
 
    // ── Stat Cards ──
    renderAnalyticsStats(leads, appts, apps, visits);
 
    // ── Charts ──
    buildLeadsChart(leads);
    buildApptSourceChart(appts);
    buildStatusPieChart(apps);
    buildSubChart(leads);
    buildVisitorBarChart(visits.dailyVisits || []);
    buildSourceBreakdown(leads);
 
    // ── Tables ──
    buildTopReferrers(visits.referrers || []);
    buildRecentActivity(leads, appts, apps);
 
  } catch (e) { console.error('Analytics error:', e); }
  finally { hideLoader(); }
}
 
function renderAnalyticsStats(leads, appts, apps, visits) {
  const el = document.getElementById('analyticsStats');
  if (!el) return;
  const subscribed   = leads.filter(l => l.clientSubScription === 'SUBSCRIBED').length;
  const resolved     = apps.filter(a => a.status === 'RESOLVED').length;
  const doneAppts    = appts.filter(a => a.appointmentStatus === 'DONE').length;
  const thisMonth    = new Date(); thisMonth.setDate(1);
  const newLeads     = leads.filter(l => new Date(l.created_at) >= thisMonth).length;
 
  el.innerHTML = `
    ${statCard('fa-eye',       'Total Visits',    (visits.totalVisits||0).toLocaleString(), `${visits.todayVisits||0} today`,  'var(--clr-primary)')}
    ${statCard('fa-globe',     'Unique Visitors',  (visits.uniqueIPs||0).toLocaleString(),  `${visits.weekVisits||0} this week`, 'var(--clr-info)')}
    ${statCard('fa-users',     'Total Leads',      leads.length,   `+${newLeads} this month`, 'var(--clr-primary)')}
    ${statCard('fa-envelope',  'Subscribed',       subscribed,     `${leads.length?Math.round(subscribed/leads.length*100):0}% rate`, 'var(--clr-accent)')}
    ${statCard('fa-calendar',  'Appointments',     appts.length,   `${doneAppts} completed`,  'var(--clr-info)')}
    ${statCard('fa-check',     'Apps Resolved',    resolved,       `${apps.length?Math.round(resolved/apps.length*100):0}% rate`, 'var(--clr-warning)')}`;
}
 
const statCard = (icon, label, value, sub, color) => `
  <div class="stat-card" style="--accent-color:${color};">
    <i class="fa ${icon} stat-icon" style="color:${color};"></i>
    <div class="stat-label">${label}</div>
    <div class="stat-value">${value}</div>
    <div class="stat-change">${sub}</div>
  </div>`;
 
function buildLeadsChart(leads) {
  if (charts.leads) charts.leads.destroy();
  const ctx = document.getElementById('leadsChart')?.getContext('2d');
  if (!ctx) return;
  // Group by month (last 6 months)
  const months = getLast6Months();
  const counts = months.map(m => leads.filter(l => {
    const d = new Date(l.created_at);
    return d.getFullYear() === m.year && d.getMonth() === m.month;
  }).length);
  charts.leads = new Chart(ctx, {
    type: 'line',
    data: {
      labels: months.map(m => m.label),
      datasets: [{
        label: 'New Leads', data: counts,
        borderColor: '#F65730', backgroundColor: 'rgba(246,87,48,.1)',
        borderWidth: 2, fill: true, tension: 0.4, pointBackgroundColor: '#F65730', pointRadius: 4,
      }],
    },
    options: chartDefaults(),
  });
}
 
function buildVisitorBarChart(daily) {
  if (charts.visitors) charts.visitors.destroy();
  const ctx = document.getElementById('visitorChart')?.getContext('2d');
  if (!ctx || !daily.length) return;
  charts.visitors = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: daily.map(d => new Date(d.date).toLocaleDateString('en-KE',{weekday:'short',day:'numeric'})),
      datasets: [
        { label:'Page Visits',     data:daily.map(d=>d.visits||0),     backgroundColor:'rgba(246,87,48,.75)', borderRadius:4 },
        { label:'Unique Visitors', data:daily.map(d=>d.unique_ips||0), backgroundColor:'rgba(52,152,219,.75)', borderRadius:4 },
      ],
    },
    options: chartDefaults(),
  });
}
 
function buildApptSourceChart(appts) {
  if (charts.apptSource) charts.apptSource.destroy();
  const ctx = document.getElementById('apptSourceChart')?.getContext('2d');
  if (!ctx) return;
  const types = [...new Set(appts.map(a => a.appointmentType || 'Unknown'))];
  const counts = types.map(t => appts.filter(a => (a.appointmentType||'Unknown') === t).length);
  charts.apptSource = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: types,
      datasets: [{ data: counts, backgroundColor: ['#F65730','#4ABC4F','#3498DB','#F5A623','#9B59B6'], borderWidth: 0 }],
    },
    options: { ...chartDefaults(), cutout: '65%' },
  });
}
 
function buildStatusPieChart(apps) {
  if (charts.status) charts.status.destroy();
  const ctx = document.getElementById('statusChart')?.getContext('2d');
  if (!ctx) return;
  const statuses = ['RESOLVED','N/SOLVED'];
  const counts   = statuses.map(s => apps.filter(a => a.status === s).length);
  charts.status  = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Resolved', 'Unresolved'],
      datasets: [{ data: counts, backgroundColor: ['#4ABC4F','#F65730'], borderWidth: 0 }],
    },
    options: { ...chartDefaults(), cutout: '65%' },
  });
}
 
function buildSubChart(leads) {
  if (charts.sub) charts.sub.destroy();
  const ctx = document.getElementById('subChart')?.getContext('2d');
  if (!ctx) return;
  const subs = leads.filter(l => l.clientSubScription === 'SUBSCRIBED').length;
  charts.sub = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Subscribed', 'Unsubscribed'],
      datasets: [{ data: [subs, leads.length - subs], backgroundColor: ['#4ABC4F','#2d2b29'], borderWidth: 0 }],
    },
    options: { ...chartDefaults(), cutout: '70%' },
  });
}
 
function buildSourceBreakdown(leads) {
  const container = document.getElementById('sourceBreakdown');
  if (!container) return;
  const sources = {};
  leads.forEach(l => { const s = l.clientSource || 'Direct'; sources[s] = (sources[s]||0) + 1; });
  const sorted  = Object.entries(sources).sort((a,b) => b[1]-a[1]).slice(0, 8);
  const max     = sorted[0]?.[1] || 1;
  container.innerHTML = sorted.map(([s, c]) => `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
      <div style="width:100px;font-size:.78rem;color:var(--clr-text-secondary);text-overflow:ellipsis;overflow:hidden;white-space:nowrap;flex-shrink:0;">${esc(s)}</div>
      <div style="flex:1;background:var(--clr-surface-2);border-radius:999px;height:8px;overflow:hidden;">
        <div style="width:${Math.round(c/max*100)}%;height:100%;background:var(--clr-primary);border-radius:999px;transition:width .6s ease;"></div>
      </div>
      <div style="font-size:.78rem;font-family:var(--font-mono);color:var(--clr-text-secondary);min-width:24px;text-align:right;">${c}</div>
    </div>`).join('');
}
 
function buildTopReferrers(referrers) {
  const container = document.getElementById('topReferrers');
  if (!container) return;
  if (!referrers.length) { container.innerHTML = '<p style="color:var(--clr-text-muted);font-size:.82rem;">No referrer data yet.</p>'; return; }
  container.innerHTML = referrers.slice(0, 8).map(r => `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--clr-border);">
      <span style="font-size:.8rem;color:var(--clr-text-secondary);">${esc(r.referrer||'Direct')}</span>
      <span class="badge badge-default" style="font-size:.65rem;">${r.count}</span>
    </div>`).join('');
}
 
function buildRecentActivity(leads, appts, apps) {
  const container = document.getElementById('recentActivity');
  if (!container) return;
  const events = [
    ...leads.slice(-5).map(l => ({ type:'lead',  label:`New lead: ${l.clientName}`,  date:l.created_at, icon:'fa-user', color:'var(--clr-primary)' })),
    ...appts.slice(-5).map(a => ({ type:'appt',  label:`Appointment: ${a.name}`,     date:a.created_at, icon:'fa-calendar', color:'var(--clr-info)' })),
    ...apps.slice(-5).map(a  => ({ type:'app',   label:`Application: ${a.applicantFName} ${a.applicantLName}`, date:a.created_at, icon:'fa-file-text', color:'var(--clr-warning)' })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);
 
  container.innerHTML = events.map(e => `
    <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--clr-border);">
      <div style="width:30px;height:30px;background:rgba(246,87,48,.1);border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
        <i class="fa ${e.icon}" style="color:${e.color};font-size:.75rem;"></i>
      </div>
      <div style="flex:1;min-width:0;">
        <div style="font-size:.82rem;color:var(--clr-text-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(e.label)}</div>
        <div style="font-size:.7rem;color:var(--clr-text-muted);">${e.date ? new Date(e.date).toLocaleDateString('en-KE',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}) : '—'}</div>
      </div>
    </div>`).join('');
}
 
// ── Chart helpers ─────────────────────────────────────────────
function chartDefaults() {
  return {
    responsive: true,
    plugins: { legend: { labels: { color: '#B8B4B0', font: { size: 11 } } } },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,.05)' }, ticks: { color: '#7a7874', font: { size: 10 } } },
      y: { grid: { color: 'rgba(255,255,255,.05)' }, ticks: { color: '#7a7874', font: { size: 10 } }, beginAtZero: true },
    },
  };
}
 
function getLast6Months() {
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    months.push({ year: d.getFullYear(), month: d.getMonth(), label: d.toLocaleDateString('en-KE',{month:'short'}) });
  }
  return months;
}

async function fetchMedia() {
  showLoader('Loading media…');
  mediaPage = 1;
  try {
    const type = document.getElementById('mediaTypeFilter')?.value || '';
    const q    = document.getElementById('mediaSearch')?.value || '';
    const url  = `${DOMAIN}media?page=1&limit=40${type?`&type=${type}`:''}${q?`&q=${encodeURIComponent(q)}`:''}`;
    const res  = await fetch(url);
    const data = res.ok ? await res.json() : { items: [], totalPages: 1 };
    mediaList       = Array.isArray(data) ? data : (data.items || []);
    mediaTotalPages = data.totalPages || 1;
    renderMediaGrid();
  } catch (e) { console.error(e); }
  finally { hideLoader(); }
}
 
async function loadMoreMedia() {
  if (mediaPage >= mediaTotalPages) return;
  mediaPage++;
  const type = document.getElementById('mediaTypeFilter')?.value || '';
  const q    = document.getElementById('mediaSearch')?.value || '';
  const url  = `$DOMAIN}media?page=${mediaPage}&limit=40${type?`&type=${type}`:''}${q?`&q=${encodeURIComponent(q)}`:''}`;
  const res  = await fetch(url);
  const data = res.ok ? await res.json() : { items: [] };
  const more = Array.isArray(data) ? data : (data.items || []);
  mediaList  = [...mediaList, ...more];
  renderMediaGrid();
}
 
function filterMedia() {
  // Debounce
  clearTimeout(filterMedia._t);
  filterMedia._t = setTimeout(fetchMedia, 350);
}
 
function openMediaUpload() {
  const zone = document.getElementById('mediaUploadZone');
  if (zone) zone.style.display = zone.style.display === 'none' ? 'block' : 'none';
  mediaFilesToUpload = [];
  document.getElementById('mediaPreviewQueue').innerHTML = '';
  document.getElementById('mediaUploadMeta').style.display = 'none';
  safeVal('mediaUploadAlt', '');
  safeVal('mediaUploadTags', '');
}
 
function handleMediaDragOver(e)  { e.preventDefault(); e.currentTarget.style.borderColor='var(--clr-primary)'; e.currentTarget.style.background='var(--clr-primary-light)'; }
function handleMediaDragLeave(e) { e.currentTarget.style.borderColor='var(--clr-border)'; e.currentTarget.style.background=''; }
function handleMediaDrop(e) {
  e.preventDefault();
  handleMediaDragLeave(e);
  queueMediaFiles([...e.dataTransfer.files]);
}
function handleMediaFileSelect(e) { queueMediaFiles([...e.target.files]); }
 
function queueMediaFiles(files) {
  const valid = files.filter(f => f.type.startsWith('image/') && f.size <= 5 * 1024 * 1024);
  if (files.length !== valid.length) toast(`${files.length - valid.length} file(s) skipped (not image or >5MB)`, 'error');
  mediaFilesToUpload = [...mediaFilesToUpload, ...valid];
 
  const queue = document.getElementById('mediaPreviewQueue');
  const meta  = document.getElementById('mediaUploadMeta');
  const count = document.getElementById('mediaUploadCount');
  if (count) count.textContent = mediaFilesToUpload.length;
  if (meta)  meta.style.display = mediaFilesToUpload.length ? 'block' : 'none';
 
  mediaFilesToUpload.forEach((file, i) => {
    if (document.getElementById(`mq-${i}`)) return;
    const div = document.createElement('div');
    div.id    = `mq-${i}`;
    div.style.cssText = 'position:relative;width:80px;height:80px;flex-shrink:0;';
    const url = URL.createObjectURL(file);
    div.innerHTML = `
      <img src="${url}" style="width:100%;height:100%;object-fit:cover;border-radius:8px;border:1px solid var(--clr-border);" />
      <div style="position:absolute;bottom:2px;left:2px;right:2px;background:rgba(0,0,0,.7);border-radius:4px;padding:2px 4px;font-size:.55rem;font-family:var(--font-mono);color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(file.name)}</div>
      <button onclick="removeMediaFromQueue(${i})" style="position:absolute;top:-4px;right:-4px;width:18px;height:18px;background:var(--clr-error);border:none;border-radius:50%;color:#fff;font-size:.6rem;cursor:pointer;display:flex;align-items:center;justify-content:center;">✕</button>`;
    if (queue) queue.appendChild(div);
  });
}
 
function removeMediaFromQueue(i) {
  mediaFilesToUpload.splice(i, 1);
  const el = document.getElementById(`mq-${i}`);
  if (el) el.remove();
  const count = document.getElementById('mediaUploadCount');
  if (count) count.textContent = mediaFilesToUpload.length;
  if (!mediaFilesToUpload.length) {
    const meta = document.getElementById('mediaUploadMeta');
    if (meta) meta.style.display = 'none';
  }
}
 
async function submitMediaUpload() {
  if (!mediaFilesToUpload.length) { toast('Select at least one image', 'error'); return; }
  const type = document.getElementById('mediaUploadType')?.value || 'general';
  const alt  = safeGet('mediaUploadAlt');
  const tags = safeGet('mediaUploadTags');
 
  showLoader(`Uploading ${mediaFilesToUpload.length} image(s)…`);
  let uploaded = 0, failed = 0;
  for (const file of mediaFilesToUpload) {
    const form = new FormData();
    form.append('image', file);
    form.append('type',  type);
    form.append('alt',   alt || file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g,' '));
    form.append('tags',  tags);
    try {
      const res = await fetch(`${DOMAIN}media`, { method: 'POST', body: form });
      if (res.ok) uploaded++; else failed++;
    } catch { failed++; }
  }
  hideLoader();
  if (uploaded) toast(`${uploaded} image(s) uploaded successfully!`);
  if (failed)   toast(`${failed} upload(s) failed`, 'error');
  mediaFilesToUpload = [];
  document.getElementById('mediaPreviewQueue').innerHTML = '';
  document.getElementById('mediaUploadMeta').style.display = 'none';
  document.getElementById('mediaUploadZone').style.display = 'none';
  fetchMedia();
}
 
function renderMediaGrid() {
  const grid = document.getElementById('mediaGrid');
  const more = document.getElementById('mediaLoadMoreBtn');
  if (!grid) return;
  if (more)  more.style.display = mediaPage < mediaTotalPages ? 'block' : 'none';
 
  if (!mediaList.length) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:var(--space-8);color:var(--clr-text-muted);">
      <i class="fa fa-photo" style="font-size:2rem;display:block;margin-bottom:12px;"></i>No media found
    </div>`;
    return;
  }
 
  grid.innerHTML = mediaList.map(m => `
    <div onclick="openMediaDetail('${m.id}')" style="
      position:relative; cursor:pointer; border-radius:var(--radius-lg);
      overflow:hidden; border:1.5px solid var(--clr-border);
      aspect-ratio:1; background:var(--clr-surface-2);
      transition:var(--transition-base);
    " onmouseenter="this.style.borderColor='var(--clr-primary)';this.querySelector('.media-overlay').style.opacity='1'"
       onmouseleave="this.style.borderColor='var(--clr-border)';this.querySelector('.media-overlay').style.opacity='0'">
      <img src="${esc(m.url||m.thumbnail||m.path)}" alt="${esc(m.alt||m.filename)}"
           style="width:100%;height:100%;object-fit:cover;"
           loading="lazy" onerror="this.src='/resources/logo.png'" />
      <div class="media-overlay" style="
        position:absolute;inset:0;background:rgba(0,0,0,.65);
        opacity:0;transition:.2s;display:flex;flex-direction:column;
        align-items:center;justify-content:center;gap:6px;
      ">
        <i class="fa fa-search-plus" style="color:#fff;font-size:1.2rem;"></i>
        <span style="color:#fff;font-size:.7rem;font-weight:600;text-align:center;padding:0 8px;line-height:1.3;">${esc(truncateStr(m.alt||m.filename,22))}</span>
      </div>
      <!-- Type badge -->
      <div style="position:absolute;top:6px;left:6px;background:var(--clr-primary);color:#fff;font-size:.58rem;font-weight:700;text-transform:uppercase;letter-spacing:.5px;padding:2px 6px;border-radius:4px;">
        ${esc(m.type||'img')}
      </div>
    </div>`).join('');
}
 
async function openMediaDetail(id) {
  currentMediaId = id;
  const m = mediaList.find(x => x.id === id);
  if (!m) return;
 
  const img  = document.getElementById('mediaDetailImg');
  const name = document.getElementById('mediaDetailName');
  const type = document.getElementById('mediaDetailType');
  const size = document.getElementById('mediaDetailSize');
  const date = document.getElementById('mediaDetailDate');
  const url  = document.getElementById('mediaDetailUrl');
  const dl   = document.getElementById('mediaDetailDownload');
 
  if (img)  img.src = m.url || m.path || '';
  if (img)  img.alt = m.alt || m.filename || '';
  if (name) name.textContent = m.filename || '—';
  if (type) type.textContent = m.type     || 'general';
  if (size) size.textContent = m.size ? formatBytes(m.size) : '—';
  if (date) date.textContent = m.created_at ? new Date(m.created_at).toLocaleDateString('en-KE',{day:'numeric',month:'short',year:'numeric'}) : '—';
  if (url)  url.value        = m.url || m.path || '';
  if (dl)   dl.href          = m.url || m.path || '#';
 
  safeVal('mediaDetailAlt',  m.alt  || '');
  safeVal('mediaDetailTags', Array.isArray(m.tags) ? m.tags.join(', ') : (m.tags || ''));
 
  openModal('mediaDetailPopup');
}
 
async function saveMediaMeta() {
  if (!currentMediaId) return;
  showLoader('Saving…');
  try {
    const res = await fetch(`${DOMAIN}media/${currentMediaId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        alt:  safeGet('mediaDetailAlt'),
        tags: safeGet('mediaDetailTags').split(',').map(t=>t.trim()).filter(Boolean),
      }),
    });
    if (res.ok) {
      toast('Media updated!');
      const m = mediaList.find(x => x.id === currentMediaId);
      if (m) {
        m.alt  = safeGet('mediaDetailAlt');
        m.tags = safeGet('mediaDetailTags').split(',').map(t=>t.trim()).filter(Boolean);
      }
    } else toast('Save failed', 'error');
  } finally { hideLoader(); }
}
 
function copyMediaUrl() {
  const url = document.getElementById('mediaDetailUrl')?.value;
  if (url) {
    navigator.clipboard?.writeText(url).then(() => toast('URL copied!'));
  }
}
 
async function deleteMedia() {
  if (!confirm('Delete this image? This cannot be undone.')) return;
  showLoader('Deleting…');
  try {
    await fetch(`${DOMAIN}media/${currentMediaId}`, { method: 'DELETE' });
    toast('Image deleted');
    closeModal('mediaDetailPopup');
    mediaList = mediaList.filter(m => m.id !== currentMediaId);
    renderMediaGrid();
  } finally { hideLoader(); currentMediaId = null; }
}

const AutoSignout = (() => {
  let timer = null;
  let warningTimer = null;
  let timeoutMs = 5 * 60 * 1000; // default 5 min
  let warnBeforeMs = 60 * 1000;   // warn 1 min before
 
  const EVENTS = ['mousemove','keydown','click','scroll','touchstart'];
 
  function reset() {
    clearTimeout(timer);
    clearTimeout(warningTimer);
    hideWarning();
 
    warningTimer = setTimeout(showWarning, timeoutMs - warnBeforeMs);
    timer        = setTimeout(signOut,      timeoutMs);
  }
 
  function showWarning() {
    const remaining = Math.round(warnBeforeMs / 1000);
    let el = document.getElementById('autoSignoutWarning');
    if (!el) {
      el = document.createElement('div');
      el.id = 'autoSignoutWarning';
      el.style.cssText = `
        position:fixed;top:70px;left:50%;transform:translateX(-50%);z-index:99998;
        background:var(--clr-surface-2);border:1.5px solid var(--clr-warning);
        border-radius:var(--radius-lg);padding:14px 20px;display:flex;align-items:center;
        gap:14px;box-shadow:var(--shadow-lg);min-width:320px;animation:slideDown .3s ease;
      `;
      el.innerHTML = `
        <i class="fa fa-clock-o" style="color:var(--clr-warning);font-size:1.2rem;"></i>
        <div style="flex:1;">
          <div style="font-size:.85rem;font-weight:700;color:var(--clr-text-primary);">Session expiring soon</div>
          <div id="autoSignoutCountdown" style="font-size:.78rem;color:var(--clr-text-muted);">You'll be signed out in ${remaining}s</div>
        </div>
        <button onclick="AutoSignout.extend()" style="padding:7px 14px;background:var(--clr-primary);border:none;border-radius:var(--radius-md);color:#fff;font-size:.78rem;font-weight:700;cursor:pointer;">Stay Logged In</button>
      `;
      document.body.appendChild(el);
    }
    el.style.display = 'flex';
 
    // Countdown
    let secs = Math.round(warnBeforeMs / 1000);
    const cdInterval = setInterval(() => {
      secs--;
      const cdEl = document.getElementById('autoSignoutCountdown');
      if (cdEl) cdEl.textContent = `You'll be signed out in ${secs}s`;
      if (secs <= 0) clearInterval(cdInterval);
    }, 1000);
    el._cdInterval = cdInterval;
  }
 
  function hideWarning() {
    const el = document.getElementById('autoSignoutWarning');
    if (el) { clearInterval(el._cdInterval); el.style.display = 'none'; }
  }
 
  function signOut() {
    hideWarning();
    toast('Session expired — you have been signed out.', 'error');
    setTimeout(() => handleLogout(), 1200);
  }
 
  function start(minutes) {
    if (minutes) timeoutMs = minutes * 60 * 1000;
    EVENTS.forEach(ev => document.addEventListener(ev, reset, { passive: true }));
    reset();
  }
 
  function stop() {
    EVENTS.forEach(ev => document.removeEventListener(ev, reset));
    clearTimeout(timer);
    clearTimeout(warningTimer);
    hideWarning();
  }
 
  function setMinutes(minutes) {
    timeoutMs = minutes * 60 * 1000;
    reset();
  }
 
  return { start, stop, reset, extend: reset, setMinutes };
})();
window.AutoSignout = AutoSignout;

// ── Auth ──────────────────────────────────────────────────────
async function handleLogin(e) {
  if (e) e.preventDefault();
  const email = $('email').value.trim();
  const pass  = $('password').value.trim();
  const errEl = $('login-error');

  if (!email || !pass) { showErr('All fields required', errEl); return; }

  showLoader('Authenticating…');
  try {
    const res  = await fetch(`${DOMAIN}auth`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({email, password: pass}) });
    const data = await res.json();
    if (!res.ok) { showErr(data.error || 'Invalid credentials', errEl); return; }

    session.user = data.username;
    session.role = data.role || 'GEN_USER';

    // Update UI
    $('usernameSession').textContent = data.username;
    $('userRoleDisplay').textContent = session.role.replace('_',' ');
    $('userAvatar').textContent = data.username.charAt(0).toUpperCase();

    // Apply role-based visibility
    applyRolePermissions(session.role);

    // Show admin
    $('login-page').style.display = 'none';
    $('adminHero').style.display  = 'block';
    console.log(`Logged in as ${data.username} with role ${session.role}`);
    navigate('dashboard');
    AutoSignout.start(10);
    checkAndRefreshToken();
    toast(`Welcome back, ${data.username}!`);
  } catch (err) {
    showErr('Network error — please try again', errEl);
  } finally { hideLoader(); }
}

async function fetchFAQs() {
  showLoader('Loading FAQs…');
  try {
    const res = await fetch(`${DOMAIN}faqs`);
    faqsList  = res.ok ? await res.json() : [];
    updateFAQStats();
    buildFAQCategoryFilter();
    renderFAQs();
  } catch (e) { console.error(e); }
  finally { hideLoader(); }
}
 
function updateFAQStats() {
  const cats = [...new Set(faqsList.map(f => f.category).filter(Boolean))];
  safeSet('faqTotalCount',     faqsList.length);
  safeSet('faqPublishedCount', faqsList.filter(f => f.status === 'PUBLISHED').length);
  safeSet('faqCategoryCount',  cats.length);
}
 
function buildFAQCategoryFilter() {
  const cats  = [...new Set(faqsList.map(f => f.category).filter(Boolean))];
  const sel   = document.getElementById('faqCatFilter');
  const dl    = document.getElementById('faqCategoryOptions');
  if (sel) {
    sel.innerHTML = '<option value="">All Categories</option>' +
      cats.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('');
  }
  if (dl) dl.innerHTML = cats.map(c => `<option value="${esc(c)}">`).join('');
}
 
function renderFAQs() {
  const container = document.getElementById('faqListAdmin');
  if (!container) return;
 
  const cat    = document.getElementById('faqCatFilter')?.value    || '';
  const status = document.getElementById('faqStatusFilter')?.value || '';
  const q      = document.getElementById('faqSearch')?.value?.toLowerCase() || '';
 
  const filtered = faqsList.filter(f => {
    const catOk    = !cat    || f.category === cat;
    const statusOk = !status || f.status   === status;
    const qOk      = !q      || f.question?.toLowerCase().includes(q) || f.answer?.toLowerCase().includes(q);
    return catOk && statusOk && qOk;
  });
 
  if (!filtered.length) {
    container.innerHTML = `<div style="padding:var(--space-8);text-align:center;color:var(--clr-text-muted);">
      <i class="fa fa-question-circle" style="font-size:2rem;display:block;margin-bottom:12px;"></i>
      No FAQs found
    </div>`;
    return;
  }
 
  container.innerHTML = filtered.map((f, i) => `
    <div style="
      padding:var(--space-5) var(--space-6);
      border-bottom:1px solid var(--clr-border);
      display:flex; align-items:flex-start; gap:var(--space-5);
      transition:var(--transition-base);
    " onmouseenter="this.style.background='var(--clr-surface-2)'"
       onmouseleave="this.style.background='transparent'">
      <!-- Drag handle placeholder -->
      <div style="color:var(--clr-text-muted);padding-top:2px;cursor:grab;"><i class="fa fa-bars"></i></div>
      <!-- Content -->
      <div style="flex:1;min-width:0;">
        <div style="display:flex;align-items:center;gap:var(--space-3);flex-wrap:wrap;margin-bottom:6px;">
          <span style="font-family:var(--font-display);font-weight:700;color:var(--clr-text-primary);font-size:.95rem;">${esc(f.question)}</span>
          ${f.featured ? '<span class="badge badge-warning" style="font-size:.62rem;">Featured</span>' : ''}
          ${faqStatusBadge(f.status)}
          ${f.category ? `<span class="badge badge-info" style="font-size:.62rem;">${esc(f.category)}</span>` : ''}
        </div>
        <p style="color:var(--clr-text-muted);font-size:.82rem;line-height:1.6;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${esc(f.answer)}</p>
      </div>
      <!-- Actions -->
      <div style="display:flex;gap:8px;flex-shrink:0;align-items:center;">
        <button class="btn btn-${f.status==='PUBLISHED'?'warning':'accent'} btn-sm" onclick="toggleFAQStatus('${f.id}','${f.status}')" style="font-size:.72rem;min-width:74px;">
          ${f.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
        </button>
        <button class="btn btn-secondary btn-sm btn-icon" onclick="editFAQ('${f.id}')"><i class="fa fa-pencil"></i></button>
        <button class="btn btn-danger btn-sm btn-icon" onclick="deleteFAQ('${f.id}')"><i class="fa fa-trash"></i></button>
      </div>
    </div>`).join('');
}
 
const faqStatusBadge = s => s === 'PUBLISHED'
  ? '<span class="badge badge-success" style="font-size:.62rem;">Published</span>'
  : '<span class="badge badge-default" style="font-size:.62rem;">Draft</span>';
 
function openFAQForm(faq = null) {
  editFAQId = faq?.id || null;
  document.getElementById('faqFormTitle').textContent = faq ? 'Edit FAQ' : 'Add FAQ';
  safeVal('faqQuestion', faq?.question || '');
  safeVal('faqAnswer',   faq?.answer   || '');
  safeVal('faqCategory', faq?.category || '');
  safeVal('faqOrder',    faq?.sort_order ?? 0);
  const selStatus = document.getElementById('faqStatus');
  if (selStatus) selStatus.value = faq?.status || 'PUBLISHED';
  const cbFeat = document.getElementById('faqFeatured');
  if (cbFeat) cbFeat.checked = !!faq?.featured;
  openModal('faqFormPopup');
}
 
function editFAQ(id) {
  const faq = faqsList.find(f => f.id === id);
  if (faq) openFAQForm(faq);
}
 
async function saveFAQ() {
  const question = safeGet('faqQuestion');
  const answer   = safeGet('faqAnswer');
  if (!question || !answer) { toast('Question and answer are required', 'error'); return; }
 
  const body = {
    question,
    answer,
    category:   safeGet('faqCategory'),
    status:     document.getElementById('faqStatus')?.value || 'PUBLISHED',
    sort_order: parseInt(safeGet('faqOrder')) || 0,
    featured:   document.getElementById('faqFeatured')?.checked || false,
  };
 
  showLoader('Saving FAQ…');
  try {
    const url    = editFAQId ? `${DOMAIN}faqs/${editFAQId}` : `${DOMAIN}faqs`;
    const method = editFAQId ? 'PUT' : 'POST';
    const res    = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (res.ok) {
      toast(editFAQId ? 'FAQ updated!' : 'FAQ created!');
      closeModal('faqFormPopup');
      fetchFAQs();
    } else {
      const d = await res.json();
      toast(d.error || 'Save failed', 'error');
    }
  } finally { hideLoader(); editFAQId = null; }
}
 
async function toggleFAQStatus(id, current) {
  const newStatus = current === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
  showLoader('Updating…');
  try {
    const res = await fetch(`${DOMAIN}faqs/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      const f = faqsList.find(x => x.id === id);
      if (f) f.status = newStatus;
      updateFAQStats();
      renderFAQs();
      toast(`FAQ ${newStatus === 'PUBLISHED' ? 'published' : 'unpublished'}!`);
    } else toast('Update failed', 'error');
  } finally { hideLoader(); }
}
 
async function deleteFAQ(id) {
  if (!confirm('Delete this FAQ?')) return;
  showLoader('Deleting…');
  try {
    await fetch(`${DOMAIN}faqs/${id}`, { method: 'DELETE' });
    faqsList = faqsList.filter(f => f.id !== id);
    updateFAQStats();
    renderFAQs();
    toast('FAQ deleted');
  } finally { hideLoader(); }
}

// ── Job Listings ─────────────────────────────────────────────
async function fetchCareerListings() {
  showLoader('Loading job listings…');
  try {
    const res   = await fetch(`${DOMAIN}careers`);
    careerListings = res.ok ? await res.json() : [];
    renderCareerListings();
    populateJobFilter();
  } finally { hideLoader(); }
}

function renderCareerListings() {
  const tbody = document.getElementById('careerListingsTbody');
  if (!tbody) return;
  if (!careerListings.length) { tbody.innerHTML = emptyRow(9,'No job listings yet'); return; }
  tbody.innerHTML = careerListings.map((j,i) => `
    <tr>
      <td><strong>${esc(j.title)}</strong> ${j.pinned?'<span class="badge badge-warning" style="font-size:.62rem;">Pinned</span>':''}</td>
      <td>${esc(j.department)}</td>
      <td><span class="badge badge-default">${esc(j.type)}</span></td>
      <td><span class="badge ${modeB(j.mode)}">${esc(j.mode)}</span></td>
      <td style="font-size:.78rem;font-family:var(--font-mono);">${j.deadline ? formatDate(j.deadline) : '—'}</td>
      <td>
        <div style="display:flex;flex-wrap:wrap;gap:4px;">
          ${(j.tags||[]).map(t=>`<span class="badge badge-info" style="font-size:.65rem;">${esc(t)}</span>`).join('')}
        </div>
      </td>
      <td>${jobStatusBadge(j.status)}</td>
      <td>
        <button class="btn btn-ghost btn-sm" onclick="viewAppsForJob('${j.id}','${esc(j.title)}')" style="font-size:.75rem;">
          <i class="fa fa-users"></i> View
        </button>
      </td>
      <td class="actions-cell">
        <button class="btn btn-secondary btn-sm btn-icon" onclick="editJobListing(${i})"><i class="fa fa-pencil"></i></button>
        <button class="btn btn-danger btn-sm btn-icon" onclick="deleteJobListing('${j.id}')"><i class="fa fa-trash"></i></button>
      </td>
    </tr>`).join('');
}

const modeB = m => ({ 'Remote':'badge-success', 'On-site':'badge-warning', 'Hybrid':'badge-info' }[m] || 'badge-default');
const jobStatusBadge = s => ({ 'OPEN':'badge-success','PAUSED':'badge-warning','CLOSED':'badge-error' }[s] ? `<span class="badge ${{'OPEN':'badge-success','PAUSED':'badge-warning','CLOSED':'badge-error'}[s]}">${esc(s)}</span>` : `<span class="badge badge-default">${esc(s)}</span>`);

function openJobForm() { editJobId=null; document.getElementById('jobFormTitle').textContent='Create Job Listing'; clearJobForm(); openModal('jobFormPopup'); }

function editJobListing(i) {
  const j = careerListings[i]; editJobId = j.id;
  document.getElementById('jobFormTitle').textContent = 'Edit Job Listing';
  setValue('jTitle',    j.title);   setValue('jDept',     j.department);
  setValue('jType',     j.type);    setValue('jMode',     j.mode);
  setValue('jLocation', j.location||''); setValue('jSalary', j.salary||'');
  setValue('jDeadline', j.deadline||''); setValue('jStatus', j.status);
  setValue('jDesc', j.description||''); setValue('jReqs', j.requirements||'');
  setValue('jTags', (j.tags||[]).join(', '));
  document.getElementById('jPinned').checked = !!j.pinned;
  openModal('jobFormPopup');
}

function clearJobForm() {
  ['jTitle','jLocation','jSalary','jDeadline','jDesc','jReqs','jTags'].forEach(id => setValue(id,''));
  ['jDept','jType','jMode','jStatus'].forEach(id => { const el=document.getElementById(id); if(el) el.selectedIndex=0; });
  document.getElementById('jPinned').checked = false;
}

async function saveJobListing() {
  const title = getValue('jTitle'), dept = getValue('jDept'), desc = getValue('jDesc');
  if (!title || !dept || !desc) { toast('Title, department, and description are required','error'); return; }
  const body = {
    title, department:dept, type:getValue('jType'), mode:getValue('jMode'),
    location:getValue('jLocation')||'Nairobi', salary:getValue('jSalary'),
    description:desc, requirements:getValue('jReqs'), deadline:getValue('jDeadline'),
    status:getValue('jStatus')||'OPEN',
    pinned:document.getElementById('jPinned').checked,
    tags: getValue('jTags').split(',').map(t=>t.trim()).filter(Boolean),
  };
  showLoader('Saving…');
  try {
    const url    = editJobId ? `${DOMAIN}careers/${editJobId}` : `${DOMAIN}careers`;
    const method = editJobId ? 'PUT' : 'POST';
    const res    = await fetch(url, { method, headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
    if (res.ok) { toast(editJobId?'Job updated!':'Job created!'); closeModal('jobFormPopup'); fetchCareerListings(); }
    else toast('Save failed','error');
  } finally { hideLoader(); editJobId=null; }
}

async function deleteJobListing(id) {
  if (!confirm('Delete this job listing? Applications will remain.')) return;
  showLoader('Deleting…');
  try {
    await fetch(`${DOMAIN}careers/${id}`, {method:'DELETE'});
    toast('Deleted'); fetchCareerListings();
  } finally { hideLoader(); }
}

// ── Career Applications ──────────────────────────────────────
async function fetchCareerApplications() {
  showLoader('Loading applications…');
  try {
    const jobId  = document.getElementById('appJobFilter')?.value  || '';
    const status = document.getElementById('appStatusFilter')?.value || '';
    let url = `${DOMAIN}career-applications`;
    const params = [];
    if (jobId)  params.push(`jobId=${jobId}`);
    if (status) params.push(`status=${status}`);
    if (params.length) url += '?' + params.join('&');

    const res = await fetch(url);
    careerApplications = res.ok ? await res.json() : [];
    renderCareerApplications();
    updatePendingBadge();
  } finally { hideLoader(); }
}

function populateJobFilter() {
  const sel = document.getElementById('appJobFilter');
  if (!sel) return;
  const cur = sel.value;
  sel.innerHTML = '<option value="">All Jobs</option>' +
    careerListings.map(j => `<option value="${j.id}" ${j.id===cur?'selected':''}>${esc(j.title)}</option>`).join('');
}

function viewAppsForJob(jobId, jobTitle) {
  navigate('career-apps');
  setTimeout(() => {
    const sel = document.getElementById('appJobFilter');
    if (sel) { sel.value = jobId; fetchCareerApplications(); }
  }, 200);
}

function renderCareerApplications() {
  const tbody = document.getElementById('careerAppsTbody');
  if (!tbody) return;
  if (!careerApplications.length) { tbody.innerHTML = emptyRow(9,'No applications found'); return; }
  tbody.innerHTML = careerApplications.map((a,i) => `
    <tr style="${a.status==='PENDING'?'font-weight:600;':''}">
      <td><strong>${esc(a.first_name)} ${esc(a.last_name)}</strong></td>
      <td><a href="mailto:${esc(a.email)}" style="color:var(--clr-primary);">${esc(a.email)}</a></td>
      <td>${esc(a.phone||'—')}</td>
      <td style="font-size:.8rem;">${esc(a.job_title||'—')}</td>
      <td><span class="badge badge-default">${esc(a.experience||'—')}</span></td>
      <td>${appStatusBadge(a.status)}</td>
      <td>
        ${a.cv_filename ? `<a href="${DOMAIN}cvs/${esc(a.cv_filename)}" target="_blank" class="btn btn-ghost btn-sm" style="font-size:.75rem;"><i class="fa fa-file-pdf-o" style="color:var(--clr-error);"></i> Download</a>` : '—'}
      </td>
      <td style="font-size:.78rem;color:var(--clr-text-muted);">${formatDate(a.created_at)}</td>
      <td class="actions-cell">
        <button class="btn btn-primary btn-sm btn-icon" onclick="viewApplication('${a.id}')" title="View"><i class="fa fa-eye"></i></button>
        <button class="btn btn-danger btn-sm btn-icon" onclick="deleteCareerApp('${a.id}')" title="Delete"><i class="fa fa-trash"></i></button>
      </td>
    </tr>`).join('');
}

function updatePendingBadge() {
  const count = careerApplications.filter(a => a.status==='PENDING').length;
  const b = document.getElementById('pendingAppsBadge');
  if (b) { b.textContent = count; b.style.display = count > 0 ? 'inline' : 'none'; }
}

const appStatusBadge = s => {
  const map = { PENDING:'badge-warning', REVIEWING:'badge-info', SHORTLISTED:'badge-info',
                INTERVIEW:'badge-success', HIRED:'badge-success', REJECTED:'badge-error' };
  return `<span class="badge ${map[s]||'badge-default'}">${esc(s)}</span>`;
};

// ── View Application Detail ───────────────────────────────────
async function viewApplication(id) {
  showLoader('Loading application…');
  try {
    const res = await fetch(`${DOMAIN}career-applications/${id}`);
    const a   = await res.json();
    currentAppId = id;

    const detail = document.getElementById('appDetailContent');
    detail.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:20px;">
        <div>
          <div class="label">Applicant</div>
          <div style="font-weight:700;font-size:1rem;color:var(--clr-text-primary);">${esc(a.first_name)} ${esc(a.last_name)}</div>
        </div>
        <div><div class="label">Status</div>${appStatusBadge(a.status)}</div>
        <div><div class="label">Email</div><a href="mailto:${esc(a.email)}" style="color:var(--clr-primary);">${esc(a.email)}</a></div>
        <div><div class="label">Phone</div><a href="tel:${esc(a.phone||'')}" style="color:var(--clr-primary);">${esc(a.phone||'—')}</a></div>
        <div><div class="label">Applied For</div><span style="color:var(--clr-primary);font-weight:600;">${esc(a.job_title)}</span></div>
        <div><div class="label">Experience</div>${esc(a.experience||'—')}</div>
        ${a.current_role ? `<div style="grid-column:1/-1;"><div class="label">Current / Last Role</div>${esc(a.current_role)}</div>` : ''}
        ${a.portfolio    ? `<div style="grid-column:1/-1;"><div class="label">Portfolio / LinkedIn</div><a href="${esc(a.portfolio)}" target="_blank" style="color:var(--clr-primary);">${esc(a.portfolio)}</a></div>` : ''}
        <div style="grid-column:1/-1;">
          <div class="label" style="margin-bottom:8px;">Motivation</div>
          <div style="background:var(--clr-surface-2);border:1px solid var(--clr-border);border-radius:var(--radius-lg);padding:16px;font-size:.875rem;line-height:1.8;white-space:pre-wrap;">${esc(a.motivation||'—')}</div>
        </div>
      </div>
      <div style="display:flex;gap:var(--space-3);flex-wrap:wrap;align-items:center;">
        ${a.cv_url ? `<a href="${a.cv_url}" target="_blank" class="btn btn-ghost btn-sm"><i class="fa fa-file-pdf-o" style="color:var(--clr-error);"></i> Download CV</a>` : ''}
        <select id="appStatusSelect" class="input-field" style="width:160px;height:36px;" onchange="updateAppStatus(this.value)">
          ${['PENDING','REVIEWING','SHORTLISTED','INTERVIEW','HIRED','REJECTED'].map(s => `<option value="${s}" ${s===a.status?'selected':''}>${s}</option>`).join('')}
        </select>
        <button onclick="document.getElementById('inviteForm').style.display=document.getElementById('inviteForm').style.display==='none'?'block':'none'" class="btn btn-accent btn-sm">
          <i class="fa fa-calendar-plus-o"></i> Invite to Interview
        </button>
      </div>`;

    // Pre-fill notes
    setValue('appNotesInput', a.admin_notes||'');

    // Pre-fill invite date
    setValue('ivDate', new Date().toISOString().slice(0,10));

    openModal('appDetailPopup');
  } catch (e) { toast('Failed to load application','error'); }
  finally { hideLoader(); }
}

async function updateAppStatus(status) {
  showLoader('Updating…');
  try {
    const res = await fetch(`${DOMAIN}career-applications/${currentAppId}/status`, {
      method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({status}),
    });
    if (res.ok) { toast(`Status updated to ${status}`); const a = careerApplications.find(x=>x.id===currentAppId); if(a) a.status=status; renderCareerApplications(); }
    else toast('Update failed','error');
  } finally { hideLoader(); }
}

async function saveAppNotes() {
  const notes = getValue('appNotesInput');
  showLoader('Saving notes…');
  try {
    const res = await fetch(`${DOMAIN}career-applications/${currentAppId}/notes`, {
      method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({notes}),
    });
    if (res.ok) toast('Notes saved!'); else toast('Save failed','error');
  } finally { hideLoader(); }
}

async function sendInterviewInvite() {
  const btn = document.getElementById('sendInviteBtn');
  const date = getValue('ivDate'), time = getValue('ivTime');
  if (!date || !time) { toast('Interview date and time are required','error'); return; }
  btn.disabled = true; btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Sending…';
  try {
    const res = await fetch(`${DOMAIN}career-applications/${currentAppId}/invite`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        interviewDate: date, interviewTime: time,
        interviewType: getValue('ivType'), interviewLink: getValue('ivLink'),
        interviewLocation: getValue('ivLocation'), interviewNotes: getValue('ivNotes'),
      }),
    });
    const d = await res.json();
    if (res.ok) { toast(d.message||'Invitation sent!'); document.getElementById('inviteForm').style.display='none'; }
    else toast(d.error||'Failed to send','error');
  } finally { btn.disabled=false; btn.innerHTML='<i class="fa fa-paper-plane"></i> Send Interview Invitation'; }
}

async function deleteCareerApp(id) {
  if (!confirm('Delete this application and CV?')) return;
  showLoader('Deleting…');
  try {
    await fetch(`${DOMAIN}career-applications/${id}`, {method:'DELETE'});
    toast('Deleted'); careerApplications = careerApplications.filter(a=>a.id!==id); renderCareerApplications();
  } finally { hideLoader(); }
}


function handleLogout() {
  if (!confirm_action('Sign out?')) return;
  AutoSignout.stop();
  session = { user:null, role:null };
  $('login-page').style.display = 'flex';
  $('adminHero').style.display  = 'none';
  $('email').value = '';
  $('password').value = '';
}

function applyRolePermissions(role) {
  const allowed = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.GEN_USER;

  // Hide/show CRM nav
  const crmSections = ['nav-leads','nav-appointments','nav-applications'];
  crmSections.forEach(id => {
    const el = $(id);
    if (el) el.style.display = allowed.includes(id.replace('nav-','')) ? '' : 'none';
  });

  // Hide users nav for non-admins
  const usersNav = $('nav-users');
  if (usersNav) usersNav.style.display = allowed.includes('users') ? '' : 'none';
  if (!allowed.includes('users')) {
    $('admin-section-label').style.display = 'none';
  }

  // Editor: hide leads/appts/applications labels
  if (role === 'EDITOR') {
    ['crm-section-label','admin-section-label'].forEach(id => {
      if ($(id)) $(id).style.display = 'none';
    });
  }
}

function canAccess(panel) {
  const allowed = ROLE_PERMISSIONS[session.role] || [];
  return allowed.includes(panel);
}

// ── Modal Close Button Patch ──────────────────────────────────
// Ensures EVERY modal has a working close button
function patchAllModals() {
  const modals = [
    'userPopUp','appointmentPopup','aboutPopup','applicationPopup',
    'aboutRegisterPopup','videoRegisterPopup','blogPopup','projectPopup',
    'aboutPhotoPopup','aboutVideoPopup','testimonialPopup','contactMsgPopup',
    'jobFormPopup','appDetailPopup','teamMemberPopup',
  ];
  modals.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    // Check if close button already exists
    if (el.querySelector('.modal-close-injected')) return;
    const btn = document.createElement('button');
    btn.className = 'btn-close modal-close-injected';
    btn.innerHTML = '<i class="fa fa-times"></i>';
    btn.setAttribute('aria-label', 'Close');
    btn.onclick = () => closeModal(id);
    btn.style.cssText = 'position:fixed;top:70px;right:20px;z-index:10001;';
    el.prepend(btn);
  });
}

function showErr(msg, container) {
  if (!container) return toast(msg, 'error');
  container.textContent = msg;
  container.style.display = 'block';
  setTimeout(() => { container.style.display = 'none'; }, 4000);
}

// ── Navigation ────────────────────────────────────────────────
function navigate(panel) {
  if (!canAccess(panel)) { showActivePanel('access-denied'); return; }

  currentPanel = panel;
  showActivePanel(panel);
  updateSidebarActive(panel);

  // Load data for panel
  const loaders = {
    dashboard:    loadDashboard,
    analytics:    loadAnalytics,
    content:      fetchAbout,
    blog:         fetchBlogPosts,
    portfolio:    fetchProjects,
    leads:        fetchLeads,
    appointments: fetchAppointments,
    applications: fetchApplications,
    homepage:    () => { loadHomepageSettings(); },
    testimonials: fetchTestimonials,
    analytics:  loadAnalyticsWithVisits,
    users:      () => { fetchUsers(); fetchTeamMembers(); },
    settings:   loadAllSettings,
    careers:     fetchCareerListings,
    'career-apps': fetchCareerApplications,
    faqs:         fetchFAQs,
    media:        fetchMedia,
  };
  if (loaders[panel]) loaders[panel]();
}

function showActivePanel(name) {
  document.querySelectorAll('.panel').forEach(p => p.style.display = 'none');
  const el = $(`panel-${name}`);
  if (el) el.style.display = 'flex';
}

function updateSidebarActive(panel) {
  document.querySelectorAll('.admin-sidebar li').forEach(li => li.classList.remove('activ'));
  const navEl = $(`nav-${panel}`);
  if (navEl) navEl.classList.add('activ');
}

// ── Dashboard ─────────────────────────────────────────────────
async function loadDashboard() {
  showLoader('Loading dashboard…');
  try {
    const [leads, appts, apps, blogs] = await Promise.allSettled([
      fetch(`${DOMAIN}clients`).then(r=>r.json()),
      fetch(`${DOMAIN}appointments`).then(r=>r.json()),
      fetch(`${DOMAIN}marketing-strategy-applications`).then(r=>r.json()),
      fetch(`${DOMAIN}blog-posts`).then(r=>r.json()).catch(()=>[]),
    ]);

    const leadsData = leads.value || [];
    const apptsData = appts.value || [];
    const appsData  = (apps.value?.applications) || [];
    const blogsData = Array.isArray(blogs.value) ? blogs.value : [];

    $('statLeads').textContent = leadsData.length;
    $('statAppts').textContent = apptsData.length;
    $('statApps').textContent  = appsData.length;
    $('statBlogs').textContent = blogsData.length;

    // recent leads
    renderRecentLeads(leadsData.slice(-5).reverse());

    // Charts
    buildLeadsChart(leadsData);
    buildSourceChart(leadsData);
  } catch (e) { console.error(e); }
  finally { hideLoader(); }
}

function renderRecentLeads(list) {
  const tbody = $('recentLeadsTbody');
  if (!list.length) { tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:var(--space-5);color:var(--clr-text-muted);">No leads yet</td></tr>'; return; }
  tbody.innerHTML = list.map(l => `
    <tr>
      <td><strong>${esc(l.clientName)}</strong></td>
      <td>${esc(l.clientEmail)}</td>
      <td><span class="badge badge-default">${esc(l.clientSource||'—')}</span></td>
      <td>${statusBadge(l.clientStatus)}</td>
      <td style="color:var(--clr-text-muted);">${formatDate(l.created_at)}</td>
    </tr>`).join('');
}

function buildLeadsChart(leads) {
  const days = Array.from({length:7}, (_,i) => {
    const d = new Date(); d.setDate(d.getDate()-i);
    return d.toISOString().slice(0,10);
  }).reverse();

  const counts = days.map(day => leads.filter(l => (l.created_at||'').startsWith(day)).length);

  if (charts.leads) charts.leads.destroy();
  const ctx = document.getElementById('leadsChart')?.getContext('2d');
  if (!ctx) return;
  charts.leads = new Chart(ctx, {
    type: 'line',
    data: {
      labels: days.map(d => new Date(d).toLocaleDateString('en-KE',{weekday:'short',day:'numeric'})),
      datasets: [{
        label: 'Leads',
        data: counts,
        borderColor: '#F65730',
        backgroundColor: 'rgba(246,87,48,.12)',
        fill: true,
        tension: .4,
        pointBackgroundColor: '#F65730',
        pointRadius: 4,
      }]
    },
    options: { plugins:{legend:{display:false}}, scales:{ x:{grid:{color:'rgba(255,255,255,.06)'}}, y:{grid:{color:'rgba(255,255,255,.06)'},beginAtZero:true,ticks:{stepSize:1}} } }
  });
}

function buildSourceChart(leads) {
  const sources = {};
  leads.forEach(l => { const s = l.clientSource||'Direct'; sources[s] = (sources[s]||0)+1; });
  const keys = Object.keys(sources), vals = Object.values(sources);

  if (charts.source) charts.source.destroy();
  const ctx = document.getElementById('sourceChart')?.getContext('2d');
  if (!ctx) return;
  const colors = ['#F65730','#4ABC4F','#3498DB','#F5A623','#9B59B6','#1ABC9C'];
  charts.source = new Chart(ctx, {
    type: 'doughnut',
    data: { labels: keys, datasets: [{ data: vals, backgroundColor: colors, borderColor: '#252320', borderWidth: 2 }] },
    options: { plugins:{ legend:{ position:'bottom', labels:{ color:'#B8B4B0', font:{size:11} } } }, cutout:'65%' }
  });
}

// ── Analytics ─────────────────────────────────────────────────
async function loadAnalytics() {
  showLoader('Loading analytics…');
  try {
    const [leads, appts, apps] = await Promise.allSettled([
      fetch(`${DOMAIN}clients`).then(r=>r.json()),
      fetch(`${DOMAIN}appointments`).then(r=>r.json()),
      fetch(`${DOMAIN}marketing-strategy-applications`).then(r=>r.json()),
    ]);
    const L = leads.value||[], A = appts.value||[], P = (apps.value?.applications)||[];

    // Stats
    const subscribed = L.filter(l=>l.clientSubScription==='SUBSCRIBED').length;
    const resolved   = P.filter(p=>p.status==='RESOLVED').length;

    $('analyticsStats').innerHTML = `
      <div class="stat-card" style="--accent-color:var(--clr-primary);">
        <i class="fa fa-users stat-icon"></i>
        <div class="stat-label">Total Leads</div>
        <div class="stat-value">${L.length}</div>
        <div class="stat-change up">All time</div>
      </div>
      <div class="stat-card" style="--accent-color:var(--clr-accent);">
        <i class="fa fa-envelope stat-icon"></i>
        <div class="stat-label">Subscribed</div>
        <div class="stat-value">${subscribed}</div>
        <div class="stat-change up">${L.length ? Math.round(subscribed/L.length*100) : 0}% rate</div>
      </div>
      <div class="stat-card" style="--accent-color:var(--clr-info);">
        <i class="fa fa-calendar stat-icon"></i>
        <div class="stat-label">Appointments</div>
        <div class="stat-value">${A.length}</div>
        <div class="stat-change">${A.filter(a=>a.appointmentStatus==='DONE').length} completed</div>
      </div>
      <div class="stat-card" style="--accent-color:var(--clr-warning);">
        <i class="fa fa-check-circle stat-icon"></i>
        <div class="stat-label">Resolved Apps</div>
        <div class="stat-value">${resolved}</div>
        <div class="stat-change up">${P.length ? Math.round(resolved/P.length*100) : 0}% resolution</div>
      </div>`;

    buildMonthlyChart(L, A);
    buildStatusChart(P);
    buildSubChart(L);
    buildSourceList(L);
  } catch(e) { console.error(e); }
  finally { hideLoader(); }
}

function buildMonthlyChart(leads, appts) {
  const months = Array.from({length:6}, (_,i) => {
    const d = new Date(); d.setMonth(d.getMonth()-i);
    return { key: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`, label: d.toLocaleDateString('en-KE',{month:'short'}) };
  }).reverse();

  if (charts.monthly) charts.monthly.destroy();
  const ctx = document.getElementById('monthlyChart')?.getContext('2d');
  if (!ctx) return;
  charts.monthly = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: months.map(m=>m.label),
      datasets: [
        { label:'Leads', data: months.map(m => leads.filter(l=>(l.created_at||'').startsWith(m.key)).length), backgroundColor:'rgba(246,87,48,.7)', borderRadius:4 },
        { label:'Appts', data: months.map(m => appts.filter(a=>(a.created_at||'').startsWith(m.key)).length), backgroundColor:'rgba(74,188,79,.7)', borderRadius:4 },
      ]
    },
    options: { plugins:{legend:{labels:{color:'#B8B4B0'}}}, scales:{ x:{grid:{color:'rgba(255,255,255,.06)'}}, y:{grid:{color:'rgba(255,255,255,.06)'},beginAtZero:true} } }
  });
}

function buildStatusChart(apps) {
  const resolved = apps.filter(a=>a.status==='RESOLVED').length;
  const pending  = apps.length - resolved;
  if (charts.status) charts.status.destroy();
  const ctx = document.getElementById('statusChart')?.getContext('2d');
  if (!ctx) return;
  charts.status = new Chart(ctx, {
    type: 'pie',
    data: { labels:['Resolved','Pending'], datasets:[{ data:[resolved,pending], backgroundColor:['#4ABC4F','#F65730'], borderColor:'#252320', borderWidth:2 }] },
    options: { plugins:{ legend:{ position:'bottom', labels:{ color:'#B8B4B0' } } } }
  });
}

function buildSubChart(leads) {
  const subbed = leads.filter(l=>l.clientSubScription==='SUBSCRIBED').length;
  const unsub  = leads.length - subbed;
  if (charts.sub) charts.sub.destroy();
  const ctx = document.getElementById('subChart')?.getContext('2d');
  if (!ctx) return;
  charts.sub = new Chart(ctx, {
    type: 'doughnut',
    data: { labels:['Subscribed','Unsubscribed'], datasets:[{ data:[subbed,unsub], backgroundColor:['#3498DB','#7a7874'], borderColor:'#252320', borderWidth:2 }] },
    options: { cutout:'60%', plugins:{ legend:{ position:'bottom', labels:{ color:'#B8B4B0' } } } }
  });
}

function buildSourceList(leads) {
  const sources = {};
  leads.forEach(l => { const s = l.clientSource||'Direct'; sources[s]=(sources[s]||0)+1; });
  const sorted = Object.entries(sources).sort((a,b)=>b[1]-a[1]);
  const max    = sorted[0]?.[1] || 1;
  const el     = $('sourceList');
  if (!el) return;
  el.innerHTML = sorted.map(([src,cnt]) => `
    <div>
      <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
        <span style="font-size:.82rem;">${esc(src)}</span>
        <span style="font-size:.82rem;color:var(--clr-primary);font-weight:700;">${cnt}</span>
      </div>
      <div class="progress-bar"><div class="progress-fill" style="width:${Math.round(cnt/max*100)}%"></div></div>
    </div>`).join('');
}

// ── Users ─────────────────────────────────────────────────────
async function fetchUsers() {
  showLoader('Fetching users…');
  try {
    const res = await fetch(`${DOMAIN}users`);
    userList  = await res.json();
    populateUsers();
  } finally { hideLoader(); }
}

function populateUsers() {
  const tbody = document.querySelector('#panel-users .data-table tbody');
  if (!tbody) return;
  if (!userList.length) { tbody.innerHTML = emptyRow(6,'No users found'); return; }
  tbody.innerHTML = userList.map((u,i) => `
    <tr>
      <td style="font-family:var(--font-mono);font-size:.78rem;">${esc(u.id)}</td>
      <td><strong>${esc(u.name)}</strong></td>
      <td>${esc(u.email)}</td>
      <td>${roleBadge(u.role)}</td>
      <td><span class="badge badge-default" style="font-family:var(--font-mono);">${esc(u.access_level)}</span></td>
      <td class="actions-cell">
        <button class="btn btn-secondary btn-sm btn-icon" onclick="openUpdateUser(${i})" title="Edit"><i class="fa fa-pencil"></i></button>
        <button class="btn btn-danger btn-sm btn-icon" onclick="deleteUser(${i})" title="Delete"><i class="fa fa-trash"></i></button>
      </td>
    </tr>`).join('');
}

function refreshUserTable() { userList=[]; fetchUsers(); }

function openCreateUserModal() {
  $('userModalTitle').textContent = 'Create New User';
  ['name','userEmail','userPassword'].forEach(id => { if($(id)) $(id).value=''; });
  editIndex = null;
  openModal('userPopUp');
}

function openUpdateUser(i) {
  $('userModalTitle').textContent = 'Update User';
  const u = userList[i];
  $('name').value = u.name; $('userEmail').value = u.email;
  $('role').value = u.role; $('access').value = u.access_level;
  editIndex = i;
  openModal('userPopUp');
}

async function userRegistrationOrUpdate(e) {
  e.preventDefault();
  if (editIndex !== null) { await updateUser(editIndex); }
  else { await registerUser(); }
}

async function registerUser() {
  const errEl = $('userModalError');
  const body = { name:$('name').value.trim(), email:$('userEmail').value.trim(), password:$('userPassword').value.trim(), role:$('role').value, access_level:$('access').value };
  if (!body.name||!body.email||!body.password||!body.role||!body.access_level) { showErr('All fields required',errEl); return; }
  showLoader('Creating user…');
  try {
    const res = await fetch(`${DOMAIN}users`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
    const d = await res.json();
    if (res.ok) { toast('User created!'); closeModal('userPopUp'); fetchUsers(); }
    else showErr(d.error, errEl);
  } finally { hideLoader(); }
}

async function updateUser(i) {
  const errEl = $('userModalError');
  const body = { name:$('name').value.trim(), email:$('userEmail').value.trim(), password:$('userPassword').value.trim(), role:$('role').value, access_level:$('access').value };
  showLoader('Updating user…');
  try {
    const res = await fetch(`${DOMAIN}users/${userList[i].id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
    if (res.ok) { toast('User updated!'); closeModal('userPopUp'); fetchUsers(); }
    else { const d=await res.json(); showErr(d.error, errEl); }
  } finally { hideLoader(); editIndex=null; }
}

async function deleteUser(i) {
  if (!confirm_action('Delete this user?')) return;
  showLoader('Deleting…');
  try {
    await fetch(`${DOMAIN}users/${userList[i].id}`, {method:'DELETE'});
    toast('User deleted'); userList.splice(i,1); populateUsers();
  } finally { hideLoader(); }
}

// ── Leads ─────────────────────────────────────────────────────
async function fetchLeads() {
  showLoader('Fetching leads…');
  try {
    const res  = await fetch(`${DOMAIN}clients`);
    leadList   = await res.json();
    populateLeads();
  } finally { hideLoader(); }
}

function populateLeads() {
  const tbody = document.querySelector('#panel-leads .data-table tbody');
  if (!tbody) return;
  if (!leadList.length) { tbody.innerHTML = emptyRow(9,'No leads captured yet'); return; }
  tbody.innerHTML = leadList.map((l,i) => `
    <tr>
      <td style="font-family:var(--font-mono);font-size:.72rem;">${esc(l.clientID)}</td>
      <td><strong>${esc(l.clientName)}</strong></td>
      <td>${esc(l.clientEmail)}</td>
      <td>${esc(l.clientPhone)}</td>
      <td><span class="badge badge-default">${esc(l.clientSource||'—')}</span></td>
      <td>${statusBadge(l.clientStatus)}</td>
      <td>${subBadge(l.clientSubScription)}</td>
      <td style="color:var(--clr-text-muted);font-size:.78rem;">${formatDate(l.created_at)}</td>
      <td class="actions-cell">
        <button class="btn btn-ghost btn-sm btn-icon" onclick="previewEmailTemplate(${i})" title="Preview email"><i class="fa fa-envelope-open action-icon"></i></button>
        <button class="btn btn-ghost btn-sm btn-icon" onclick="sendSubsequentEmail(${i})" title="Send follow-up"><i class="fa fa-envelope action-icon"></i></button>
        <button class="btn btn-ghost btn-sm btn-icon" onclick="unsubscribeFromLead(${i})" title="Unsubscribe"><i class="fa fa-sign-out action-icon"></i></button>
        <button class="btn btn-danger btn-sm btn-icon" onclick="deleteLead(${i})" title="Delete"><i class="fa fa-trash"></i></button>
      </td>
    </tr>`).join('');
}

function refreshLeadsTable() { leadList=[]; fetchLeads(); }

async function deleteLead(i) {
  if (!confirm_action('Delete this lead?')) return;
  showLoader('Deleting lead…');
  try {
    await fetch(`${DOMAIN}clients/${leadList[i].clientID}`, {method:'DELETE'});
    toast('Lead deleted'); leadList.splice(i,1); populateLeads();
  } finally { hideLoader(); }
}

async function unsubscribeFromLead(i) {
  showLoader('Unsubscribing…');
  try {
    const res = await fetch(`${DOMAIN}unsubscribeLead`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({clientID:leadList[i].clientID}) });
    if (res.ok) { toast('Lead unsubscribed'); leadList[i].clientSubScription='UNSUBSCRIBED'; populateLeads(); }
  } finally { hideLoader(); }
}

async function sendSubsequentEmail(i) {
  showLoader('Sending follow-up…');
  try {
    const res = await fetch(`${DOMAIN}sendSubsequentEmail`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({clientID:leadList[i].clientID}) });
    const d = await res.json();
    if (res.ok) toast(d.message); else toast(d.error,'error');
  } finally { hideLoader(); }
}

async function previewEmailTemplate(i) {
  showLoader('Loading template…');
  const res = await fetch(`${DOMAIN}emailTemplate?status=${leadList[i].clientStatus}`);
  const tpl = await res.json();
  hideLoader();
  if (tpl) { const w = window.open('','_blank'); w.document.write(tpl.body); }
}

function downloadExcel() {
  showLoader('Preparing export…');
  const leads = leadList.map(l => ({
    clientID: l.clientID, clientName: l.clientName, clientEmail: l.clientEmail,
    clientPhone: l.clientPhone, clientSource: l.clientSource, clientStatus: l.clientStatus, created_at: l.created_at
  }));
  fetch(`${DOMAIN}download/excel`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({leads}) })
    .then(r => r.blob())
    .then(blob => {
      const url = URL.createObjectURL(blob);
      const a   = document.createElement('a'); a.href=url; a.download=`leads_${Date.now()}.xlsx`;
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    })
    .catch(e => toast('Export failed','error'))
    .finally(() => hideLoader());
}

// ── Appointments ──────────────────────────────────────────────
async function fetchAppointments() {
  showLoader('Fetching appointments…');
  try {
    const res       = await fetch(`${DOMAIN}appointments`);
    appointmentList = await res.json();
    populateAppointments();
  } finally { hideLoader(); }
}

function populateAppointments() {
  const tbody = document.querySelector('#panel-appointments .data-table tbody');
  if (!tbody) return;
  if (!appointmentList.length) { tbody.innerHTML = emptyRow(8,'No appointments booked'); return; }
  tbody.innerHTML = appointmentList.map((a,i) => `
    <tr>
      <td><strong>${esc(a.name)}</strong></td>
      <td>${esc(a.email)}</td>
      <td>${esc(a.phone)}</td>
      <td>${formatDate(a.appointmentDate)}</td>
      <td style="font-size:.8rem;">${esc(a.appointmentTime||'—')}</td>
      <td><span class="badge badge-default">${esc(a.appointmentType||'—')}</span></td>
      <td>${apptStatusBadge(a.appointmentStatus)}</td>
      <td class="actions-cell">
        <button class="btn btn-ghost btn-sm btn-icon" onclick="appointmentReschedule(${i})" title="Reschedule"><i class="fa fa-calendar action-icon"></i></button>
        <button class="btn btn-ghost btn-sm btn-icon" onclick="appointmentReminder(${i})" title="Remind"><i class="fa fa-clock action-icon"></i></button>
        <button class="btn btn-ghost btn-sm btn-icon" onclick="appointmentStartMeeting(${i})" title="Join meeting"><i class="fa fa-video-camera action-icon"></i></button>
        <button class="btn btn-accent btn-sm btn-icon" onclick="appointmentUpdateStatus(${i})" title="Mark done"><i class="fa fa-check-circle"></i></button>
        <button class="btn btn-danger btn-sm btn-icon" onclick="deleteAppointment(${i})" title="Delete"><i class="fa fa-trash"></i></button>
      </td>
    </tr>`).join('');
}

function refreshAppointmentTable() { appointmentList=[]; fetchAppointments(); }

function appointmentReschedule(i) {
  $('popupHeaderTextAppt').textContent = `Reschedule — ${appointmentList[i].name?.split(' ')[0]}`;
  $('titleText').style.display = 'none';
  $('rescheduleForm').style.display = 'block';
  $('appointmentInput').value = appointmentList[i].appointmentTime||'';
  appointmentIndex = i;
  openModal('appointmentPopup');
}

async function appointmentReminder(i) {
  showLoader('Sending reminder…');
  try {
    const res = await fetch(`${DOMAIN}reminder-email`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(appointmentList[i]) });
    const d   = await res.json();
    if (res.ok) toast(d.message); else toast(d.error,'error');
  } finally { hideLoader(); }
}

function appointmentStartMeeting(i) { window.open(appointmentList[i].meetingLink,'_blank'); }

async function appointmentUpdateStatus(i) {
  showLoader('Updating…');
  try {
    await fetch(`${DOMAIN}appointments/${appointmentList[i].clientId}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({status:'DONE'}) });
    toast('Marked as Done'); appointmentList[i].appointmentStatus='DONE'; populateAppointments();
  } finally { hideLoader(); }
}

async function deleteAppointment(i) {
  if (!confirm_action('Delete this appointment?')) return;
  showLoader('Deleting…');
  try {
    await fetch(`${DOMAIN}appointments/${appointmentList[i].clientId}`, {method:'DELETE'});
    toast('Deleted'); appointmentList.splice(i,1); populateAppointments();
  } finally { hideLoader(); }
}

async function rescheduleMeeting() {
  const input = $('appointmentInput').value.trim();
  if (!input) { toast('Enter new date/time','error'); return; }
  showLoader('Rescheduling…');
  try {
    const res = await fetch(`${DOMAIN}rescheduleMeeting`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(appointmentList[appointmentIndex]) });
    const d   = await res.json();
    if (res.ok) { toast(d.message); closeModal('appointmentPopup'); fetchAppointments(); }
    else toast(d.error,'error');
  } finally { hideLoader(); }
}

// ── Applications ──────────────────────────────────────────────
async function fetchApplications() {
  showLoader('Fetching applications…');
  try {
    const res   = await fetch(`${DOMAIN}marketing-strategy-applications`);
    const data  = await res.json();
    applicationList = data.applications || [];
    populateApplications();
  } finally { hideLoader(); }
}

function populateApplications() {
  const tbody = document.querySelector('#panel-applications .data-table tbody');
  if (!tbody) return;
  if (!applicationList.length) { tbody.innerHTML = emptyRow(8,'No applications yet'); return; }
  tbody.innerHTML = applicationList.map((a,i) => `
    <tr>
      <td style="font-family:var(--font-mono);font-size:.72rem;">${esc(a.applicationDate)}</td>
      <td><strong>${esc(a.applicantFName)} ${esc(a.applicantLName)}</strong></td>
      <td>${esc(a.email)}</td>
      <td>${esc(a.phone)}</td>
      <td><button class="btn btn-ghost btn-sm" onclick="previewOccupation(${i})">${truncate(a.occupation,20)}</button></td>
      <td>${esc(a.strategyInvestment||'—')}</td>
      <td>${appStatusBadge(a.status)}</td>
      <td class="actions-cell">
        <button class="btn btn-ghost btn-sm btn-icon" onclick="previewGoal(${i})" title="Goal"><i class="fa fa-eye"></i></button>
        <button class="btn btn-ghost btn-sm btn-icon" onclick="previewTrigger(${i})" title="Triggers"><i class="fa fa-bolt"></i></button>
        <button class="btn btn-accent btn-sm btn-icon" onclick="updateApplicationStatus(${i})" title="Resolve"><i class="fa fa-check"></i></button>
        <button class="btn btn-danger btn-sm btn-icon" onclick="deleteApplication(${i})" title="Delete"><i class="fa fa-trash"></i></button>
      </td>
    </tr>`).join('');
}

function refreshApplicationTable() { applicationList=[]; fetchApplications(); }

function previewOccupation(i) { openPreviewModal('Occupation', applicationList[i].occupation); }
function previewTrigger(i)    { openPreviewModal('Market Triggers', applicationList[i].marketTriggers); }
function previewGoal(i)       { openPreviewModal('Strategy Goal', applicationList[i].strategyGoal); }
function previewInvestment(i) { openPreviewModal('Investment Budget', applicationList[i].strategyInvestment); }

function openPreviewModal(title, content) {
  $('popupHeaderTextApplication').textContent = title;
  $('titleTextApplication').textContent = content || '—';
  openModal('applicationPopup');
}

async function updateApplicationStatus(i) {
  showLoader('Resolving…');
  try {
    const res = await fetch(`${DOMAIN}marketing-strategy-applications/${applicationList[i].applicationDate}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({status:'RESOLVED'}) });
    if (res.ok) { toast('Marked resolved'); applicationList[i].status='RESOLVED'; populateApplications(); }
    else toast('Update failed','error');
  } finally { hideLoader(); }
}

async function deleteApplication(i) {
  if (!confirm_action('Delete application?')) return;
  showLoader('Deleting…');
  try {
    await fetch(`${DOMAIN}marketing-strategy-applications/${applicationList[i].applicationDate}`, {method:'DELETE'});
    toast('Deleted'); applicationList.splice(i,1); populateApplications();
  } finally { hideLoader(); }
}

// ── About / Content ───────────────────────────────────────────
async function fetchAbout() {
  showLoader('Fetching content…');
  try {
    const [aboutRes, videoRes] = await Promise.all([
      fetch(`${DOMAIN}about-data`),
      fetch(`${DOMAIN}video-data`)
    ]);
    aboutList = await aboutRes.json();
    videoList = await videoRes.json();
    populateAbout();
    populateVideo();
  } finally { hideLoader(); }
}

function populateAbout() {
  const tbody = $('aboutList');
  if (!tbody) return;
  if (!aboutList.length) { tbody.innerHTML = emptyRow(6,'No profiles added'); return; }
  tbody.innerHTML = aboutList.map((a,i) => `
    <tr>
      <td style="font-family:var(--font-mono);font-size:.72rem;">${esc(a.id)}</td>
      <td><button class="btn btn-ghost btn-sm" onclick="previewTitle(${i})">${truncate(a.title,30)}</button></td>
      <td><button class="btn btn-ghost btn-sm" onclick="previewIntroduction(${i})">${truncate(a.introduction,30)}</button></td>
      <td><button class="btn btn-ghost btn-sm" onclick="updateStatus(${i})" title="Click to activate">${statusBadge(a.status)}</button></td>
      <td>
        ${a.icon ? `<div onclick="previewImage(${i})" style="width:40px;height:40px;border-radius:var(--radius-md);background:url(${a.icon}) center/cover;cursor:pointer;border:2px solid var(--clr-border);"></div>` : '—'}
      </td>
      <td class="actions-cell">
        <button class="btn btn-danger btn-sm btn-icon" onclick="deleteAbout(${i})"><i class="fa fa-trash"></i></button>
      </td>
    </tr>`).join('');
}

function populateVideo() {
  const tbody = $('videoList');
  if (!tbody) return;
  if (!videoList.length) { tbody.innerHTML = emptyRow(6,'No videos uploaded'); return; }
  tbody.innerHTML = videoList.map((v,i) => `
    <tr>
      <td style="font-family:var(--font-mono);font-size:.72rem;">${esc(v.id)}</td>
      <td>${esc(v.title)}</td>
      <td>${esc(v.created_by||'—')}</td>
      <td style="font-size:.78rem;color:var(--clr-text-muted);">${formatDate(v.created_on)}</td>
      <td><button onclick="updateVideoStatus(${i})" class="btn btn-ghost btn-sm">${statusBadge(v.status)}</button></td>
      <td class="actions-cell">
        <button class="btn btn-ghost btn-sm btn-icon" onclick="previewVideo(${i})"><i class="fa fa-play"></i></button>
        <button class="btn btn-danger btn-sm btn-icon" onclick="deleteVideo(${i})"><i class="fa fa-trash"></i></button>
      </td>
    </tr>`).join('');
}

function refreshAbout() { aboutList=[]; videoList=[]; fetchAbout(); }
function refreshVideos() { refreshAbout(); }

function openAboutRegisterPopup() { openModal('aboutRegisterPopup'); }
function openVideoRegisterPopup() { openModal('videoRegisterPopup'); }

function previewTitle(i)        { openAboutEdit('About - Title', aboutList[i].title, i, {isTitle:true}); }
function previewIntroduction(i) { openAboutEdit('About - Introduction', aboutList[i].introduction, i, {isIntro:true}); }
function previewExperience(i)   { openAboutEdit('About - Experience', aboutList[i].experience, i, {isExperience:true}); }
function previewMission(i)      { openAboutEdit('About - Mission', aboutList[i].mission, i, {isMission:true}); }

function openAboutEdit(title, val, i, flags) {
  $('popupHeaderTextAbout').textContent = title;
  $('aboutInput').value = val || '';
  aboutIndex = i;
  editFlags = {isTitle:false,isIntro:false,isMission:false,isExperience:false, ...flags};
  openModal('aboutPopup');
}

function updateAboutSection() {
  if (editFlags.isExperience) updateExperience(aboutIndex);
  else if (editFlags.isIntro) updateIntroduction(aboutIndex);
  else if (editFlags.isTitle) updateTitle(aboutIndex);
  else if (editFlags.isMission) updateMission(aboutIndex);
}

async function patchAbout(i, patch) {
  const payload = { ...aboutList[i], ...patch };
  showLoader('Saving…');
  try {
    const res = await fetch(`${DOMAIN}about-data/${aboutList[i].id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) });
    if (res.ok) { toast('Updated!'); Object.assign(aboutList[i], patch); populateAbout(); closeModal('aboutPopup'); }
    else toast('Update failed','error');
  } finally { hideLoader(); }
}
async function updateExperience(i) { await patchAbout(i,{experience:$('aboutInput').value}); }
async function updateIntroduction(i) { await patchAbout(i,{introduction:$('aboutInput').value}); }
async function updateTitle(i) { await patchAbout(i,{title:$('aboutInput').value}); }
async function updateMission(i) { await patchAbout(i,{mission:$('aboutInput').value}); }

/**async function updateStatus(i) {
  aboutList[i].status = 'ACTIVE';
  showLoader('Activating profile…');
  try {
    const res = await fetch(`${DOMAIN}about-data-update-status/${aboutList[i].id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(aboutList[i]) });
    if (res.ok) { toast('Profile activated!'); await fetchAbout(); }
    else toast('Failed','error');
  } finally { hideLoader(); }
}*/

async function updateStatus(index) {
  // Toggle: if already ACTIVE deactivate; if INACTIVE activate
  const targetStatus = aboutList[index].status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
  const confirmed = targetStatus === 'ACTIVE'
    ? confirm(`Activate "${aboutList[index].title}"? This will be set as the ACTIVE profile.`)
    : confirm(`Deactivate "${aboutList[index].title}"?`);
  if (!confirmed) return;
 
  showLoader(`${targetStatus === 'ACTIVE' ? 'Activating' : 'Deactivating'} profile…`);
  try {
    let res;
    if (targetStatus === 'ACTIVE') {
      // Use the "update status" endpoint which deactivates others in the same dept
      const payload = { ...aboutList[index], status: 'ACTIVE' };
      res = await fetch(`${DOMAIN}about-data-update-status/${aboutList[index].id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } else {
      // Just update this one to INACTIVE
      const payload = { ...aboutList[index], status: 'INACTIVE' };
      res = await fetch(`${DOMAIN}about-data/${aboutList[index].id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }
    if (res.ok) {
      toast(`Profile ${targetStatus === 'ACTIVE' ? 'activated' : 'deactivated'}!`);
      await fetchAbout();
    } else {
      const d = await res.json();
      toast(d.error || 'Update failed', 'error');
    }
  } finally { hideLoader(); }
}

/* ═══════════════════════════════════════════════════════════
   3. TEAM MEMBERS MANAGEMENT SECTION
   Separate from "about" — manages company team + roles
   ═══════════════════════════════════════════════════════════ */
let teamMembers = [];
let editTeamMemberId = null;
 
async function fetchTeamMembers() {
  showLoader('Loading team members…');
  try {
    const res = await fetch(`${DOMAIN}team-members`);
    teamMembers = res.ok ? await res.json() : [];
    renderTeamMembers();
  } finally { hideLoader(); }
}
 
function renderTeamMembers() {
  const tbody = document.getElementById('teamMembersTbody');
  if (!tbody) return;
  if (!teamMembers.length) { tbody.innerHTML = emptyRow(7, 'No team members added yet'); return; }
  tbody.innerHTML = teamMembers.map((m, i) => `
    <tr>
      <td>
        <div style="display:flex;align-items:center;gap:12px;">
          ${m.photo ? `<div style="width:36px;height:36px;border-radius:50%;background:url(${m.photo}) center/cover;border:2px solid var(--clr-primary);flex-shrink:0;"></div>` : `<div style="width:36px;height:36px;border-radius:50%;background:var(--clr-primary);display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;font-size:.85rem;flex-shrink:0;">${(m.name||'?').charAt(0).toUpperCase()}</div>`}
          <span style="font-weight:600;">${esc(m.name)}</span>
        </div>
      </td>
      <td><span class="badge badge-info">${esc(m.company_role||'—')}</span></td>
      <td>${esc(m.department||'—')}</td>
      <td>${esc(m.email||'—')}</td>
      <td>${esc(m.phone||'—')}</td>
      <td>
        <button onclick="toggleTeamMemberStatus('${m.id}',${i})" class="badge ${m.is_active?'badge-success':'badge-default'}" style="cursor:pointer;border:none;font-size:.72rem;" title="Click to toggle">
          ${m.is_active ? '● Active' : '○ Inactive'}
        </button>
      </td>
      <td class="actions-cell">
        <button class="btn btn-secondary btn-sm btn-icon" onclick="openEditTeamMember(${i})"><i class="fa fa-pencil"></i></button>
        <button class="btn btn-danger btn-sm btn-icon" onclick="deleteTeamMember('${m.id}',${i})"><i class="fa fa-trash"></i></button>
      </td>
    </tr>`).join('');
}
 
async function toggleTeamMemberStatus(id, i) {
  const m = teamMembers[i];
  const newStatus = !m.is_active;
  showLoader('Updating…');
  try {
    const res = await fetch(`${DOMAIN}team-members/${id}/status`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: newStatus }),
    });
    if (res.ok) {
      teamMembers[i].is_active = newStatus;
      renderTeamMembers();
      toast(`${m.name} ${newStatus ? 'activated' : 'deactivated'}`);
    } else toast('Update failed', 'error');
  } finally { hideLoader(); }
}
 
function openAddTeamMember() {
  editTeamMemberId = null;
  document.getElementById('teamMemberModalTitle').textContent = 'Add Team Member';
  ['tmName','tmRole','tmDept','tmEmail','tmPhone','tmBio'].forEach(id => setValue(id, ''));
  document.getElementById('tmIsActive').checked = true;
  openModal('teamMemberPopup');
}
 
function openEditTeamMember(i) {
  const m = teamMembers[i];
  editTeamMemberId = m.id;
  document.getElementById('teamMemberModalTitle').textContent = 'Edit Team Member';
  setValue('tmName',  m.name);
  setValue('tmRole',  m.company_role||'');
  setValue('tmDept',  m.department||'');
  setValue('tmEmail', m.email||'');
  setValue('tmPhone', m.phone||'');
  setValue('tmBio',   m.bio||'');
  document.getElementById('tmIsActive').checked = !!m.is_active;
  openModal('teamMemberPopup');
}
 
async function saveTeamMember() {
  const name = getValue('tmName'), role = getValue('tmRole');
  if (!name || !role) { toast('Name and company role are required', 'error'); return; }
 
  const form = new FormData();
  form.append('name',         name);
  form.append('company_role', role);
  form.append('department',   getValue('tmDept'));
  form.append('email',        getValue('tmEmail'));
  form.append('phone',        getValue('tmPhone'));
  form.append('bio',          getValue('tmBio'));
  form.append('is_active',    document.getElementById('tmIsActive').checked ? 1 : 0);
  const photo = document.getElementById('tmPhoto')?.files[0];
  if (photo) form.append('photo', photo);
 
  showLoader('Saving team member…');
  try {
    const isEdit = editTeamMemberId !== null;
    const url    = isEdit ? `${DOMAIN}team-members/${editTeamMemberId}` : `${DOMAIN}team-members`;
    const method = isEdit ? 'PUT' : 'POST';
    const res    = isEdit
      ? await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(form)) })
      : await fetch(url, { method, body: form });
    if (res.ok) { toast(isEdit ? 'Team member updated!' : 'Team member added!'); closeModal('teamMemberPopup'); fetchTeamMembers(); }
    else toast('Save failed', 'error');
  } finally { hideLoader(); editTeamMemberId = null; }
}
 
async function deleteTeamMember(id, i) {
  if (!confirm(`Delete ${teamMembers[i].name}?`)) return;
  showLoader('Deleting…');
  try {
    await fetch(`${DOMAIN}team-members/${id}`, { method: 'DELETE' });
    toast('Deleted'); teamMembers.splice(i, 1); renderTeamMembers();
  } finally { hideLoader(); }
}
 
 
/* ═══════════════════════════════════════════════════════════
   4. ANALYTICS — Web Visits + Unique IPs
   ═══════════════════════════════════════════════════════════ */
async function loadAnalyticsWithVisits() {
  showLoader('Loading analytics…');
  try {
    const [visits, unique, leads, appts, apps] = await Promise.allSettled([
      //fetch(`${DOMAIN}analytics/track`).then(r => r.json()),
      fetch(`${DOMAIN}analytics/track`)
  .then(r => r.json())
  .then(data => console.log(data)),
      fetch(`${DOMAIN}analytics/unique-ips`).then(r => r.json()),
      fetch(`${DOMAIN}clients`).then(r => r.json()),
      fetch(`${DOMAIN}appointments`).then(r => r.json()),
      fetch(`${DOMAIN}marketing-strategy-applications`).then(r => r.json()),
    ]);
 
    const V = visits.value || {};
    const U = unique.value || {};
    const L = leads.value  || [];
    const A = appts.value  || [];
    const P = (apps.value?.applications) || [];
 
    // Update stats grid
    document.getElementById('analyticsStats').innerHTML = `
      <div class="stat-card" style="--accent-color:#3498DB;">
        <i class="fa fa-eye stat-icon"></i>
        <div class="stat-label">Total Page Views</div>
        <div class="stat-value">${(V.total || 0).toLocaleString()}</div>
        <div class="stat-change up"><i class="fa fa-arrow-up"></i> ${V.today || 0} today</div>
      </div>
      <div class="stat-card" style="--accent-color:#9B59B6;">
        <i class="fa fa-users stat-icon"></i>
        <div class="stat-label">Unique Visitors</div>
        <div class="stat-value">${(U.total || 0).toLocaleString()}</div>
        <div class="stat-change up"><i class="fa fa-arrow-up"></i> ${U.today || 0} today</div>
      </div>
      <div class="stat-card" style="--accent-color:var(--clr-primary);">
        <i class="fa fa-users stat-icon"></i>
        <div class="stat-label">Total Leads</div>
        <div class="stat-value">${L.length}</div>
        <div class="stat-change up">All time</div>
      </div>
      <div class="stat-card" style="--accent-color:var(--clr-accent);">
        <i class="fa fa-calendar stat-icon"></i>
        <div class="stat-label">Appointments</div>
        <div class="stat-value">${A.length}</div>
        <div class="stat-change">${A.filter(a => a.appointmentStatus === 'DONE').length} completed</div>
      </div>
      <div class="stat-card" style="--accent-color:var(--clr-warning);">
        <i class="fa fa-check-circle stat-icon"></i>
        <div class="stat-label">Applications</div>
        <div class="stat-value">${P.length}</div>
        <div class="stat-change">${P.filter(p => p.status === 'RESOLVED').length} resolved</div>
      </div>
      <div class="stat-card" style="--accent-color:#1ABC9C;">
        <i class="fa fa-line-chart stat-icon"></i>
        <div class="stat-label">Lead Rate</div>
        <div class="stat-value">${V.total ? ((L.length / V.total) * 100).toFixed(1) + '%' : '—'}</div>
        <div class="stat-change">Views → Leads</div>
      </div>`;
 
    // Build charts
    buildMonthlyChart(L, A);
    buildStatusChart(P);
    buildSubChart(L);
    buildSourceList(L);
    buildVisitChart(V.daily || []);
    buildTopPagesTable(V.pages || []);
  } catch (e) { console.error(e); }
  finally { hideLoader(); }
}
 
function buildVisitChart(dailyData) {
  if (charts.visits) charts.visits.destroy();
  const ctx = document.getElementById('visitsChart')?.getContext('2d');
  if (!ctx || !dailyData.length) return;
  charts.visits = new Chart(ctx, {
    type: 'line',
    data: {
      labels: dailyData.map(d => new Date(d.date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })),
      datasets: [
        { label: 'Page Views', data: dailyData.map(d => d.views), borderColor: '#3498DB', backgroundColor: 'rgba(52,152,219,.1)', fill: true, tension: .4, pointRadius: 3 },
        { label: 'Unique IPs', data: dailyData.map(d => d.unique), borderColor: '#9B59B6', backgroundColor: 'rgba(155,89,182,.1)', fill: true, tension: .4, pointRadius: 3 },
      ],
    },
    options: {
      plugins: { legend: { labels: { color: '#B8B4B0', font: { size: 11 } } } },
      scales: { x: { grid: { color: 'rgba(255,255,255,.05)' } }, y: { grid: { color: 'rgba(255,255,255,.05)' }, beginAtZero: true } },
    },
  });
}
 
function buildTopPagesTable(pages) {
  const el = document.getElementById('topPagesTable');
  if (!el || !pages.length) return;
  el.innerHTML = pages.slice(0, 8).map((p, i) => `
    <tr>
      <td style="font-family:var(--font-mono);font-size:.72rem;color:var(--clr-text-muted);">${i+1}</td>
      <td style="font-size:.82rem;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(p.page || '/')}</td>
      <td style="font-family:var(--font-mono);font-size:.82rem;">${(p.views || 0).toLocaleString()}</td>
      <td style="font-family:var(--font-mono);font-size:.82rem;">${(p.unique || 0).toLocaleString()}</td>
    </tr>`).join('');
}
 
 
/* ═══════════════════════════════════════════════════════════
   5. SETTINGS — Email Management + Location + Auto-signout
   ═══════════════════════════════════════════════════════════ */
async function loadAllSettings() {
  showLoader('Loading settings…');
  try {
    const res  = await fetch(`${DOMAIN}site-settings/global`);
    const data = res.ok ? await res.json() : {};
 
    // General
    setValue('settingSiteName',       data.site_name       || 'AdConnect');
    setValue('settingContactEmail',   data.contact_email   || 'info@adconnect.co.ke');
    setValue('settingPhone',          data.phone           || '+254 790 064 130');
    setValue('settingWhatsapp',       data.whatsapp        || '254790064130');
    setValue('settingAddress',        data.address         || 'Nairobi, Kenya');
    setValue('settingCity',           data.city            || 'Nairobi');
    setValue('settingCountry',        data.country         || 'Kenya');
    setValue('settingMapUrl',         data.map_url         || '');
    setValue('settingTimezone',       data.timezone        || 'Africa/Nairobi');
 
    // Email
    setValue('settingSmtpHost',       data.smtp_host       || '');
    setValue('settingSmtpPort',       data.smtp_port       || '465');
    setValue('settingSmtpUser',       data.smtp_user       || '');
    setValue('settingEmailFromName',  data.email_from_name || 'AdConnect Team');
    setValue('settingAdminEmail',     data.admin_email     || 'info@adconnect.co.ke');
 
    // Auto-signout
    const mins = parseInt(data.auto_signout_minutes) || 10;
    setValue('settingAutoSignout', mins);
    AutoSignout.setMinutes(mins);
 
    // Google OAuth status
    const tokenRes = await fetch(`${DOMAIN}google-token-status`);
    const tokenData = tokenRes.ok ? await tokenRes.json() : {};
    updateTokenStatus(tokenData);
  } finally { hideLoader(); }
}
 
async function saveAllSettings() {
  const mins = parseInt(getValue('settingAutoSignout')) || 10;
  const body = {
    site_name:           getValue('settingSiteName'),
    contact_email:       getValue('settingContactEmail'),
    phone:               getValue('settingPhone'),
    whatsapp:            getValue('settingWhatsapp'),
    address:             getValue('settingAddress'),
    city:                getValue('settingCity'),
    country:             getValue('settingCountry'),
    map_url:             getValue('settingMapUrl'),
    timezone:            getValue('settingTimezone'),
    smtp_host:           getValue('settingSmtpHost'),
    smtp_port:           getValue('settingSmtpPort'),
    smtp_user:           getValue('settingSmtpUser'),
    email_from_name:     getValue('settingEmailFromName'),
    admin_email:         getValue('settingAdminEmail'),
    auto_signout_minutes: mins,
  };
 
  // Only save SMTP password if provided
  const smtpPass = getValue('settingSmtpPassword');
  if (smtpPass) body.smtp_password = smtpPass;
 
  showLoader('Saving settings…');
  try {
    const res = await fetch(`${DOMAIN}site-settings/global`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    if (res.ok) {
      toast('Settings saved!');
      AutoSignout.setMinutes(mins);
    } else toast('Save failed', 'error');
  } finally { hideLoader(); }
}
 
async function sendTestEmail() {
  const email = getValue('settingContactEmail') || getValue('settingAdminEmail');
  if (!email) { toast('Enter an email address first', 'error'); return; }
  showLoader('Sending test email…');
  try {
    const res = await fetch(`${DOMAIN}settings/test-email`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to: email }),
    });
    if (res.ok) toast(`Test email sent to ${email}!`);
    else toast('Failed to send test email', 'error');
  } finally { hideLoader(); }
}
 
 
/* ═══════════════════════════════════════════════════════════
   6. GOOGLE MEET TOKEN MANAGEMENT (Shared Hosting Fix)
   Since you can't access terminal on TrueHost shared hosting,
   tokens are managed via the admin UI.
   ═══════════════════════════════════════════════════════════ */
function updateTokenStatus(data) {
  const el = document.getElementById('googleTokenStatus');
  if (!el) return;
  if (data.valid) {
    el.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;">
        <div style="width:10px;height:10px;background:var(--clr-accent);border-radius:50%;animation:blink 1.4s ease infinite;"></div>
        <div>
          <div style="font-size:.85rem;font-weight:600;color:var(--clr-accent);">Token Active</div>
          <div style="font-size:.72rem;color:var(--clr-text-muted);">Expires: ${data.expiry ? new Date(data.expiry).toLocaleString('en-KE') : 'Unknown'}</div>
        </div>
      </div>`;
  } else {
    el.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;">
        <div style="width:10px;height:10px;background:var(--clr-error);border-radius:50%;"></div>
        <div>
          <div style="font-size:.85rem;font-weight:600;color:var(--clr-error);">Token Expired / Missing</div>
          <div style="font-size:.72rem;color:var(--clr-text-muted);">Click "Re-authorize" to fix Google Meet links</div>
        </div>
      </div>`;
  }
}
 
async function initiateGoogleAuth() {
  showLoader('Getting authorization URL…');
  try {
    const res  = await fetch(`${DOMAIN}google-auth-url`);
    const data = await res.json();
    if (data.url) {
      // Open in popup so admin stays on page
      const w = window.open(data.url, 'GoogleAuth', 'width=600,height=700,top=100,left=200');
      // Poll for completion
      const poll = setInterval(async () => {
        try {
          const check = await fetch(`${DOMAIN}google-token-status`);
          const status = await check.json();
          if (status.valid) {
            clearInterval(poll);
            if (w && !w.closed) w.close();
            updateTokenStatus(status);
            toast('Google authorization successful! Meet links will now work.');
          }
        } catch {}
      }, 3000);
      // Stop polling after 5 min
      setTimeout(() => clearInterval(poll), 5 * 60 * 1000);
    } else toast('Failed to get authorization URL', 'error');
  } finally { hideLoader(); }
}
 
async function refreshGoogleToken() {
  showLoader('Refreshing token…');
  try {
    const res  = await fetch(`${DOMAIN}google-refresh-token`, { method: 'POST' });
    const data = await res.json();
    if (res.ok) { updateTokenStatus({ valid: true, expiry: data.expiry }); toast('Token refreshed!'); }
    else toast(data.error || 'Refresh failed', 'error');
  } finally { hideLoader(); }
}
 
// Auto-refresh token on admin load if near expiry
async function checkAndRefreshToken() {
  try {
    const res  = await fetch(`${DOMAIN}google-token-status`);
    const data = await res.json();
    if (data.expiry && data.expiry - Date.now() < 30 * 60 * 1000) {
      // Less than 30 min left — auto refresh
      await refreshGoogleToken();
    }
  } catch {}
}
 
 
/* ═══════════════════════════════════════════════════════════
   7. APPOINTMENT PANEL — Full handling
   ═══════════════════════════════════════════════════════════ */
function populateAppointments() {
  const tbody = document.querySelector('#panel-appointments .data-table tbody');
  if (!tbody) return;
  if (!appointmentList.length) { tbody.innerHTML = emptyRow(8, 'No appointments booked'); return; }
 
  tbody.innerHTML = appointmentList.map((a, i) => `
    <tr>
      <td>
        <div style="font-weight:600;color:var(--clr-text-primary);">${esc(a.name)}</div>
        <div style="font-size:.72rem;color:var(--clr-text-muted);">${esc(a.email)}</div>
      </td>
      <td><a href="tel:${esc(a.phone||'')}" style="color:var(--clr-primary);font-size:.82rem;">${esc(a.phone||'—')}</a></td>
      <td style="font-size:.82rem;">${formatDate(a.appointmentDate)}</td>
      <td style="font-family:var(--font-mono);font-size:.78rem;">${esc(a.appointmentTime||'—')}</td>
      <td><span class="badge badge-default" style="font-size:.68rem;">${esc(a.appointmentType||'Online')}</span></td>
      <td>${apptStatusBadge(a.appointmentStatus)}</td>
      <td style="font-size:.75rem;color:var(--clr-text-muted);max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${esc(a.appointmentNotes||'')}">${esc(a.appointmentNotes||'—')}</td>
      <td class="actions-cell">
        <!-- Reschedule -->
        <button class="btn btn-ghost btn-sm btn-icon" onclick="appointmentReschedule(${i})" title="Reschedule">
          <i class="fa fa-calendar action-icon"></i>
        </button>
        <!-- Reminder email -->
        <button class="btn btn-ghost btn-sm btn-icon" onclick="appointmentReminder(${i})" title="Send reminder">
          <i class="fa fa-clock action-icon"></i>
        </button>
        <!-- Join meeting -->
        ${a.meetingLink ? `<a href="${esc(a.meetingLink)}" target="_blank" class="btn btn-ghost btn-sm btn-icon" title="Join meeting">
          <i class="fa fa-video-camera action-icon"></i>
        </a>` : `<button class="btn btn-ghost btn-sm btn-icon" onclick="regenerateMeetLink(${i})" title="Generate meet link">
          <i class="fa fa-link action-icon"></i>
        </button>`}
        <!-- Mark done -->
        <button class="btn btn-accent btn-sm btn-icon" onclick="appointmentUpdateStatus(${i})" title="Mark as Done">
          <i class="fa fa-check-circle"></i>
        </button>
        <!-- Delete -->
        <button class="btn btn-danger btn-sm btn-icon" onclick="deleteAppointment(${i})" title="Delete">
          <i class="fa fa-trash"></i>
        </button>
      </td>
    </tr>`).join('');
}
 
async function regenerateMeetLink(i) {
  showLoader('Generating Meet link…');
  try {
    const a   = appointmentList[i];
    const res = await fetch(`${DOMAIN}create-meet-link`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventTitle: `AdConnect Consultation with ${a.name}`, startDateTime: `${a.appointmentDate} 09:00:00`, endDateTime: `${a.appointmentDate} 09:30:00` }),
    });
    const data = await res.json();
    if (res.ok && data.meetLink) {
      // Save to DB
      await fetch(`${DOMAIN}appointments/${a.clientId}/meeting-link`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ meetingLink: data.meetLink }),
      });
      appointmentList[i].meetingLink = data.meetLink;
      populateAppointments();
      toast('Meeting link generated!');
    } else {
      toast(data.error || 'Failed — Google token may need refresh. Check Settings → Google OAuth.', 'error');
    }
  } finally { hideLoader(); }
}
 
function previewNotes(i) {
  document.getElementById('popupHeaderTextAppt').textContent = `Notes — ${appointmentList[i].name?.split(' ')[0]}`;
  document.getElementById('titleText').textContent = appointmentList[i].appointmentNotes || 'No notes.';
  document.getElementById('titleText').style.display = 'block';
  document.getElementById('rescheduleForm').style.display = 'none';
  openModal('appointmentPopup');
}
 
function appointmentReschedule(i) {
  document.getElementById('popupHeaderTextAppt').textContent = `Reschedule — ${appointmentList[i].name?.split(' ')[0]}`;
  document.getElementById('titleText').style.display = 'none';
  document.getElementById('rescheduleForm').style.display = 'block';
  document.getElementById('appointmentInput').value = appointmentList[i].appointmentTime || '';
  appointmentIndex = i;
  openModal('appointmentPopup');
}

async function updateVideoStatus(i) {
  videoList[i].status = 'ACTIVE';
  showLoader('Activating video…');
  try {
    const res = await fetch(`${DOMAIN}video-data-update-status/${videoList[i].id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(videoList[i]) });
    if (res.ok) { toast('Video activated!'); fetchAbout(); }
    else toast('Failed','error');
  } finally { hideLoader(); }
}

function previewImage(i) {
  $('photoViewArea').style.backgroundImage = `url(${aboutList[i].icon})`;
  openModal('aboutPhotoPopup');
}
function previewVideo(i) {
  $('popupVideo').src = videoList[i].video;
  openModal('aboutVideoPopup');
}

async function registerAboutSection() {
  const err = $('aboutRegError');
  const title = $('inputTitle1').value.trim(), intro=$('inputIntroduction').value.trim(), exp=$('inputExperience').value.trim(), mission=$('inputMission').value.trim(), icon=$('inputIcon').files[0];
  if (!title||!intro||!exp||!mission||!icon) { showErr('All fields required',err); return; }
  const form = new FormData();
  form.append('title',title); form.append('introduction',intro); form.append('experience',exp); form.append('mission',mission); form.append('status','INACTIVE'); form.append('icon',icon);
  showLoader('Submitting profile…');
  try {
    const res = await fetch(`${DOMAIN}about-data`, { method:'POST', body:form });
    if (res.ok) { toast('Profile added!'); closeModal('aboutRegisterPopup'); fetchAbout(); }
    else { const d=await res.json(); showErr(d.error,err); }
  } finally { hideLoader(); }
}

async function deleteAbout(i) {
  if (!confirm_action('Delete this profile?')) return;
  showLoader('Deleting…');
  try {
    await fetch(`${DOMAIN}about-data/${aboutList[i].id}`, {method:'DELETE'});
    toast('Deleted'); aboutList.splice(i,1); populateAbout();
  } finally { hideLoader(); }
}

async function registerVideoSection() {
  const err = $('videoRegError');
  const title=$('inputTitle2').value.trim(), file=$('inputVideo').files[0];
  if (!title||!file) { showErr('All fields required',err); return; }
  const form = new FormData();
  form.append('title',title); form.append('created_by',$('usernameSession').textContent||'Admin'); form.append('status','INACTIVE'); form.append('video',file);
  showLoader('Uploading video…');
  try {
    const res = await fetch(`${DOMAIN}video-data`, { method:'POST', body:form });
    if (res.ok) { toast('Video uploaded!'); closeModal('videoRegisterPopup'); fetchAbout(); }
    else { const d=await res.json(); showErr(d.error,err); }
  } finally { hideLoader(); }
}

async function deleteVideo(i) {
  if (!confirm_action('Delete this video?')) return;
  showLoader('Deleting…');
  try {
    await fetch(`${DOMAIN}video-data/${videoList[i].id}`, {method:'DELETE'});
    toast('Deleted'); videoList.splice(i,1); populateVideo();
  } finally { hideLoader(); }
}

// ── Blog Posts ────────────────────────────────────────────────
async function fetchBlogPosts() {
  showLoader('Fetching blog posts…');
  try {
    const res  = await fetch(`${DOMAIN}blog-posts`);
    blogList   = res.ok ? await res.json() : [];
    populateBlogPosts();
  } finally { hideLoader(); }
}

function populateBlogPosts() {
  const tbody = $('blogList');
  if (!tbody) return;
  const filter = $('blogStatusFilter')?.value || '';
  const q = $('searchBlogInput')?.value.toLowerCase() || '';
  const items = blogList.filter(b => (!filter||b.status===filter) && (!q||b.title.toLowerCase().includes(q)));
  if (!items.length) { tbody.innerHTML = emptyRow(6,'No blog posts yet'); return; }
  tbody.innerHTML = items.map((b,i) => `
    <tr>
      <td><strong>${esc(b.title)}</strong></td>
      <td><span class="badge badge-default">${esc(b.category||'—')}</span></td>
      <td>${esc(b.author||'—')}</td>
      <td>${blogStatusBadge(b.status)}</td>
      <td style="font-size:.78rem;color:var(--clr-text-muted);">${formatDate(b.created_at)}</td>
      <td class="actions-cell">
        <button class="btn btn-secondary btn-sm btn-icon" onclick="editBlogPost(${i})" title="Edit"><i class="fa fa-pencil"></i></button>
        <button class="btn btn-danger btn-sm btn-icon" onclick="deleteBlogPost(${i})" title="Delete"><i class="fa fa-trash"></i></button>
      </td>
    </tr>`).join('');
}

function filterBlogPosts() { populateBlogPosts(); }

function openBlogForm(i = null) {
  $('blogModalTitle').textContent = i === null ? 'New Blog Post' : 'Edit Post';
  if (i !== null) {
    const b = blogList[i];
    $('blogTitle').value=b.title; $('blogCategory').value=b.category; $('blogStatus').value=b.status;
    $('blogExcerpt').value=b.excerpt; $('blogContent').value=b.content;
  } else {
    ['blogTitle','blogExcerpt','blogContent'].forEach(id=>$(id)&&($(id).value=''));
  }
  editIndex = i;
  openModal('blogPopup');
}

function editBlogPost(i) { openBlogForm(i); }

async function saveBlogPost(status) {
  const errEl = $('blogFormError');
  const body = {
    title: $('blogTitle').value.trim(), category: $('blogCategory').value,
    status, excerpt: $('blogExcerpt').value.trim(), content: $('blogContent').value.trim(),
    author: $('usernameSession').textContent,
  };
  if (!body.title||!body.excerpt||!body.content) { showErr('Title, excerpt and content required',errEl); return; }
  showLoader('Saving post…');
  try {
    const isEdit = editIndex !== null;
    const url    = isEdit ? `${DOMAIN}blog-posts/${blogList[editIndex].id}` : `${DOMAIN}blog-posts`;
    const method = isEdit ? 'PUT' : 'POST';
    const res    = await fetch(url, { method, headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
    if (res.ok) { toast(isEdit?'Post updated!':'Post created!'); closeModal('blogPopup'); fetchBlogPosts(); }
    else { const d=await res.json(); showErr(d.error,errEl); }
  } finally { hideLoader(); editIndex=null; }
}

async function deleteBlogPost(i) {
  if (!confirm_action('Delete this blog post?')) return;
  showLoader('Deleting…');
  try {
    await fetch(`${DOMAIN}blog-posts/${blogList[i].id}`, {method:'DELETE'});
    toast('Post deleted'); blogList.splice(i,1); populateBlogPosts();
  } finally { hideLoader(); }
}

// ── Portfolio Projects ────────────────────────────────────────
async function fetchProjects() {
  showLoader('Fetching projects…');
  try {
    const res   = await fetch(`${DOMAIN}projects`);
    projectList = res.ok ? await res.json() : [];
    populateProjects();
  } finally { hideLoader(); }
}

function populateProjects() {
  const tbody = $('projectList');
  if (!tbody) return;
  if (!projectList.length) { tbody.innerHTML = emptyRow(6,'No projects added yet'); return; }
  tbody.innerHTML = projectList.map((p,i) => `
    <tr>
      <td><strong>${esc(p.name)}</strong></td>
      <td><span class="badge badge-info">${esc(p.type)}</span></td>
      <td style="font-size:.78rem;">${(p.tags||[]).map(t=>`<span class="badge badge-default" style="margin:1px;">${esc(t)}</span>`).join('')}</td>
      <td>${statusBadge(p.status)}</td>
      <td style="font-size:.78rem;color:var(--clr-text-muted);">${formatDate(p.created_at)}</td>
      <td class="actions-cell">
        ${p.url?`<a href="${p.url}" target="_blank" class="btn btn-ghost btn-sm btn-icon" title="Live"><i class="fa fa-external-link"></i></a>`:''}
        <button class="btn btn-secondary btn-sm btn-icon" onclick="editProject(${i})"><i class="fa fa-pencil"></i></button>
        <button class="btn btn-danger btn-sm btn-icon" onclick="deleteProject(${i})"><i class="fa fa-trash"></i></button>
      </td>
    </tr>`).join('');
}

function openProjectForm() { editIndex=null; openModal('projectPopup'); }
function editProject(i) {
  const p = projectList[i];
  $('projectName').value=p.name; $('projectType').value=p.type; $('projectDesc').value=p.description;
  $('projectTags').value=(p.tags||[]).join(', '); $('projectUrl').value=p.url||''; $('projectStatus').value=p.status;
  editIndex=i; openModal('projectPopup');
}

async function saveProject() {
  const body = {
    name:$('projectName').value.trim(), type:$('projectType').value, description:$('projectDesc').value.trim(),
    tags:$('projectTags').value.split(',').map(t=>t.trim()).filter(Boolean), url:$('projectUrl').value.trim(), status:$('projectStatus').value
  };
  if (!body.name||!body.description) { toast('Name and description required','error'); return; }
  showLoader('Saving project…');
  try {
    const isEdit = editIndex!==null;
    const url    = isEdit ? `${DOMAIN}projects/${projectList[editIndex].id}` : `${DOMAIN}projects`;
    const res    = await fetch(url, { method:isEdit?'PUT':'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
    if (res.ok) { toast(isEdit?'Project updated!':'Project added!'); closeModal('projectPopup'); fetchProjects(); }
    else toast('Save failed','error');
  } finally { hideLoader(); editIndex=null; }
}

async function deleteProject(i) {
  if (!confirm_action('Delete this project?')) return;
  showLoader('Deleting…');
  try {
    await fetch(`${DOMAIN}projects/${projectList[i].id}`, {method:'DELETE'});
    toast('Deleted'); projectList.splice(i,1); populateProjects();
  } finally { hideLoader(); }
}

// ── Homepage CMS ──────────────────────────────────────────
async function loadHomepageSettings() {
  showLoader('Loading settings…');
  try {
    const res  = await fetch(`${DOMAIN}site-settings/homepage`);
    const data = await res.json();
    Object.entries(data).forEach(([key, val]) => {
      const el = document.getElementById(`cms-${key}`);
      if (el) el.value = val;
    });
  } finally { hideLoader(); }
}

async function saveHomepageSettings() {
  showLoader('Saving settings…');
  const keys = [
    'hero_eyebrow','hero_headline','hero_subheadline',
    'hero_cta_primary','hero_cta_secondary',
    'stat_clients','stat_roi',
    'result_1','result_1_label','result_2','result_2_label',
    'result_3','result_3_label','result_4','result_4_label',
    'video_headline','video_subheadline',
  ];
  const body = {};
  keys.forEach(k => {
    const el = document.getElementById(`cms-${k}`);
    if (el) body[k] = el.value;
  });
  try {
    const res = await fetch(`${DOMAIN}site-settings/homepage`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
    if (res.ok) toast('Homepage settings saved!');
    else toast('Save failed','error');
  } finally { hideLoader(); }
}

// ── Testimonials ──────────────────────────────────────────
let testimonialsData = [];
let editTestimonialIndex = null;

async function fetchTestimonials() {
  showLoader('Fetching testimonials…');
  try {
    const res      = await fetch(`${DOMAIN}testimonials`);
    testimonialsData = res.ok ? await res.json() : [];
    populateTestimonials();
  } finally { hideLoader(); }
}

function populateTestimonials() {
  const tbody = document.getElementById('testimonialsList');
  if (!tbody) return;
  if (!testimonialsData.length) { tbody.innerHTML = emptyRow(7,'No testimonials yet'); return; }
  tbody.innerHTML = testimonialsData.map((t,i) => `
    <tr>
      <td>
        ${t.photo ? `<div style="width:40px;height:40px;border-radius:50%;background:url(${t.photo}) center/cover;border:2px solid var(--clr-primary);"></div>` : '—'}
      </td>
      <td><strong>${esc(t.name)}</strong></td>
      <td>${esc(t.company||'—')}</td>
      <td>${'★'.repeat(t.stars||5)}</td>
      <td>${statusBadge(t.status)}</td>
      <td>${t.display_order||0}</td>
      <td class="actions-cell">
        <button class="btn btn-secondary btn-sm btn-icon" onclick="editTestimonial(${i})"><i class="fa fa-pencil"></i></button>
        <button class="btn btn-danger btn-sm btn-icon" onclick="deleteTestimonial(${i})"><i class="fa fa-trash"></i></button>
      </td>
    </tr>`).join('');
}

function openTestimonialForm(i = null) {
  document.getElementById('testimonialModalTitle').textContent = i === null ? 'Add Testimonial' : 'Edit Testimonial';
  if (i !== null) {
    const t = testimonialsData[i];
    setValue('tName', t.name); setValue('tCompany', t.company||''); setValue('tText', t.text);
    document.getElementById('tStars').value  = t.stars||5;
    document.getElementById('tStatus').value = t.status||'ACTIVE';
    setValue('tOrder', t.display_order||0);
  } else {
    ['tName','tCompany','tText','tOrder'].forEach(id => setValue(id,''));
  }
  editTestimonialIndex = i;
  openModal('testimonialPopup');
}

function editTestimonial(i) { openTestimonialForm(i); }

async function saveTestimonial() {
  const name = getValue('tName'), text = getValue('tText');
  if (!name || !text) { toast('Name and text are required','error'); return; }

  const form = new FormData();
  form.append('name', name);
  form.append('company', getValue('tCompany'));
  form.append('text', text);
  form.append('stars', document.getElementById('tStars').value);
  form.append('status', document.getElementById('tStatus').value);
  form.append('display_order', getValue('tOrder')||0);
  const photo = document.getElementById('tPhoto')?.files[0];
  if (photo) form.append('photo', photo);

  showLoader('Saving…');
  try {
    const isEdit = editTestimonialIndex !== null;
    const url    = isEdit ? `${DOMAIN}testimonials/${testimonialsData[editTestimonialIndex].id}` : `${DOMAIN}testimonials`;
    const method = isEdit ? 'PUT' : 'POST';
    // For PUT, send JSON (no file); POST can use FormData
    let res;
    if (isEdit) {
      const body = { name, company:getValue('tCompany'), text, stars:parseInt(document.getElementById('tStars').value), status:document.getElementById('tStatus').value, display_order:parseInt(getValue('tOrder')||0) };
      res = await fetch(url, { method, headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
    } else {
      res = await fetch(url, { method, body: form });
    }
    if (res.ok) { toast('Testimonial saved!'); closeModal('testimonialPopup'); fetchTestimonials(); }
    else toast('Save failed','error');
  } finally { hideLoader(); editTestimonialIndex=null; }
}

async function deleteTestimonial(i) {
  if (!confirm('Delete this testimonial?')) return;
  showLoader('Deleting…');
  try {
    await fetch(`${DOMAIN}testimonials/${testimonialsData[i].id}`, {method:'DELETE'});
    toast('Deleted'); testimonialsData.splice(i,1); populateTestimonials();
  } finally { hideLoader(); }
}

// ── Helper Renderers ──────────────────────────────────────────
const esc = v => (v||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const truncate = (s,n) => s && s.length>n ? s.slice(0,n)+'…' : (s||'—');
const formatDate = d => d ? new Date(d).toLocaleDateString('en-KE',{day:'numeric',month:'short',year:'numeric'}) : '—';
const emptyRow = (cols,msg) => `<tr><td colspan="${cols}" style="text-align:center;padding:var(--space-8);color:var(--clr-text-muted);">${msg}</td></tr>`;

const statusBadge = s => {
  const map = { ACTIVE:'badge-success', INACTIVE:'badge-warning', PUBLISHED:'badge-success', DRAFT:'badge-warning' };
  return `<span class="badge ${map[s]||'badge-default'}">${esc(s||'—')}</span>`;
};
const roleBadge = r => {
  const map = { SUPER_ADMIN:'badge-error', ADMIN:'badge-warning', EDITOR:'badge-info', GEN_USER:'badge-default' };
  return `<span class="badge ${map[r]||'badge-default'}">${esc(r||'—')}</span>`;
};
const subBadge = s => {
  return s==='SUBSCRIBED' ? `<span class="badge badge-success">Subscribed</span>` : `<span class="badge badge-default">Unsubscribed</span>`;
};
const apptStatusBadge = s => {
  const map = { RESOLVED:'badge-success', REVIEWING:'badge-info', INTERVIEW:'badge-success', HIRED:'badge-success',DONE:'badge-success', SHORTLISTED:'badge-info', UPCOMING:'badge-info', PENDING:'badge-warning', CANCELLED:'badge-error', REJECTED:'badge-error' };
  return `<span class="badge ${map[s]||'badge-default'}">${esc(s||'—')}</span>`;
};

const blogStatusBadge = s => {
  return s==='PUBLISHED' ? `<span class="badge badge-success">Published</span>` : `<span class="badge badge-warning">Draft</span>`;
};
const getValue = id => document.getElementById(id)?.value?.trim() || '';
const setValue = (id,v) => { const el=document.getElementById(id); if(el) el.value=v; };
const safeGet = id => document.getElementById(id)?.value?.trim() || '';
const safeVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
const safeSet = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
const truncateStr = (s, n) => s && s.length > n ? s.slice(0, n) + '…' : (s || '');
const formatBytes = b => b < 1024 ? b+'B' : b < 1048576 ? (b/1024).toFixed(1)+'KB' : (b/1048576).toFixed(1)+'MB';