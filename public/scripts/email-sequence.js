/**
 * AdConnect — 20-Email Marketing Sequence
 * ==========================================
 * Topics rotate across:
 *  - Digital Marketing (6 emails)
 *  - Web Design & Development (5 emails)
 *  - Android Development (4 emails)
 *  - System Development (3 emails)
 *  - Mixed / Value (2 emails)
 *
 * Each email sent N days after subscription.
 * Variables replaced: ${clientName}, ${currentYear}, ${unsubscribeUrl}
 */

'use strict';

const EMAIL_SEQUENCE = [

  // ─────────────────────────────────────────────────────────
  // EMAIL 1 — Day 0 (immediate) — Digital Marketing
  // ─────────────────────────────────────────────────────────
  {
    day: 0,
    subject: '🎯 The #1 Mistake Real Estate Companies Make with Facebook Ads',
    category: 'digital-marketing',
    body: buildEmail({
      kicker:  'Digital Marketing Tip #1',
      title:   'Why Most Real Estate Facebook Ads Fail (And How to Fix Yours)',
      color:   '#F65730',
      content: `
        <p style="margin-bottom:16px;">Hi <strong style="color:#F65730;">\${clientName}</strong>,</p>
        <p style="margin-bottom:14px;">We see it every day — real estate companies spending thousands on Facebook ads with almost nothing to show for it.</p>
        <p style="margin-bottom:14px;"><strong>The #1 mistake?</strong> Targeting everyone.</p>
        <div style="background:#252320;border-left:3px solid #F65730;border-radius:0 8px 8px 0;padding:16px 20px;margin:20px 0;">
          <p style="font-weight:700;color:#f4f1ee;margin-bottom:8px;">The "Spray and Pray" Problem</p>
          <p style="color:#b8b4b0;font-size:13px;line-height:1.7;">When you target "everyone in Nairobi aged 25–55," you're competing with thousands of advertisers for attention from people who may never buy property. Your cost-per-lead skyrockets.</p>
        </div>
        <p style="margin-bottom:14px;"><strong>The Fix: Micro-Audiences</strong></p>
        <ul style="padding-left:20px;margin-bottom:16px;display:flex;flex-direction:column;gap:8px;">
          <li style="color:#b8b4b0;font-size:14px;"><strong style="color:#f4f1ee;">Lookalike Audiences</strong> — Upload your past buyer list; Facebook finds similar people</li>
          <li style="color:#b8b4b0;font-size:14px;"><strong style="color:#f4f1ee;">Behavioral Targeting</strong> — Target people who searched property listings last 30 days</li>
          <li style="color:#b8b4b0;font-size:14px;"><strong style="color:#f4f1ee;">Income Layering</strong> — Stack income + location + life event (newly married, new job) data</li>
        </ul>
        <p style="margin-bottom:0;">In our next email we'll show you the exact campaign structure that generated 340 leads in 30 days for one of our clients.</p>`,
      cta_text: 'Book a Free Strategy Call',
      cta_url:  'https://adconnect.co.ke/?lead-capture-form=true',
    }),
  },

  // ─────────────────────────────────────────────────────────
  // EMAIL 2 — Day 3 — Digital Marketing
  // ─────────────────────────────────────────────────────────
  {
    day: 3,
    subject: '📊 The Campaign Structure That Generated 340 Leads in 30 Days',
    category: 'digital-marketing',
    body: buildEmail({
      kicker:  'Digital Marketing Tip #2',
      title:   'The Exact Facebook Campaign Structure We Use for Real Estate',
      color:   '#F65730',
      content: `
        <p style="margin-bottom:16px;">Hi <strong style="color:#F65730;">\${clientName}</strong>,</p>
        <p style="margin-bottom:14px;">Last email we talked about targeting. Today: the campaign structure that drives volume.</p>
        <div style="background:#252320;border-radius:8px;padding:20px;margin:20px 0;">
          <p style="font-weight:700;color:#F65730;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin-bottom:14px;">The 3-Layer Funnel</p>
          ${funnelStep('1','AWARENESS','Video ads showing property walkthroughs, neighbourhood tours. Budget: 30%','#3498DB')}
          ${funnelStep('2','CONSIDERATION','Retarget video viewers with lead magnet (free property guide). Budget: 50%','#F65730')}
          ${funnelStep('3','CONVERSION','Retarget lead magnet engagers with direct call-to-action. Budget: 20%','#4ABC4F')}
        </div>
        <p style="margin-bottom:14px;">This is how one Nairobi developer went from KES 4,200 per lead to <strong style="color:#4ABC4F;">KES 820 per lead</strong> in 60 days.</p>
        <p style="margin-bottom:0;color:#7a7874;font-size:13px;">Coming up: why your landing page is losing you 70% of your leads — even when ads are working.</p>`,
      cta_text: 'See Our Client Results',
      cta_url:  'https://adconnect.co.ke/pages/portfolio.html',
    }),
  },

  // ─────────────────────────────────────────────────────────
  // EMAIL 3 — Day 7 — Web Design & Development
  // ─────────────────────────────────────────────────────────
  {
    day: 7,
    subject: '🌐 Your Website is Losing 70% of Leads (Here\'s Why)',
    category: 'web-development',
    body: buildEmail({
      kicker:  'Web Design Insight #1',
      title:   '5 Website Mistakes That Kill Real Estate Leads',
      color:   '#3498DB',
      content: `
        <p style="margin-bottom:16px;">Hi <strong style="color:#3498DB;">\${clientName}</strong>,</p>
        <p style="margin-bottom:14px;">You've nailed your ads. Traffic is flowing. But conversions are flat.</p>
        <p style="margin-bottom:18px;"><strong>70% of real estate website visitors leave within 8 seconds.</strong> Here's why:</p>
        ${numberedList([
          ['Loads in 6+ seconds', 'Every 1-second delay reduces conversions by 7%. Google PageSpeed is not optional anymore.'],
          ['No mobile optimization', '78% of property searches in Kenya happen on mobile. If it\'s not mobile-first, you\'re invisible.'],
          ['Buried contact form', 'If it takes more than 2 clicks to enquire, you\'ve already lost them.'],
          ['Stock photos', 'Visitors can tell. Original property photography converts 3x better than generic images.'],
          ['No social proof', 'Testimonials, client logos, and sold properties increase trust — and trust drives conversions.'],
        ])}
        <p style="margin-bottom:0;color:#7a7874;font-size:13px;">In our next email: how a proper web system + CRM can save your team 15 hours per week.</p>`,
      cta_text: 'Get a Free Website Audit',
      cta_url:  'https://adconnect.co.ke/?lead-capture-form=true',
    }),
  },

  // ─────────────────────────────────────────────────────────
  // EMAIL 4 — Day 10 — Android Development
  // ─────────────────────────────────────────────────────────
  {
    day: 10,
    subject: '📱 Why Your Real Estate Business Needs a Mobile App in 2025',
    category: 'android-dev',
    body: buildEmail({
      kicker:  'Android Development Insight #1',
      title:   'The Mobile App Advantage: How Real Estate Businesses Are Winning on Android',
      color:   '#9B59B6',
      content: `
        <p style="margin-bottom:16px;">Hi <strong style="color:#9B59B6;">\${clientName}</strong>,</p>
        <p style="margin-bottom:14px;">Kenya has one of the highest smartphone penetration rates in Africa — over 60% of internet traffic is mobile.</p>
        <p style="margin-bottom:18px;">Yet less than 5% of real estate businesses have a dedicated app. That's your competitive edge.</p>
        ${iconGrid([
          ['📲','Property Browsing','Clients browse listings offline, with high-quality images and virtual tours'],
          ['🔔','Push Notifications','Instant alerts for new listings matching client criteria — before they see it anywhere else'],
          ['📍','Maps Integration','Google Maps embedded for property location, nearby amenities, school catchment areas'],
          ['💬','Direct Messaging','In-app messaging between agents and clients — no WhatsApp juggling'],
        ])}
        <p style="margin-bottom:14px;">We build native Android apps in <strong>Kotlin</strong> — the modern, Google-recommended language for performance and reliability.</p>
        <p style="margin-bottom:0;color:#7a7874;font-size:13px;">Next up: How to track every lead from ad click to signed contract — automatically.</p>`,
      cta_text: 'Enquire About Android Development',
      cta_url:  'https://adconnect.co.ke/pages/our-services.html?development-service=true',
    }),
  },

  // ─────────────────────────────────────────────────────────
  // EMAIL 5 — Day 14 — Digital Marketing
  // ─────────────────────────────────────────────────────────
  {
    day: 14,
    subject: '🔬 The Lead Tracking System Every Real Estate Company Needs',
    category: 'digital-marketing',
    body: buildEmail({
      kicker:  'Digital Marketing Tip #3',
      title:   'How to Track Every Lead From First Click to Signed Contract',
      color:   '#F65730',
      content: `
        <p style="margin-bottom:16px;">Hi <strong style="color:#F65730;">\${clientName}</strong>,</p>
        <p style="margin-bottom:14px;">Most real estate companies know their monthly lead count. Very few know which ad, which platform, and which creative generated each sale.</p>
        <p style="margin-bottom:18px;">That's the difference between guessing and growing.</p>
        <div style="background:#252320;border-radius:8px;padding:20px;margin:20px 0;">
          <p style="font-weight:700;color:#f4f1ee;margin-bottom:14px;">The Full-Funnel Tracking Stack</p>
          ${trackingStack([
            ['Facebook Pixel','Tracks ad clicks, video views, form submissions','#1877F2'],
            ['Google Tag Manager','Single container for all tracking tags — no developer needed for changes','#F9AB00'],
            ['CRM Integration','Auto-logs leads, assigns agents, tracks follow-ups','#F65730'],
            ['Attribution Reports','Shows which campaigns actually closed deals','#4ABC4F'],
          ])}
        </div>
        <p style="margin-bottom:0;">When you know exactly what's working, you stop wasting budget and start scaling what converts.</p>`,
      cta_text: 'Build My Tracking System',
      cta_url:  'https://adconnect.co.ke/?lead-capture-form=true',
    }),
  },

  // ─────────────────────────────────────────────────────────
  // EMAIL 6 — Day 17 — System Development
  // ─────────────────────────────────────────────────────────
  {
    day: 17,
    subject: '⚙️ How Automated Systems Save Real Estate Companies 15 Hours/Week',
    category: 'system-dev',
    body: buildEmail({
      kicker:  'System Development Insight #1',
      title:   'The Property Management System That Runs Itself',
      color:   '#F5A623',
      content: `
        <p style="margin-bottom:16px;">Hi <strong style="color:#F5A623;">\${clientName}</strong>,</p>
        <p style="margin-bottom:14px;">Your agents shouldn't be spending their time on spreadsheets, manual follow-ups, and copy-pasting data between tools.</p>
        <p style="margin-bottom:18px;">Every hour on admin is an hour not spent selling. <strong>Automation fixes that.</strong></p>
        ${automationList([
          ['Lead Capture → CRM','New enquiry auto-creates a CRM record, assigns agent, sends acknowledgement email'],
          ['Follow-Up Sequences','If no contact in 48h, system auto-sends follow-up. Agent gets alert at 96h.'],
          ['Appointment Booking','Client picks slot online. Zoom/Meet link auto-generated. Both parties get confirmation.'],
          ['Monthly Reports','Automated PDF summary emailed to management every 1st of the month.'],
          ['Renewal Reminders','System flags lease renewals 90 days out. Agent prompted to make contact.'],
        ])}
        <p style="margin-bottom:0;color:#7a7874;font-size:13px;">We build these systems using Node.js, MySQL, and custom APIs — tailored to your workflow.</p>`,
      cta_text: 'Automate My Business',
      cta_url:  'https://adconnect.co.ke/?lead-capture-form=true',
    }),
  },

  // ─────────────────────────────────────────────────────────
  // EMAIL 7 — Day 21 — Web Development
  // ─────────────────────────────────────────────────────────
  {
    day: 21,
    subject: '🏗️ The 7-Page Website Structure That Converts Real Estate Visitors',
    category: 'web-development',
    body: buildEmail({
      kicker:  'Web Design Insight #2',
      title:   'The Exact Pages Your Real Estate Website Needs (And Why)',
      color:   '#3498DB',
      content: `
        <p style="margin-bottom:16px;">Hi <strong style="color:#3498DB;">\${clientName}</strong>,</p>
        <p style="margin-bottom:14px;">Not all pages are equal. Some pages convert. Others just take up space.</p>
        <p style="margin-bottom:18px;">After building 30+ real estate websites, here's the structure that consistently works:</p>
        ${pageStructure([
          ['🏠','Homepage','The first impression — headline, social proof, clear CTA above the fold'],
          ['🏢','Listings','Fast-loading property grid with filters, map view, and photo galleries'],
          ['👤','About','Builds trust — team photos, credentials, company story, client count'],
          ['📞','Contact','Simple form + phone + WhatsApp + office location with embedded map'],
          ['📖','Blog','SEO-driven content: "Best areas to buy in Nairobi 2025" = free organic leads'],
          ['🏆','Portfolio','Past sold properties + client testimonials — proof that you deliver'],
          ['🎯','Landing Pages','Campaign-specific pages with single focus: no navbar, one CTA only'],
        ])}
        <p style="margin-bottom:0;">We build every page with Core Web Vitals in mind — so Google ranks you and visitors stay.</p>`,
      cta_text: 'Get My Website Redesigned',
      cta_url:  'https://adconnect.co.ke/pages/our-services.html?development-service=true',
    }),
  },

  // ─────────────────────────────────────────────────────────
  // EMAIL 8 — Day 24 — Digital Marketing
  // ─────────────────────────────────────────────────────────
  {
    day: 24,
    subject: '📈 Instagram vs Facebook vs TikTok: Which Platform Wins for Real Estate?',
    category: 'digital-marketing',
    body: buildEmail({
      kicker:  'Digital Marketing Tip #4',
      title:   'Platform Breakdown: Where Should Your Real Estate Ad Budget Go?',
      color:   '#F65730',
      content: `
        <p style="margin-bottom:16px;">Hi <strong style="color:#F65730;">\${clientName}</strong>,</p>
        <p style="margin-bottom:14px;">The most common question we get: "Should I be on TikTok?"</p>
        <p style="margin-bottom:18px;">The answer is: <strong>it depends on your buyer.</strong></p>
        ${platformTable([
          ['Facebook','35–55 yrs','Detailed targeting, retargeting','Best for high-ticket property sales','★★★★★'],
          ['Instagram','25–40 yrs','Visual storytelling, Reels','Brand building + aspirational content','★★★★☆'],
          ['TikTok','18–35 yrs','Viral organic reach, low ad cost','Affordable entry-level/off-plan units','★★★☆☆'],
          ['Google Ads','All ages','High purchase intent','Capture people actively searching','★★★★★'],
          ['YouTube','28–50 yrs','Long-form trust building','Development launches, company tours','★★★★☆'],
        ])}
        <p style="margin-bottom:0;font-size:13px;color:#7a7874;">Our recommendation for most clients: Facebook + Instagram Meta combined (80% of budget) + Google retargeting (20%). This has consistently outperformed split-platform strategies.</p>`,
      cta_text: 'Get My Platform Strategy',
      cta_url:  'https://adconnect.co.ke/?lead-capture-form=true',
    }),
  },

  // ─────────────────────────────────────────────────────────
  // EMAIL 9 — Day 28 — Android Development
  // ─────────────────────────────────────────────────────────
  {
    day: 28,
    subject: '📲 6 Features Every Real Estate Android App Must Have in 2025',
    category: 'android-dev',
    body: buildEmail({
      kicker:  'Android Development Insight #2',
      title:   'Build It Right: The 6 Non-Negotiable Features for Real Estate Apps',
      color:   '#9B59B6',
      content: `
        <p style="margin-bottom:16px;">Hi <strong style="color:#9B59B6;">\${clientName}</strong>,</p>
        <p style="margin-bottom:14px;">A basic property listing app isn't enough anymore. Your app needs to solve real problems — for both agents and buyers.</p>
        ${featureList([
          ['🔍','Smart Search & Filters','Location, price range, bedrooms, property type — with instant results and saved searches'],
          ['📸','360° Virtual Tours','Integrated Matterport or custom panoramic viewer — reduces in-person visits by 60%'],
          ['🔔','Smart Notifications','Price drops, new listings matching saved searches, appointment reminders'],
          ['📋','Mortgage Calculator','Built-in calculator with current bank rates — helps buyers qualify themselves'],
          ['🤝','In-App Chat','Agent–client messaging with read receipts and image sharing — reduces call volume'],
          ['📊','Market Insights','Area price trends, days on market, comparable sales — positions you as an expert'],
        ])}
        <p style="margin-bottom:0;font-size:13px;color:#7a7874;">We build all of this in native Kotlin — which means better performance, better battery life, and better Play Store ratings than cross-platform alternatives.</p>`,
      cta_text: 'Start My App Project',
      cta_url:  'https://adconnect.co.ke/pages/our-services.html?development-service=true',
    }),
  },

  // ─────────────────────────────────────────────────────────
  // EMAIL 10 — Day 32 — System Development
  // ─────────────────────────────────────────────────────────
  {
    day: 32,
    subject: '🗂️ How a Custom CRM Changed Everything for One Nairobi Developer',
    category: 'system-dev',
    body: buildEmail({
      kicker:  'System Development Insight #2',
      title:   'Off-the-Shelf CRM vs Custom-Built: What\'s Actually Better for Real Estate?',
      color:   '#F5A623',
      content: `
        <p style="margin-bottom:16px;">Hi <strong style="color:#F5A623;">\${clientName}</strong>,</p>
        <p style="margin-bottom:14px;">Salesforce and HubSpot are powerful. But they weren't built for Kenyan real estate.</p>
        <p style="margin-bottom:18px;">Here's what one of our clients discovered after switching from HubSpot to a custom-built system:</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:20px 0;">
          ${comparisonCard('Before','HubSpot Generic CRM','• KES 45,000/month licensing\n• 60% of features unused\n• No M-Pesa integration\n• Manual property matching\n• No Kenyan phone format support','#E74C3C')}
          ${comparisonCard('After','Custom AdConnect CRM','• One-time build cost, zero monthly fees\n• Built around their exact workflow\n• M-Pesa payment tracking built in\n• Auto property–buyer matching\n• Full Safaricom number support','#4ABC4F')}
        </div>
        <p style="margin-bottom:0;">The result: 40% faster lead-to-viewing conversion and KES 540,000 saved in Year 1 alone.</p>`,
      cta_text: 'Discuss a Custom CRM',
      cta_url:  'https://adconnect.co.ke/?lead-capture-form=true',
    }),
  },

  // ─────────────────────────────────────────────────────────
  // EMAIL 11 — Day 35 — Digital Marketing
  // ─────────────────────────────────────────────────────────
  {
    day: 35,
    subject: '✉️ The Email Sequence That Re-Activates Cold Leads Automatically',
    category: 'digital-marketing',
    body: buildEmail({
      kicker:  'Digital Marketing Tip #5',
      title:   'Turn Dead Leads Into Active Buyers With This 5-Email Sequence',
      color:   '#F65730',
      content: `
        <p style="margin-bottom:16px;">Hi <strong style="color:#F65730;">\${clientName}</strong>,</p>
        <p style="margin-bottom:14px;">You've got leads who enquired 6 months ago and went silent. Most businesses write them off. <strong>Don't.</strong></p>
        <p style="margin-bottom:18px;">42% of real estate purchases happen 6–18 months after first enquiry. Your cold leads are warm money waiting.</p>
        ${emailSequenceViz([
          ['Day 1','Re-engagement email','Subject: "Still looking for a property in [area]?"'],
          ['Day 4','Value email','Send a free neighbourhood guide or market report'],
          ['Day 8','Social proof','"3 families who were in your position just moved in"'],
          ['Day 12','Urgency email','New listings, price changes, limited availability'],
          ['Day 16','Direct ask','"Can we schedule 15 mins to see if we can help?"'],
        ])}
        <p style="margin-bottom:0;font-size:13px;color:#7a7874;">We set this up as a fully automated sequence — once built, it runs forever with zero manual effort from your team.</p>`,
      cta_text: 'Build My Email Sequences',
      cta_url:  'https://adconnect.co.ke/?lead-capture-form=true',
    }),
  },

  // ─────────────────────────────────────────────────────────
  // EMAIL 12 — Day 39 — Web Development
  // ─────────────────────────────────────────────────────────
  {
    day: 39,
    subject: '⚡ SEO in 2025: How to Get Real Estate Leads From Google for Free',
    category: 'web-development',
    body: buildEmail({
      kicker:  'Web Development Insight #3',
      title:   'The SEO Strategy That Delivers Free Real Estate Leads, Month After Month',
      color:   '#3498DB',
      content: `
        <p style="margin-bottom:16px;">Hi <strong style="color:#3498DB;">\${clientName}</strong>,</p>
        <p style="margin-bottom:14px;">Paid ads stop the moment you stop paying. SEO compounds — the content you publish today drives leads for years.</p>
        <p style="margin-bottom:18px;">Here's what we build into every real estate website:</p>
        ${seoChecklist([
          ['Local SEO', 'Google Business Profile optimized, location pages for every area you serve'],
          ['Long-tail Keywords', '"3-bedroom apartment in Westlands under 20M" — these convert at 3x the rate of generic terms'],
          ['Schema Markup', 'Structured data that makes your listings show up as rich results in Google'],
          ['Core Web Vitals', 'LCP < 2.5s, FID < 100ms, CLS < 0.1 — Google\'s ranking signals, met'],
          ['Blog Strategy', '2 posts/month targeting buyer questions = compounding organic traffic'],
          ['Backlink Building', 'Property news sites, local directories, development PR — authority signals'],
        ])}
        <p style="margin-bottom:0;">One of our clients went from 0 to 4,200 organic visitors/month in 9 months — with zero ad spend on those visits.</p>`,
      cta_text: 'Start My SEO Strategy',
      cta_url:  'https://adconnect.co.ke/?lead-capture-form=true',
    }),
  },

  // ─────────────────────────────────────────────────────────
  // EMAIL 13 — Day 44 — Android Development
  // ─────────────────────────────────────────────────────────
  {
    day: 44,
    subject: '🤖 How AI is Changing Real Estate Apps (And What to Build Now)',
    category: 'android-dev',
    body: buildEmail({
      kicker:  'Android Development Insight #3',
      title:   'AI-Powered Features That Are Reshaping Real Estate Mobile Apps',
      color:   '#9B59B6',
      content: `
        <p style="margin-bottom:16px;">Hi <strong style="color:#9B59B6;">\${clientName}</strong>,</p>
        <p style="margin-bottom:14px;">AI isn't just for large corporations. These features are now affordable and buildable for any real estate business.</p>
        ${aiFeatureList([
          ['🧠','Smart Property Recommendations','App learns buyer preferences from browsing history — surfaces the right properties before they search'],
          ['💬','AI Chat Assistant','Answers common questions 24/7: prices, availability, viewing booking — without human intervention'],
          ['📸','Automated Photo Enhancement','Upload raw property photos — AI corrects lighting, straightens lines, removes clutter'],
          ['💰','Instant Valuation Tool','Buyers enter an address — AI provides market estimate based on comparable sales data'],
        ])}
        <p style="margin-bottom:14px;">We integrate these using <strong>Google ML Kit</strong> and <strong>Firebase AI Extensions</strong> — already available in the Android ecosystem, no external APIs needed.</p>
        <p style="margin-bottom:0;font-size:13px;color:#7a7874;">Build these features now while your competitors are still deciding whether AI is real.</p>`,
      cta_text: 'Build My AI-Powered App',
      cta_url:  'https://adconnect.co.ke/?lead-capture-form=true',
    }),
  },

  // ─────────────────────────────────────────────────────────
  // EMAIL 14 — Day 49 — System Development
  // ─────────────────────────────────────────────────────────
  {
    day: 49,
    subject: '🔗 How to Connect Your Website, App, CRM, and Ads Into One System',
    category: 'system-dev',
    body: buildEmail({
      kicker:  'System Development Insight #3',
      title:   'The Integrated Tech Stack: When Everything Talks to Everything',
      color:   '#F5A623',
      content: `
        <p style="margin-bottom:16px;">Hi <strong style="color:#F5A623;">\${clientName}</strong>,</p>
        <p style="margin-bottom:14px;">Most real estate businesses run on disconnected tools: a website here, a spreadsheet there, WhatsApp for leads, a separate calendar tool for appointments.</p>
        <p style="margin-bottom:18px;">Every disconnection = lost leads, missed follow-ups, and wasted time.</p>
        <div style="background:#252320;border-radius:12px;padding:20px;margin:20px 0;text-align:center;">
          <p style="color:#f4f1ee;font-weight:700;margin-bottom:16px;">The AdConnect Integrated Stack</p>
          ${integrationDiagram()}
        </div>
        <p style="margin-bottom:14px;">When a lead fills in your website form:</p>
        <ol style="padding-left:20px;margin-bottom:16px;display:flex;flex-direction:column;gap:8px;">
          <li style="color:#b8b4b0;font-size:14px;">CRM record auto-created, agent assigned</li>
          <li style="color:#b8b4b0;font-size:14px;">Welcome email sent instantly</li>
          <li style="color:#b8b4b0;font-size:14px;">Facebook Pixel fires conversion event</li>
          <li style="color:#b8b4b0;font-size:14px;">Appointment booking link SMS'd to client</li>
          <li style="color:#b8b4b0;font-size:14px;">Monthly report updated — all in under 2 seconds</li>
        </ol>`,
      cta_text: 'Build My Integrated System',
      cta_url:  'https://adconnect.co.ke/?lead-capture-form=true',
    }),
  },

  // ─────────────────────────────────────────────────────────
  // EMAIL 15 — Day 53 — Digital Marketing
  // ─────────────────────────────────────────────────────────
  {
    day: 53,
    subject: '🎥 Why Video Ads Convert 3x Better Than Image Ads (Real Data)',
    category: 'digital-marketing',
    body: buildEmail({
      kicker:  'Digital Marketing Tip #6',
      title:   'The Video Ad Formula That Outperforms Images Every Single Time',
      color:   '#F65730',
      content: `
        <p style="margin-bottom:16px;">Hi <strong style="color:#F65730;">\${clientName}</strong>,</p>
        <p style="margin-bottom:14px;">Across 50+ real estate campaigns we've run, the pattern is consistent: <strong>video beats image by 3:1 on cost-per-lead.</strong></p>
        <p style="margin-bottom:18px;">Here's the exact video formula we use:</p>
        ${videoFormula([
          ['0–3s','Pattern Interrupt','Show the most stunning room first. No logos, no text. Pure visual hook.'],
          ['3–8s','Problem Statement','"Still renting while property values climb?" — name their pain in one line'],
          ['8–20s','The Property','Fast cuts of key selling points: view, kitchen, master suite, amenities'],
          ['20–25s','Social Proof','Text overlay: "47 units sold this year" or "4.9★ from 120 buyers"'],
          ['25–30s','CTA','Single clear ask: "Book a viewing today. Limited units remaining."'],
        ])}
        <p style="margin-bottom:0;font-size:13px;color:#7a7874;">You don't need a professional studio. A good smartphone, natural light, and this structure — that's all you need to outperform 80% of competitors.</p>`,
      cta_text: 'Launch My Video Ad Campaign',
      cta_url:  'https://adconnect.co.ke/?lead-capture-form=true',
    }),
  },

  // ─────────────────────────────────────────────────────────
  // EMAIL 16 — Day 57 — Web Development
  // ─────────────────────────────────────────────────────────
  {
    day: 57,
    subject: '🛡️ Is Your Real Estate Website Secure? (Most Aren\'t)',
    category: 'web-development',
    body: buildEmail({
      kicker:  'Web Development Insight #4',
      title:   'Website Security for Real Estate: What You Must Have in 2025',
      color:   '#3498DB',
      content: `
        <p style="margin-bottom:16px;">Hi <strong style="color:#3498DB;">\${clientName}</strong>,</p>
        <p style="margin-bottom:14px;">Your website handles sensitive client data — names, phone numbers, financial details, appointment times. A breach isn't just embarrassing; it's legally actionable under Kenya's Data Protection Act 2019.</p>
        ${securityChecklist([
          ['SSL Certificate', 'HTTPS everywhere — Google penalizes non-SSL sites in rankings'],
          ['Input Validation', 'All forms must sanitize inputs — SQL injection protection'],
          ['Rate Limiting', 'Prevents brute force attacks on contact forms and login pages'],
          ['GDPR/DPA Compliance', 'Cookie consent, privacy policy, data retention policy — legally required'],
          ['Regular Backups', 'Daily automated backups to off-site storage — disaster recovery'],
          ['DDoS Protection', 'Cloudflare or equivalent — keeps site up during traffic spikes'],
          ['Secure File Uploads', 'File type validation prevents malicious uploads through enquiry forms'],
        ])}
        <p style="margin-bottom:0;">We audit and harden every website we build to these standards. Security isn't optional — it's foundational.</p>`,
      cta_text: 'Get a Security Audit',
      cta_url:  'https://adconnect.co.ke/?lead-capture-form=true',
    }),
  },

  // ─────────────────────────────────────────────────────────
  // EMAIL 17 — Day 62 — Android Development
  // ─────────────────────────────────────────────────────────
  {
    day: 62,
    subject: '🚀 From Idea to Play Store: The Real Timeline for Building an Android App',
    category: 'android-dev',
    body: buildEmail({
      kicker:  'Android Development Insight #4',
      title:   'The Real Timeline and Cost of Building a Real Estate Android App',
      color:   '#9B59B6',
      content: `
        <p style="margin-bottom:16px;">Hi <strong style="color:#9B59B6;">\${clientName}</strong>,</p>
        <p style="margin-bottom:14px;">The #1 reason real estate companies don't build an app: they think it takes years and costs millions.</p>
        <p style="margin-bottom:18px;"><strong>It doesn't.</strong> Here's the honest breakdown:</p>
        ${buildTimeline([
          ['Week 1–2','Discovery & Design','Requirements, wireframes, UI design in Figma. You approve every screen before a line of code is written.'],
          ['Week 3–6','Core Development','Authentication, property listings, search & filters, maps integration, push notifications.'],
          ['Week 7–8','Advanced Features','In-app chat, mortgage calculator, analytics dashboard, admin panel.'],
          ['Week 9','Testing','Devices tested: Samsung, Xiaomi, Tecno, Infinix. Android 10 through 14.'],
          ['Week 10','Play Store Launch','App store listing, screenshots, privacy policy, phased rollout.'],
        ])}
        <p style="margin-bottom:14px;"><strong>Typical project: 10–12 weeks.</strong></p>
        <p style="margin-bottom:0;font-size:13px;color:#7a7874;">We don't build generic templates and reskin them. Every app is architected from scratch for your specific business processes.</p>`,
      cta_text: 'Start My App Discussion',
      cta_url:  'https://adconnect.co.ke/?lead-capture-form=true',
    }),
  },

  // ─────────────────────────────────────────────────────────
  // EMAIL 18 — Day 66 — Web Development
  // ─────────────────────────────────────────────────────────
  {
    day: 66,
    subject: '🎨 Why UI/UX Design Is Your Highest-ROI Investment in 2025',
    category: 'web-development',
    body: buildEmail({
      kicker:  'Web Development Insight #5',
      title:   'Good Design Isn\'t Decoration — It\'s Your Biggest Conversion Lever',
      color:   '#3498DB',
      content: `
        <p style="margin-bottom:16px;">Hi <strong style="color:#3498DB;">\${clientName}</strong>,</p>
        <p style="margin-bottom:14px;">Every KES 1 invested in UX returns KES 100 in ROI (Forrester Research). For real estate, where every conversion is worth thousands, that math is even more compelling.</p>
        ${designPrinciples([
          ['Visual Hierarchy', 'Guide the eye to what matters: property photos → price → CTA. Nothing else competes.'],
          ['Cognitive Load', 'Every extra element on a page costs decisions. Less is more. Remove everything that isn\'t selling.'],
          ['Trust Signals', 'Consistent branding, professional photography, real team photos — credibility built before they enquire.'],
          ['Micro-interactions', 'Button animations, form validations, smooth transitions — tiny moments that signal quality.'],
          ['Accessibility', 'WCAG compliance isn\'t just ethical — it improves SEO and opens your site to a wider audience.'],
        ])}
        <p style="margin-bottom:14px;">We design in <strong>Figma</strong>, prototype every interaction, and only build after you've approved the complete visual experience.</p>
        <p style="margin-bottom:0;font-size:13px;color:#7a7874;">You see exactly what you're getting before we write a single line of code.</p>`,
      cta_text: 'Start My UI/UX Project',
      cta_url:  'https://adconnect.co.ke/pages/our-services.html?development-service=true',
    }),
  },

  // ─────────────────────────────────────────────────────────
  // EMAIL 19 — Day 70 — Mixed / Value
  // ─────────────────────────────────────────────────────────
  {
    day: 70,
    subject: '📋 The Complete Digital Marketing Checklist for Real Estate (Free Download)',
    category: 'value',
    body: buildEmail({
      kicker:  'Free Resource',
      title:   'Your Complete Digital Marketing Checklist for Real Estate in 2025',
      color:   '#4ABC4F',
      content: `
        <p style="margin-bottom:16px;">Hi <strong style="color:#4ABC4F;">\${clientName}</strong>,</p>
        <p style="margin-bottom:14px;">Over the past weeks, we've shared our best strategies. Today: the master checklist that ties it all together.</p>
        ${masterChecklist([
          ['Website', ['Fast-loading (< 3s)', 'Mobile-first design', 'SSL secure', 'Contact form works', 'Google Analytics installed', 'Schema markup added']],
          ['Social Media Ads', ['Facebook Pixel installed', 'Audiences built (custom + lookalike)', 'Video + image variants tested', '3-layer funnel active', 'Conversion tracking working']],
          ['Email Marketing', ['Welcome sequence automated', 'Re-engagement sequence active', 'Monthly newsletter scheduled', 'Unsubscribe link present']],
          ['SEO', ['Google Business Profile claimed', 'Location pages created', 'Blog updated 2x/month', 'Backlinks being built']],
          ['Systems', ['CRM in place', 'Lead auto-assignment working', 'Follow-up automation running', 'Monthly reports automated']],
        ])}
        <p style="margin-bottom:0;">If you'd like help ticking every box on this list — that's exactly what AdConnect does.</p>`,
      cta_text: 'Book a Free Audit Call',
      cta_url:  'https://adconnect.co.ke/?lead-capture-form=true',
    }),
  },

  // ─────────────────────────────────────────────────────────
  // EMAIL 20 — Day 75 — Final / Invitation
  // ─────────────────────────────────────────────────────────
  {
    day: 75,
    subject: '🤝 One Last Thing Before We Part Ways (Or Don\'t)',
    category: 'value',
    body: buildEmail({
      kicker:  'Personal Note from Misgina',
      title:   'Where Do You Want to Take Your Business in the Next 12 Months?',
      color:   '#F65730',
      content: `
        <p style="margin-bottom:16px;">Hi <strong style="color:#F65730;">\${clientName}</strong>,</p>
        <p style="margin-bottom:14px;">This is the last email in our automated sequence, and I wanted to make it personal.</p>
        <p style="margin-bottom:14px;">Over the past few months you've received our best thinking on digital marketing, web development, mobile apps, and business systems for real estate companies.</p>
        <p style="margin-bottom:18px;">Now I want to ask you one question:</p>
        <div style="background:#252320;border:1.5px solid rgba(246,87,48,.3);border-radius:12px;padding:24px;margin:20px 0;text-align:center;">
          <p style="font-family:'Syne',sans-serif;font-size:1.2rem;font-weight:800;color:#f4f1ee;line-height:1.4;">What does your real estate business look like in 12 months — if you execute on everything we've shared?</p>
        </div>
        <p style="margin-bottom:14px;">More leads. Faster conversions. Less manual work. A website and app that work while you sleep.</p>
        <p style="margin-bottom:14px;">If you're ready to build that — let's talk. No sales pitch. Just a 30-minute conversation to see if and how we can help.</p>
        <p style="margin-bottom:0;">Whether you hire us or not, I hope this series gave you real value. That's why we built it.</p>
        <p style="margin-top:20px;">Warm regards,<br/><strong style="color:#f4f1ee;">Misgina Fitwi</strong><br/><span style="color:#7a7874;font-size:13px;">Founder, AdConnect · +254 790 064 130</span></p>`,
      cta_text: '🗓️ Book My Free 30-Min Strategy Call',
      cta_url:  'https://adconnect.co.ke/?lead-capture-form=true',
    }),
  },
];


// ═══════════════════════════════════════════════════════════
// HTML BUILDER FUNCTIONS (shared email structure)
// ═══════════════════════════════════════════════════════════

function buildEmail({ kicker, title, color, content, cta_text, cta_url }) {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>${title}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0;}
body{background:#0f0e0d;font-family:Arial,Helvetica,sans-serif;color:#f4f1ee;}
.wrap{background:#0f0e0d;padding:32px 16px;}
.card{max-width:600px;margin:0 auto;background:#1a1917;border-radius:14px;overflow:hidden;border:1px solid #2d2b29;}
.hdr{background:linear-gradient(135deg,#1e1c1a 0%,#252320 100%);padding:36px 40px 28px;border-bottom:1px solid #2d2b29;}
.kicker{display:inline-block;background:rgba(${hexToRgb(color)},.1);border:1px solid rgba(${hexToRgb(color)},.25);color:${color};font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding:4px 14px;border-radius:999px;margin-bottom:16px;}
.hdr h1{color:#f4f1ee;font-size:22px;font-weight:800;line-height:1.25;}
.body{padding:32px 40px;}
.body p{color:#b8b4b0;font-size:14px;line-height:1.75;}
.body strong{color:#f4f1ee;}
.body a{color:${color};text-decoration:none;}
.cta-wrap{text-align:center;margin:28px 0;}
.cta-btn{display:inline-block;padding:14px 32px;background:${color};color:#fff;font-size:14px;font-weight:700;text-decoration:none;border-radius:10px;}
.divider{height:1px;background:#2d2b29;margin:24px 0;}
.sig{background:#252320;border:1px solid #2d2b29;border-radius:10px;padding:18px;display:flex;align-items:center;gap:14px;}
.sig-av{width:44px;height:44px;background:${color};border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:16px;font-weight:800;flex-shrink:0;}
.sig-name{color:#f4f1ee;font-size:14px;font-weight:700;}
.sig-role{color:#7a7874;font-size:12px;margin-top:2px;}
.ftr{background:#141312;border-top:1px solid #2d2b29;padding:20px 40px;text-align:center;}
.ftr p{color:#3d3b39;font-size:12px;line-height:1.6;}
.ftr a{color:#F65730;text-decoration:none;}
@media(max-width:480px){.hdr,.body,.ftr{padding:24px 20px;}.hdr h1{font-size:18px;}}
</style>
</head>
<body>
<div class="wrap"><div class="card">
<div class="hdr">
  <div class="kicker">${kicker}</div>
  <h1>${title}</h1>
</div>
<div class="body">
  ${content}
  <div class="divider"></div>
  <div class="cta-wrap"><a href="${cta_url}" class="cta-btn">${cta_text}</a></div>
  <div class="divider"></div>
  <div class="sig">
    <div class="sig-av">M</div>
    <div>
      <div class="sig-name">Misgina Fitwi</div>
      <div class="sig-role">Founder & Digital Marketing Specialist · AdConnect</div>
      <div style="margin-top:4px;"><a href="tel:+254790064130" style="color:#4ABC4F;font-size:12px;text-decoration:none;">📞 +254 790 064 130</a></div>
    </div>
  </div>
</div>
<div class="ftr">
  <p>Powered by <strong style="color:#4ABC4F;">AdConnect</strong> · Nairobi, Kenya · <a href="https://adconnect.co.ke">adconnect.co.ke</a></p>
  <p style="margin-top:6px;"><a href="\${unsubscribeUrl}">Unsubscribe</a> · <a href="https://adconnect.co.ke/pages/privacy-policy.html" style="color:#555;">Privacy Policy</a></p>
  <p style="margin-top:4px;color:#2d2b29;font-style:italic;">Designed, Built and Managed by AdConnect Development Team</p>
</div>
</div></div>
</body></html>`;
}

// Helper to convert hex to rgb for CSS rgba
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `${r},${g},${b}`;
}

// ── Component helpers (inline HTML fragments) ──────────────
function funnelStep(n,label,desc,color) {
  return `<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid #1e1c1a;">
    <div style="width:28px;height:28px;background:${color};border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:700;flex-shrink:0;">${n}</div>
    <div><span style="font-weight:700;color:#f4f1ee;font-size:13px;">${label} — </span><span style="color:#b8b4b0;font-size:13px;">${desc}</span></div>
  </div>`;
}
function numberedList(items) {
  return `<ol style="padding-left:0;margin-bottom:16px;list-style:none;display:flex;flex-direction:column;gap:10px;">
    ${items.map(([title,desc],i)=>`<li style="display:flex;align-items:flex-start;gap:12px;padding:10px 14px;background:#252320;border-radius:8px;">
      <span style="width:24px;height:24px;background:#F65730;border-radius:50%;color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${i+1}</span>
      <span><strong style="color:#f4f1ee;">${title}</strong><br/><span style="color:#7a7874;font-size:13px;">${desc}</span></span>
    </li>`).join('')}
  </ol>`;
}
function iconGrid(items) {
  return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:20px 0;">
    ${items.map(([icon,title,desc])=>`<div style="background:#252320;border-radius:10px;padding:14px;">
      <div style="font-size:1.3rem;margin-bottom:8px;">${icon}</div>
      <div style="font-weight:700;color:#f4f1ee;font-size:13px;margin-bottom:4px;">${title}</div>
      <div style="color:#7a7874;font-size:12px;line-height:1.5;">${desc}</div>
    </div>`).join('')}
  </div>`;
}
function trackingStack(items) {
  return items.map(([name,desc,color])=>`<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid #1e1c1a;">
    <div style="width:10px;height:10px;background:${color};border-radius:50%;flex-shrink:0;"></div>
    <div><strong style="color:#f4f1ee;font-size:13px;">${name}</strong><br/><span style="color:#7a7874;font-size:12px;">${desc}</span></div>
  </div>`).join('');
}
function automationList(items) {
  return `<div style="display:flex;flex-direction:column;gap:8px;margin:16px 0;">
    ${items.map(([title,desc])=>`<div style="background:#252320;border-radius:8px;padding:12px 16px;">
      <strong style="color:#F5A623;font-size:13px;">→ ${title}</strong><br/>
      <span style="color:#b8b4b0;font-size:12px;">${desc}</span>
    </div>`).join('')}
  </div>`;
}
function platformTable(items) {
  return `<table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:12px;">
    <thead><tr style="background:#252320;">
      <th style="text-align:left;padding:8px 10px;color:#7a7874;">Platform</th>
      <th style="padding:8px 10px;color:#7a7874;">Age</th>
      <th style="padding:8px 10px;color:#7a7874;">Best For</th>
      <th style="padding:8px 10px;color:#7a7874;">Rating</th>
    </tr></thead>
    <tbody>${items.map(([p,a,_,best,stars],i)=>`<tr style="background:${i%2?'#1e1c1a':'#252320'}">
      <td style="padding:8px 10px;color:#f4f1ee;font-weight:700;">${p}</td>
      <td style="padding:8px 10px;color:#7a7874;">${a}</td>
      <td style="padding:8px 10px;color:#b8b4b0;">${best}</td>
      <td style="padding:8px 10px;color:#F5A623;">${stars}</td>
    </tr>`).join('')}</tbody>
  </table>`;
}
function pageStructure(items) {
  return `<div style="display:flex;flex-direction:column;gap:8px;margin:16px 0;">
    ${items.map(([icon,name,desc])=>`<div style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:#252320;border-radius:8px;">
      <span style="font-size:1.1rem;width:24px;">${icon}</span>
      <div><strong style="color:#f4f1ee;font-size:13px;">${name}</strong> — <span style="color:#7a7874;font-size:13px;">${desc}</span></div>
    </div>`).join('')}
  </div>`;
}
function featureList(items) {
  return `<div style="display:flex;flex-direction:column;gap:10px;margin:16px 0;">
    ${items.map(([icon,title,desc])=>`<div style="background:#252320;border-radius:8px;padding:14px 16px;display:flex;align-items:flex-start;gap:12px;">
      <span style="font-size:1.2rem;flex-shrink:0;">${icon}</span>
      <div><strong style="color:#f4f1ee;font-size:13px;">${title}</strong><br/><span style="color:#7a7874;font-size:12px;line-height:1.6;">${desc}</span></div>
    </div>`).join('')}
  </div>`;
}
function aiFeatureList(items) { return featureList(items); }
function emailSequenceViz(items) {
  return `<div style="display:flex;flex-direction:column;gap:0;margin:16px 0;">
    ${items.map(([day,type,sub],i)=>`<div style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid #1e1c1a;">
      <div style="width:48px;text-align:center;flex-shrink:0;">
        <div style="background:#F65730;color:#fff;font-size:10px;font-weight:700;border-radius:4px;padding:2px 6px;">${day}</div>
      </div>
      <div>
        <div style="font-weight:700;color:#f4f1ee;font-size:13px;">${type}</div>
        <div style="color:#7a7874;font-size:12px;">${sub}</div>
      </div>
    </div>`).join('')}
  </div>`;
}
function comparisonCard(label,title,points,color) {
  return `<div style="background:#252320;border:1px solid ${color}33;border-radius:10px;padding:16px;">
    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:${color};margin-bottom:10px;">${label}</div>
    <div style="font-weight:700;color:#f4f1ee;font-size:13px;margin-bottom:10px;">${title}</div>
    ${points.split('\n').map(p=>`<div style="display:flex;gap:6px;margin-bottom:6px;font-size:12px;color:#b8b4b0;"><span style="color:${color}">•</span><span>${p.replace('• ','')}</span></div>`).join('')}
  </div>`;
}
function integrationDiagram() {
  const nodes = ['Website','Facebook Pixel','CRM','Email','App','Reports'];
  return `<div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;padding:8px;">
    ${nodes.map(n=>`<div style="background:#F65730;color:#fff;font-size:11px;font-weight:700;padding:6px 14px;border-radius:6px;">${n}</div>`).join('<span style="color:#F65730;font-size:14px;align-self:center;">⇄</span>')}
  </div>`;
}
function seoChecklist(items) {
  return `<div style="display:flex;flex-direction:column;gap:8px;margin:16px 0;">
    ${items.map(([title,desc])=>`<div style="display:flex;align-items:flex-start;gap:10px;padding:10px 14px;background:#252320;border-radius:8px;">
      <span style="color:#3498DB;font-size:14px;">✓</span>
      <div><strong style="color:#f4f1ee;font-size:13px;">${title}</strong><br/><span style="color:#7a7874;font-size:12px;">${desc}</span></div>
    </div>`).join('')}
  </div>`;
}
function securityChecklist(items) {
  return `<div style="display:flex;flex-direction:column;gap:8px;margin:16px 0;">
    ${items.map(([title,desc])=>`<div style="display:flex;align-items:flex-start;gap:10px;padding:10px 14px;background:#252320;border-radius:8px;">
      <span style="color:#3498DB;font-size:14px;flex-shrink:0;">🛡️</span>
      <div><strong style="color:#f4f1ee;font-size:13px;">${title}</strong> — <span style="color:#7a7874;font-size:13px;">${desc}</span></div>
    </div>`).join('')}
  </div>`;
}
function designPrinciples(items) {
  return `<div style="display:flex;flex-direction:column;gap:10px;margin:16px 0;">
    ${items.map(([title,desc])=>`<div style="padding:12px 16px;background:#252320;border-left:3px solid #3498DB;border-radius:0 8px 8px 0;">
      <strong style="color:#f4f1ee;font-size:13px;">${title}</strong><br/>
      <span style="color:#7a7874;font-size:13px;">${desc}</span>
    </div>`).join('')}
  </div>`;
}
function buildTimeline(items) {
  return `<div style="display:flex;flex-direction:column;gap:0;margin:16px 0;">
    ${items.map(([period,title,desc],i)=>`<div style="display:flex;gap:14px;padding:14px 0;border-bottom:${i<items.length-1?'1px solid #1e1c1a':'none'}">
      <div style="min-width:80px;flex-shrink:0;">
        <div style="background:#9B59B6;color:#fff;font-size:10px;font-weight:700;padding:2px 8px;border-radius:4px;text-align:center;">${period}</div>
      </div>
      <div>
        <strong style="color:#f4f1ee;font-size:13px;">${title}</strong><br/>
        <span style="color:#7a7874;font-size:12px;line-height:1.6;">${desc}</span>
      </div>
    </div>`).join('')}
  </div>`;
}
function videoFormula(items) {
  return `<div style="display:flex;flex-direction:column;gap:0;margin:16px 0;">
    ${items.map(([timing,label,desc])=>`<div style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid #1e1c1a;">
      <div style="width:42px;text-align:center;flex-shrink:0;font-family:monospace;font-size:11px;font-weight:700;color:#F65730;">${timing}</div>
      <div><strong style="color:#f4f1ee;font-size:13px;">${label}</strong><br/><span style="color:#7a7874;font-size:12px;">${desc}</span></div>
    </div>`).join('')}
  </div>`;
}
function masterChecklist(sections) {
  return `<div style="display:flex;flex-direction:column;gap:14px;margin:16px 0;">
    ${sections.map(([section, items])=>`<div style="background:#252320;border-radius:10px;overflow:hidden;">
      <div style="background:rgba(74,188,79,.1);border-bottom:1px solid rgba(74,188,79,.15);padding:10px 16px;">
        <strong style="color:#4ABC4F;font-size:12px;text-transform:uppercase;letter-spacing:1px;">${section}</strong>
      </div>
      <div style="padding:12px 16px;display:flex;flex-direction:column;gap:6px;">
        ${items.map(item=>`<div style="display:flex;gap:8px;font-size:13px;color:#b8b4b0;"><span style="color:#4ABC4F;">☐</span>${item}</div>`).join('')}
      </div>
    </div>`).join('')}
  </div>`;
}

module.exports = EMAIL_SEQUENCE;