/**
 * AdConnect Admin Panel — admin.js
 * Role-based access: SUPER_ADMIN | ADMIN | EDITOR | GEN_USER
 */

'use strict';

// ── Config ────────────────────────────────────────────────────
const DOMAIN = 'https://adconnect.co.ke/api/';
// const DOMAIN = 'http://127.0.0.1:3000/api/';

// ── Role Permissions ──────────────────────────────────────────
const ROLE_PERMISSIONS = {
  SUPER_ADMIN: ['dashboard','analytics','content','blog','portfolio','leads','appointments','applications','users','settings','homepage','testimonials'],
  ADMIN:       ['dashboard','analytics','content','blog','portfolio','leads','appointments','applications','settings','homepage','testimonials'],
  EDITOR:      ['dashboard','content','blog','portfolio','homepage','testimonials'],
  GEN_USER:    ['dashboard'],
};

// ── State ─────────────────────────────────────────────────────
let session = { user: null, role: null };
let userList = [], leadList = [], appointmentList = [], aboutList = [],
    videoList = [], applicationList = [], blogList = [], projectList = [];
let currentPanel = 'dashboard';
let editIndex = null, aboutIndex = null, appointmentIndex = null;
let editFlags = { isTitle:false, isIntro:false, isMission:false, isExperience:false };
let charts = {};

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

function openModal(id) { $(id).style.height = '100%'; }
function closeModal(id) { $(id).style.height = '0%'; }

function closeAllModals() {
  ['userPopUp','appointmentPopup','aboutPopup','applicationPopup',
   'aboutRegisterPopup','videoRegisterPopup','blogPopup','projectPopup',
   'aboutPhotoPopup','aboutVideoPopup'].forEach(closeModal);
}

// legacy
function closePopup() { closeAllModals(); }

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
    navigate('dashboard');
    toast(`Welcome back, ${data.username}!`);
  } catch (err) {
    showErr('Network error — please try again', errEl);
  } finally { hideLoader(); }
}

function handleLogout() {
  if (!confirm_action('Sign out?')) return;
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
    users:        fetchUsers,
    settings:     () => {},
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

async function updateStatus(i) {
  aboutList[i].status = 'ACTIVE';
  showLoader('Activating profile…');
  try {
    const res = await fetch(`${DOMAIN}about-data-update-status/${aboutList[i].id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(aboutList[i]) });
    if (res.ok) { toast('Profile activated!'); await fetchAbout(); }
    else toast('Failed','error');
  } finally { hideLoader(); }
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
  const map = { DONE:'badge-success', UPCOMING:'badge-info', PENDING:'badge-warning', CANCELLED:'badge-error' };
  return `<span class="badge ${map[s]||'badge-default'}">${esc(s||'—')}</span>`;
};
const appStatusBadge = s => {
  return s==='RESOLVED' ? `<span class="badge badge-success">Resolved</span>` : `<span class="badge badge-warning">Pending</span>`;
};
const blogStatusBadge = s => {
  return s==='PUBLISHED' ? `<span class="badge badge-success">Published</span>` : `<span class="badge badge-warning">Draft</span>`;
};
const getValue = id => document.getElementById(id)?.value?.trim() || '';
const setValue = (id,v) => { const el=document.getElementById(id); if(el) el.value=v; };
