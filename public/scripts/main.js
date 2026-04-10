/**
 * AdConnect — main.js
 * Handles all frontend dynamic behaviour for index.html and public pages.
 */
'use strict';

/* ── Config ─────────────────────────────────── */
//const DOMAIN = 'https://adconnect.co.ke/api/';
 const DOMAIN = 'http://127.0.0.1:3000/api/';

/* ── State ───────────────────────────────────── */
const AppState = {
  isSubmitting: false,
  clickSource:  '',
  currentStep:  0,
  selectedTime: '',
  bookedTimes:  [],
  carouselIdx:  0,
  testimonials: [],
  user: { firstName:'', lastName:'', email:'', phone:'', occupation:'', reason:'', goal:'', investment:'' },
  appointment: { clientName:'', clientEmail:'', clientPhone:'', clientMessage:'', meetingDate:'', meetingTime:'', meetingLocation:'', meetingLink:'' },
};

/* ── App Steps ───────────────────────────────── */
const STEPS = ['stepFName','stepLName','stepEmail','stepPhone','stepOccupation','stepReason','stepGoal','stepInvestment'];
const STEP_FIELDS = ['firstNameInput','lastNameInput','emailAddressInput','phoneInput','occupationInput','reasonInput','goalInput','investmentInput'];

/* ── Patterns ────────────────────────────────── */
const RE = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^(?:\+254|0)(7|1)\d{8}$/,
  twoWords: /^\S+\s+\S+/,
};

/* ── Time Slots ──────────────────────────────── */
const TIME_SLOTS = [
  { id:'eit',     time:'08.30 AM - 09.00 AM' },
  { id:'nine',    time:'09.15 AM - 09.45 AM' },
  { id:'ten',     time:'10.15 AM - 10.45 AM' },
  { id:'eleven',  time:'11.00 AM - 11.30 AM' },
  { id:'twelve',  time:'11.45 AM - 12.15 PM' },
  { id:'noon',    time:'12.30 PM - 01.00 PM' },
  { id:'one',     time:'01.30 PM - 02.00 PM' },
  { id:'two',     time:'02.15 PM - 02.45 PM' },
  { id:'three',   time:'03.00 PM - 03.30 PM' },
  { id:'four',    time:'03.45 PM - 04.15 PM' },
  { id:'four30',  time:'04.30 PM - 05.00 PM' },
  { id:'five',    time:'05.15 PM - 05.45 PM' },
  { id:'six',     time:'06.00 PM - 06.30 PM' },
  { id:'six45',   time:'06.45 PM - 07.15 PM' },
  { id:'seven',   time:'07.30 PM - 08.00 PM' },
  { id:'eightPm', time:'08.15 PM - 08.45 PM' },
  { id:'ninePm',  time:'09.00 PM - 09.30 PM' },
  { id:'tenPm',   time:'09.45 PM - 10.15 PM' },
];

/* ── Static testimonials (fallback) ─────────── */
const STATIC_TESTIMONIALS = [
  { name:'Irene Nyokabi', company:'Elixir Salon & Spa', photo:'/resources/elixir.png', stars:5, text:'"AdConnect has been instrumental in helping us reach our target audience and generate high-quality leads. Their team is professional, responsive, and always delivers on time. Our bookings increased by 180% within the first 3 months!"' },
  { name:'Eng. James', company:'Ricosam Engineering', photo:'/resources/ricosam.PNG', stars:5, text:'"Our project involved integrating multiple third-party APIs, which was tricky. AdConnect handled it flawlessly and also optimised the process to ensure fast load times. Their technical expertise is truly impressive."' },
  { name:'John Kamau', company:'Songa Real Estate', photo:'/resources/pic-back.png', stars:4, text:'"Our company required a custom web application to streamline internal operations, and AdConnect delivered beyond expectations. Their developers were thorough, responsive, and the application is intuitive and scalable."' },
  { name:'Dr. Sam Smith', company:'Smith Properties', photo:'/resources/pic-back.png', stars:4, text:'"Their digital marketing campaigns transformed my real estate business. From Google Ads to social media, their strategies brought measurable results. My business saw a 200% increase in qualified leads within 6 months."' },
  { name:'Ladybird', company:'Nuloft Salon & Spa', photo:'/resources/pic-back.png', stars:5, text:'"What I love most about AdConnect is their reliability. They don\'t just finish a project and disappear — they provide ongoing support and guidance long after going live. Maintenance and updates have kept my site flawless."' },
  { name:'Michael Maina', company:'Oriss Company', photo:'/resources/pic-back.png', stars:5, text:'"I was skeptical about SEO at first, but AdConnect changed my perspective. Within four months, my website ranked on the first page of Google for several key search terms, directly translating into more inquiries and sales."' },
];

/* ═══════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async () => {
  // Year
  const yearEl = document.getElementById('current-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Source tracking
  AppState.clickSource = getSource();

  // Wire nav
  wireNav();

  // URL param routing
  handleUrlParams();

  // Dynamic content
  await Promise.allSettled([
    loadHeroContent(),
    loadTestimonials(),
    loadVideoContent(),
  ]);

  // Render testimonials carousel
  renderTestimonialsCarousel(AppState.testimonials.length ? AppState.testimonials : STATIC_TESTIMONIALS);

  // Render time grid in appointment
  renderTimeGrid();

  // Animate result counters
  animateCounters();

  // Scroll-triggered reveal
  setupScrollReveal();

  // Initialize appointment form date
  initAppointmentDate();

  // Wire footer FAQ btn
  const faqBtn = document.getElementById('showFAQsSection');
  if (faqBtn) faqBtn.addEventListener('click', openFAQs);

  const footerConsult = document.getElementById('footerConsultationBtn');
  if (footerConsult) footerConsult.addEventListener('click', () => openUrl('?lead-capture-form=true'));
});

/* ── URL Params ──────────────────────────────── */
function handleUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const map = {
    'faqs=true':                openFAQs,
    'value-video-request=true': openValueVideo,
    'lead-capture-form=true':   openLeadCaptureSection,
    'value-video-opt-in=true':  openThankYouPage,
    'appointment-booking=true': openAppointmentBooking,
    'thank-you-for-booking=true': openAppointmentBookingThankYouPage,
    'privacy-policy=true':      openPrivacyPolicy,
    'application-form=true':    openApplicationForm,
  };
  for (const [key, fn] of Object.entries(map)) {
    const [k, v] = key.split('=');
    if (params.get(k) === v) { fn(); break; }
  }
}

function getSource() {
  let src = new URLSearchParams(window.location.search).get('utm_source');
  if (!src) src = document.referrer ? (new URL(document.referrer).hostname) : 'Direct';
  return src;
}

/* ── Navigation ──────────────────────────────── */
function wireNav() {
  document.getElementById('navbarTogler')?.addEventListener('click', openNav);
  document.getElementById('sidePanelCloseBtn')?.addEventListener('click', closeNav);

  document.querySelectorAll('.collapse-btn').forEach(item => {
    item.querySelector('.dropdown-trigger')?.addEventListener('click', e => {
      e.preventDefault();
      item.querySelector('.collapse')?.classList.toggle('show');
    });
  });

  // Close sidebar on outside click
  document.addEventListener('click', e => {
    const panel = document.getElementById('mySidePanel');
    if (panel && !panel.contains(e.target) && !document.getElementById('navbarTogler')?.contains(e.target)) {
      panel.style.left = '-320px';
    }
  });
}

function openNav()  { document.getElementById('mySidePanel').style.left = '0'; }
function closeNav() { document.getElementById('mySidePanel').style.left = '-320px'; }
function openSearch()  { const s = document.getElementById('searchbar'); s.style.height='100vh'; s.querySelector('input')?.focus(); }
function closeSearch() { document.getElementById('searchbar').style.height = '0'; }

/* ── Dynamic Content Loaders ─────────────────── */
async function loadHeroContent() {
  try {
    const res  = await fetch(`${DOMAIN}site-settings/homepage`);
    if (!res.ok) return;
    const data = await res.json();

    if (data.hero_headline)     setText('hero-headline', data.hero_headline, true);
    if (data.hero_subheadline)  setText('hero-subheadline', data.hero_subheadline);
    if (data.hero_eyebrow)      setText('hero-eyebrow-text', data.hero_eyebrow);
    if (data.hero_cta_primary)  setText('hero-cta-primary', data.hero_cta_primary);
    if (data.hero_cta_secondary)setText('hero-cta-secondary', data.hero_cta_secondary);
    if (data.stat_clients)      setText('stat-clients', data.stat_clients);
    if (data.stat_roi)          setText('stat-roi', data.stat_roi);
    if (data.result_1)          setText('res1', data.result_1);
    if (data.result_2)          setText('res2', data.result_2);
    if (data.result_3)          setText('res3', data.result_3);
    if (data.result_4)          setText('res4', data.result_4);
  } catch (e) { /* silently use defaults */ }
}

async function loadVideoContent() {
  try {
    const res = await fetch(`${DOMAIN}video-data-active`);
    if (!res.ok) return;
    const data = await res.json();
    if (data.length > 0) {
      const v = data[0];
      const videoEl = document.getElementById('valueVideoView');
      if (videoEl && v.video) videoEl.src = v.video;
    }
  } catch (e) { /* use defaults */ }
}

async function loadTestimonials() {
  try {
    const res = await fetch(`${DOMAIN}testimonials`);
    if (!res.ok) return;
    const data = await res.json();
    if (data.length > 0) AppState.testimonials = data;
  } catch (e) { /* use static */ }
}

/* ── Testimonials Carousel ───────────────────── */
let carouselInterval = null;

function renderTestimonialsCarousel(list) {
  const track = document.getElementById('testimonialsTrack');
  const dots   = document.getElementById('carouselDots');
  if (!track || !list.length) return;

  AppState.testimonials = list;

  track.innerHTML = list.map(t => `
    <div class="tcard">
      <div class="stars">${'<i class="fa fa-star"></i>'.repeat(t.stars||5)}</div>
      <p class="quote">${esc(t.text)}</p>
      <div class="author">
        <div class="author-photo" style="background-image:url('${t.photo||'/resources/pic-back.png'}')"></div>
        <div>
          <div class="author-name">${esc(t.name)}</div>
          <div class="author-role">${esc(t.company)}</div>
        </div>
      </div>
    </div>`).join('');

  if (dots) {
    dots.innerHTML = list.map((_,i) =>
      `<div class="carousel-dot ${i===0?'active':''}" onclick="goToTestimonial(${i})"></div>`
    ).join('');
  }

  AppState.carouselIdx = 0;
  updateCarouselPosition();

  // Auto-advance
  clearInterval(carouselInterval);
  carouselInterval = setInterval(nextTestimonial, 6000);
}

function updateCarouselPosition() {
  const track = document.getElementById('testimonialsTrack');
  if (!track) return;
  const cards = track.querySelectorAll('.tcard');
  if (!cards.length) return;
  const slideW = cards[0].offsetWidth + 24;
  const maxIdx = Math.max(0, cards.length - 2);
  const idx    = Math.min(AppState.carouselIdx, maxIdx);
  track.style.transform = `translateX(-${idx * slideW}px)`;

  // Update dots
  document.querySelectorAll('.carousel-dot').forEach((d,i) => d.classList.toggle('active', i===AppState.carouselIdx));
}

function nextTestimonial() {
  const max = AppState.testimonials.length - 1;
  AppState.carouselIdx = AppState.carouselIdx >= max ? 0 : AppState.carouselIdx + 1;
  updateCarouselPosition();
  clearInterval(carouselInterval);
  carouselInterval = setInterval(nextTestimonial, 6000);
}

function prevTestimonial() {
  const max = AppState.testimonials.length - 1;
  AppState.carouselIdx = AppState.carouselIdx <= 0 ? max : AppState.carouselIdx - 1;
  updateCarouselPosition();
  clearInterval(carouselInterval);
  carouselInterval = setInterval(nextTestimonial, 6000);
}

function goToTestimonial(i) { AppState.carouselIdx = i; updateCarouselPosition(); }

window.addEventListener('resize', updateCarouselPosition);

/* ── Scroll Reveal ───────────────────────────── */
function setupScrollReveal() {
  if (!('IntersectionObserver' in window)) return;
  const revealEls = document.querySelectorAll('.step-card, .service-card, .result-card, .tcard');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.animation = 'fade-up .5s ease both';
        obs.unobserve(e.target);
      }
    });
  }, { threshold: .12 });
  revealEls.forEach(el => obs.observe(el));
}

/* ── Counter Animation ───────────────────────── */
function animateCounters() {
  const counterEls = document.querySelectorAll('.result-num, .snum');
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el  = e.target;
      const raw = el.textContent.replace(/[^0-9.]/g,'');
      const num = parseFloat(raw);
      if (isNaN(num)) return;
      const suffix = el.textContent.replace(raw,'');
      let start = 0, duration = 1600;
      const step = () => {
        start += duration / 60;
        const pct = Math.min(start/duration, 1);
        const cur = Math.round(num * easeOut(pct) * 10) / 10;
        el.textContent = (Number.isInteger(cur) ? cur : cur.toFixed(1)) + suffix;
        if (pct < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      obs.unobserve(el);
    });
  }, { threshold: .5 });
  counterEls.forEach(el => obs.observe(el));
}
const easeOut = t => 1 - Math.pow(1-t, 3);

/* ── Time Grid Render ────────────────────────── */
function renderTimeGrid() {
  const grid = document.getElementById('timeGrid');
  if (!grid) return;
  grid.innerHTML = TIME_SLOTS.map(s => `
    <div class="time-chip" data-id="${s.id}" data-time="${s.time}" onclick="selectTimeSlot(this,'${s.time}')">
      ${s.time.replace(' - ','<br />')}
    </div>`).join('');
}

function selectTimeSlot(el, time) {
  if (el.classList.contains('booked')) return;
  document.querySelectorAll('.time-chip').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  AppState.selectedTime = time;
  AppState.appointment.meetingTime = time;
}

/* ── Section Toggles ─────────────────────────── */
const baseUrl = window.location.origin + window.location.pathname;
const pushUrl = param => window.history.pushState({}, '', param ? `${baseUrl}?${param}` : baseUrl);

function openValueVideo()          { document.getElementById('valueVideoSection')?.scrollIntoView({behavior:'smooth'}); pushUrl('value-video-request=true'); }
function openLeadCaptureSection()  { setH('leadCaptureSection','100%'); pushUrl('lead-capture-form=true'); }
function closeLeadCapture()        { setH('leadCaptureSection','0%'); pushUrl(''); }
function openThankYouPage()        { const el=document.getElementById('thankYouVideoSection'); if(el){el.style.display='flex'; loadVideoContent(); pushUrl('value-video-opt-in=true');} }
function closeThankYouPage()       { setD('thankYouVideoSection','none'); pushUrl(''); }
function openApplicationForm()     { const el=document.getElementById('applicationFormSection'); if(el){el.style.display='flex'; el.classList.add('open'); pushUrl('application-form=true');} initAppForm(); }
function closeApplicationForm()    { const el=document.getElementById('applicationFormSection'); if(el){el.classList.remove('open'); setTimeout(()=>el.style.display='none',550);} pushUrl(''); }
async function openAppointmentBooking() { setH('appointmentView','100%'); pushUrl('appointment-booking=true'); initAppointmentDate(); }
function closeAppointmentView()    { setH('appointmentView','0%'); pushUrl(''); }
function openAppointmentBookingThankYouPage() { setH('appointmentThanksView','100%'); pushUrl('thank-you-for-booking=true'); }
function closeAppointmentThanksView() { setH('appointmentThanksView','0%'); pushUrl(''); }
function openFAQs()                { setH('faqsSection','100%'); pushUrl('faqs=true'); }
function closeFAQs()               { setH('faqsSection','0%'); pushUrl(''); }
function openPrivacyPolicy()       { setH('privacyPolicy','100%'); pushUrl('privacy-policy=true'); }
function closePrivacyPolicy()      { setH('privacyPolicy','0%'); pushUrl(''); }
function openUrl(param)            { openLeadCaptureSection(); }

const setH = (id, h)  => { const el=document.getElementById(id); if(el) el.style.height=h; };
const setD = (id, d)  => { const el=document.getElementById(id); if(el) el.style.display=d; };
const setText = (id, txt, html=false) => { const el=document.getElementById(id); if(el){ if(html) el.innerHTML=txt; else el.textContent=txt; } };

/* ── Lead Capture Form ───────────────────────── */
async function submitLeads(e) {
  if (e) e.preventDefault();
  if (AppState.isSubmitting) return;

  const errEl = document.getElementById('leadErrorMessage');
  const name  = document.getElementById('name')?.value.trim();
  const email = document.getElementById('email')?.value.trim();
  const phone = document.getElementById('phone')?.value.trim();

  if (!name)                     { showErr('Full name is required', errEl); return; }
  if (!RE.twoWords.test(name))   { showErr('Please enter your full name', errEl); return; }
  if (!email || !RE.email.test(email)) { showErr('Please enter a valid email address', errEl); return; }
  if (!phone || !RE.phone.test(phone)) { showErr('Please enter a valid Kenyan phone number (e.g. 0712345678)', errEl); return; }

  AppState.isSubmitting = true;
  const btn = document.getElementById('btnSubmitLeadCapture');
  if (btn) { btn.disabled=true; btn.innerHTML='<i class="fa fa-spinner fa-spin"></i> Processing…'; }

  try {
    // Check duplicate
    const existRes  = await fetch(`${DOMAIN}lead-exists`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ clientEmail:email, clientPhone:phone }) });
    const existData = await existRes.json();

    if (existData.exists) {
      showSuccess('Welcome back! Redirecting to your video…', errEl);
      setTimeout(openThankYouPage, 1500);
      closeLeadCapture();
      return;
    }

    // Create lead
    const company  = document.getElementById('company')?.value.trim()  || 'N/A';
    const street   = document.getElementById('address')?.value.trim()  || 'N/A';
    const city     = document.getElementById('city')?.value.trim()     || 'N/A';
    const province = document.getElementById('state')?.value.trim()    || 'N/A';
    const zip      = document.getElementById('zipCode')?.value.trim()  || 'N/A';

    const leadRes  = await fetch(`${DOMAIN}clients`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ clientName:name.toUpperCase(), clientEmail:email, clientPhone:phone, clientCompany:company, clientStreet:street, clientLocation:city, clientProvince:province, clientZipCode:zip, clientSource:AppState.clickSource, clientStatus:'1ST CONTACT', clientSubScription:'SUBSCRIBED' }),
    });

    if (leadRes.ok) {
      // Send welcome email (fire-and-forget)
      fetch(`${DOMAIN}send-welcome-email`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ clientName:name, clientEmail:email }) }).catch(()=>{});

      // Pre-fill application form
      const nameParts = name.split(' ');
      setValue('firstNameInput',  nameParts[0]);
      setValue('lastNameInput',   nameParts.slice(1).join(' '));
      setValue('emailAddressInput', email);
      setValue('phoneInput',      phone);
      AppState.user.firstName = nameParts[0];
      AppState.user.email     = email;
      AppState.user.phone     = phone;

      closeLeadCapture();
      setTimeout(openThankYouPage, 400);
    } else {
      const d = await leadRes.json();
      showErr(d.error || 'Something went wrong. Please try again.', errEl);
    }
  } catch (err) {
    showErr('Network error. Please check your connection and try again.', errEl);
    console.error(err);
  } finally {
    AppState.isSubmitting = false;
    if (btn) { btn.disabled=false; btn.innerHTML='<i class="fa fa-play-circle"></i> Watch the Free Video'; }
  }
}

/* ── Multi-Step Application Form ─────────────── */
function initAppForm() {
  AppState.currentStep = 0;
  STEPS.forEach((id, i) => {
    const el = document.getElementById(id);
    if (el) el.style.display = i === 0 ? 'block' : 'none';
  });
  updateStepProgress();
  updateNavButtons();
}

async function goToNextStep(e) {
  if (e) e.preventDefault();
  const errEl  = document.getElementById('formErrorMessage');
  const input  = document.getElementById(STEP_FIELDS[AppState.currentStep]);
  const val    = input?.value.trim();

  // Validate current step
  const err = validateStep(AppState.currentStep, val);
  if (err) { showErr(err, errEl); input?.focus(); return; }

  // Store value
  storeStepValue(AppState.currentStep, val);

  // Update labels
  updateDynamicLabels();

  // Last step → submit
  if (AppState.currentStep === STEPS.length - 1) {
    await submitApplication();
    return;
  }

  // Advance
  document.getElementById(STEPS[AppState.currentStep]).style.display = 'none';
  AppState.currentStep++;
  document.getElementById(STEPS[AppState.currentStep]).style.display = 'block';
  document.getElementById(STEP_FIELDS[AppState.currentStep])?.focus();
  updateStepProgress();
  updateNavButtons();
}

function goToPreviousStep(e) {
  if (e) e.preventDefault();
  if (AppState.currentStep <= 0) return;
  document.getElementById(STEPS[AppState.currentStep]).style.display = 'none';
  AppState.currentStep--;
  document.getElementById(STEPS[AppState.currentStep]).style.display = 'block';
  updateStepProgress();
  updateNavButtons();
}

function validateStep(step, val) {
  if (!val) return 'This field is required — please fill it in to continue.';
  if (step === 0 && val.length < 2) return 'Please enter a valid first name.';
  if (step === 1 && val.length < 2) return 'Please enter a valid last name.';
  if (step === 2 && !RE.email.test(val)) return 'Please enter a valid email address.';
  if (step === 3 && !RE.phone.test(val)) return 'Please enter a valid phone number (e.g. 0712345678).';
  if (step === 4 && val.length < 4) return 'Please describe your occupation.';
  if (step === 5 && val.length < 10) return 'Please provide more detail about your current situation.';
  if (step === 6 && val.length < 10) return 'Please describe your marketing goal in more detail.';
  return null;
}

function storeStepValue(step, val) {
  const keys = ['firstName','lastName','email','phone','occupation','reason','goal','investment'];
  AppState.user[keys[step]] = val;
}

function updateDynamicLabels() {
  const fname = AppState.user.firstName;
  if (!fname) return;
  const cap = fname.charAt(0).toUpperCase() + fname.slice(1).toLowerCase();
  setText('lnameQ',   `And your last name, ${cap}?`);
  setText('emailQ',   `What's your email, ${cap}?`);
  setText('phoneQ',   `Your phone number, ${cap}?`);
}

function updateStepProgress() {
  document.querySelectorAll('#stepProgress .step-dot').forEach((dot, i) => {
    dot.classList.remove('active','done');
    if (i < AppState.currentStep)  dot.classList.add('done');
    if (i === AppState.currentStep) dot.classList.add('active');
  });
}

function updateNavButtons() {
  const prev = document.getElementById('btnLeftApplication');
  const next = document.getElementById('btnRightApplication');
  if (prev) prev.disabled = AppState.currentStep === 0;
  if (next) {
    const isLast = AppState.currentStep === STEPS.length - 1;
    next.innerHTML = isLast ? '<i class="fa fa-paper-plane"></i> Send & Book Now' : 'Next <i class="fa fa-arrow-right"></i>';
  }
}

async function submitApplication() {
  const errEl = document.getElementById('formErrorMessage');
  const u = AppState.user;
  const btn = document.getElementById('btnRightApplication');
  if (btn) { btn.disabled=true; btn.innerHTML='<i class="fa fa-spinner fa-spin"></i> Submitting…'; }

  try {
    const res = await fetch(`${DOMAIN}marketing-strategy-applications`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ applicantFName:u.firstName, applicantLName:u.lastName, email:u.email, phone:u.phone, occupation:u.occupation, marketTriggers:u.reason, strategyGoal:u.goal, strategyInvestment:u.investment, status:'PENDING' }),
    });

    if (res.ok) {
      closeApplicationForm();
      setTimeout(() => openAppointmentBooking(), 400);
    } else {
      const d = await res.json();
      showErr(d.error || 'Submission failed. Please try again.', errEl);
    }
  } catch (err) {
    showErr('Network error. Please check your connection.', errEl);
  } finally {
    if (btn) { btn.disabled=false; updateNavButtons(); }
  }
}

/* ── Appointment Form ────────────────────────── */
function initAppointmentDate() {
  const dateEl = document.getElementById('appointeeDate');
  if (!dateEl) return;
  const today = new Date().toISOString().slice(0,10);
  dateEl.value = today;
  dateEl.min   = today;

  // Pre-fill from application
  setValue('appointeeName',  `${AppState.user.firstName} ${AppState.user.lastName}`.trim());
  setValue('appointeeEmail', AppState.user.email);
  setValue('appointeePhone', AppState.user.phone);

  dateEl.addEventListener('change', async () => {
    const d   = new Date(dateEl.value);
    const day = d.getDay();

    if (day === 0) {
      showApptErr('Sundays are unavailable. Please select another date.');
      dateEl.value = '';
      return;
    }

    // Kenya public holidays (simplified)
    const holidays = ['01-01','05-01','06-01','10-20','12-12','12-25','12-26'];
    const md = dateEl.value.slice(5);
    if (holidays.includes(md)) {
      showApptErr('This date is a public holiday. Please choose another date.');
      dateEl.value = '';
      return;
    }

    // Fetch booked slots
    resetTimeChips();
    const booked = await getBookedSlots(dateEl.value);
    AppState.bookedTimes = booked;
    markBookedChips(booked);
  });
}

function resetTimeChips() {
  document.querySelectorAll('.time-chip').forEach(c => {
    c.classList.remove('selected','booked');
    AppState.selectedTime = '';
  });
}

async function getBookedSlots(date) {
  try {
    const res = await fetch(`${DOMAIN}appointments-by-date/${date}`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.appointmentTime || []).map(x => x.appointmentTime);
  } catch { return []; }
}

function markBookedChips(booked) {
  document.querySelectorAll('.time-chip').forEach(c => {
    if (booked.includes(c.dataset.time)) {
      c.classList.add('booked');
      c.title = 'This time slot is taken';
    }
  });
}

function showApptErr(msg) {
  const el = document.getElementById('appointmentErrorMessage');
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
  setTimeout(() => el.style.display='none', 4000);
}

async function submitAppointment(e) {
  if (e) e.preventDefault();
  const errEl = document.getElementById('appointmentErrorMessage');

  const name    = getValue('appointeeName');
  const email   = getValue('appointeeEmail');
  const phone   = getValue('appointeePhone');
  const date    = getValue('appointeeDate');
  const msg     = getValue('appointeeMessage');
  const loc     = getValue('appointeeLocation') || 'Online';

  if (!name)                { showApptErr('Full name is required.'); return; }
  if (!RE.email.test(email)){ showApptErr('Please enter a valid email.'); return; }
  if (!RE.phone.test(phone)){ showApptErr('Please enter a valid phone number.'); return; }
  if (!date)                { showApptErr('Please select a date.'); return; }
  if (!AppState.selectedTime){ showApptErr('Please select a time slot.'); return; }
  if (!msg)                 { showApptErr('Please add a brief meeting note.'); return; }

  const btn = document.getElementById('btnSubmitAppointment');
  if (btn) { btn.disabled=true; btn.innerHTML='<i class="fa fa-spinner fa-spin"></i> Booking…'; }

  AppState.appointment = { clientName:name, clientEmail:email, clientPhone:phone, clientMessage:msg, meetingDate:date, meetingTime:AppState.selectedTime, meetingLocation:loc };

  try {
    // Get Google Meet link
    const { startTime24, endTime24 } = convertTimeRange(AppState.selectedTime);
    const meetLink = await getGoogleMeetLink('Adconnect Consultation', `${date} ${startTime24}`, `${date} ${endTime24}`);
    AppState.appointment.meetingLink = meetLink || '';

    // Save appointment
    const res = await fetch(`${DOMAIN}appointments`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ clientName:name, clientEmail:email, clientPhone:phone, appointmentNotes:msg, appointmentDate:date, appointmentTime:AppState.selectedTime, clientLocation:loc, meetingLink:meetLink||'', appointmentType:'Online Consultation', appointmentStatus:'PENDING' }),
    });

    if (res.ok) {
      // Emails (fire-and-forget)
      const formattedDate = formatDate(date);
      fetch(`${DOMAIN}send-booking-email`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ clientName:name, clientEmail:email, meetingDate:formattedDate, meetingTime:AppState.selectedTime, meetingLocation:loc, meetingAgenda:msg, meetingLink:meetLink||'' }) }).catch(()=>{});
      fetch(`${DOMAIN}send-booking-reaction-email`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ clientName:name, meetingDate:formattedDate, meetingTime:AppState.selectedTime, meetingLocation:loc, meetingAgenda:msg, meetingLink:meetLink||'' }) }).catch(()=>{});

      closeAppointmentView();
      setText('meetingType', 'Online Consultation');
      setText('meetingDate',  `${formattedDate}\n${AppState.selectedTime}`);
      setTimeout(openAppointmentBookingThankYouPage, 400);
    } else {
      const d = await res.json();
      showApptErr(d.error || 'Booking failed. Please try again.');
    }
  } catch (err) {
    showApptErr('Network error. Please check your connection.');
    console.error(err);
  } finally {
    if (btn) { btn.disabled=false; btn.innerHTML='<i class="fa fa-calendar-check-o"></i> Confirm Booking'; }
  }
}

/* ── Google Meet ─────────────────────────────── */
async function getGoogleMeetLink(title, start, end) {
  try {
    const res = await fetch(`${DOMAIN}create-meet-link`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ eventTitle:title, startDateTime:start, endDateTime:end }) });
    if (res.ok) { const d = await res.json(); return d.meetLink; }
  } catch { /* return null */ }
  return null;
}

function convertTimeRange(range) {
  const [startStr, endStr] = range.split(' - ');
  return { startTime24: to24(startStr), endTime24: to24(endStr) };
}

function to24(str) {
  const [time, period] = str.split(' ');
  let [h, m] = time.split('.').map(Number);
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:00`;
}

/* ── FAQ Form ────────────────────────────────── */
function openFAQsForm() {
  // Already inline in the FAQ modal
}

async function submitFAQsForm() {
  const name     = getValue('faqName');
  const email    = getValue('faqEmail');
  const question = getValue('faqQuestion');
  if (!name || !email || !question) { alert('Please fill in all fields.'); return; }
  // In production: send to backend
  toast('Question sent! We\'ll get back to you within 24 hours.', 'success');
  setValue('faqName',''); setValue('faqEmail',''); setValue('faqQuestion','');
}

/* ── Newsletter ──────────────────────────────── */
async function subscribeNewsletter() {
  const email = getValue('newsletterEmail');
  if (!email || !RE.email.test(email)) { toast('Please enter a valid email.', 'error'); return; }
  toast('Subscribed! Thanks for joining our newsletter.', 'success');
  setValue('newsletterEmail','');
}

/* ── Date Formatting ─────────────────────────── */
function formatDate(dateStr) {
  const d = new Date(dateStr);
  const days   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}, ${d.getFullYear()}`;
}

/* ── Toast Notifications ─────────────────────── */
function toast(msg, type='success') {
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.innerHTML = `<i class="fa fa-${type==='success'?'check-circle':'exclamation-circle'}"></i> ${msg}`;
  document.body.appendChild(t);
  setTimeout(() => t.style.animation='slideInRight .3s ease reverse', 3000);
  setTimeout(() => t.remove(), 3400);
}

function showErr(msg, container) {
  if (!container) { toast(msg,'error'); return; }
  container.innerHTML = `<i class="fa fa-exclamation-triangle"></i> ${msg}`;
  container.style.display = 'block';
  setTimeout(() => container.style.display='none', 5000);
}

function showSuccess(msg, container) {
  if (!container) return;
  const origBg = container.style.background;
  container.style.background = 'rgba(74,188,79,.1)';
  container.style.borderColor = 'var(--clr-accent)';
  container.style.color       = 'var(--clr-accent)';
  container.innerHTML = `<i class="fa fa-check-circle"></i> ${msg}`;
  container.style.display = 'block';
  setTimeout(() => {
    container.style.display = 'none';
    container.style.background = origBg;
  }, 3000);
}

/* ── DOM Helpers ─────────────────────────────── */
const getValue = id => document.getElementById(id)?.value.trim() || '';
const setValue = (id, v) => { const el=document.getElementById(id); if(el) el.value=v; };
const esc = s => (s||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

/* ── Keyboard: close modals on Escape ────────── */
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  closeLeadCapture(); closeThankYouPage(); closeApplicationForm();
  closeAppointmentView(); closeFAQs(); closePrivacyPolicy();
  closeSearch(); closeNav();
});

/* ── Export globals (legacy inline onclick support) ── */
window.openNav = openNav;
window.closeNav = closeNav;
window.openSearch = openSearch;
window.closeSearch = closeSearch;
window.openValueVideo = openValueVideo;
window.openLeadCaptureSection = openLeadCaptureSection;
window.closeLeadCapture = closeLeadCapture;
window.openThankYouPage = openThankYouPage;
window.closeThankYouPage = closeThankYouPage;
window.openApplicationForm = openApplicationForm;
window.closeApplicationForm = closeApplicationForm;
window.openAppointmentBooking = openAppointmentBooking;
window.closeAppointmentView = closeAppointmentView;
window.openAppointmentBookingThankYouPage = openAppointmentBookingThankYouPage;
window.closeAppointmentThanksView = closeAppointmentThanksView;
window.openFAQs = openFAQs;
window.closeFAQs = closeFAQs;
window.openPrivacyPolicy = openPrivacyPolicy;
window.closePrivacyPolicy = closePrivacyPolicy;
window.submitLeads = submitLeads;
window.goToNextStep = goToNextStep;
window.goToPreviousStep = goToPreviousStep;
window.submitAppointment = submitAppointment;
window.submitFAQsForm = submitFAQsForm;
window.nextTestimonial = nextTestimonial;
window.prevTestimonial = prevTestimonial;
window.goToTestimonial = goToTestimonial;
window.subscribeNewsletter = subscribeNewsletter;
window.selectTimeSlot = selectTimeSlot;
