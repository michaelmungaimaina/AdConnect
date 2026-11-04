'use strict';
/**
 * Default service catalogue. Seeded on first start (when the table is empty) and then
 * managed entirely from Admin → Services. Prices are intentionally left blank
 * (shown as "Custom quote") – fill them in from the admin panel if you want to publish them.
 */
const MISGINA = { host_key: 'misgina', host_name: 'Misgina Fitwi' };
const MICHAEL = { host_key: 'michael', host_name: 'Michael Maina' };
const TEAM = { host_key: 'team', host_name: 'AdConnect Team' };

module.exports = [
  {
    slug: 'digital-marketing', name: 'Digital Marketing', icon: 'fa-bullhorn', session_minutes: 30, ...MISGINA,
    tagline: 'Campaigns that find your customers and turn attention into enquiries.',
    description: 'Paid social, search visibility, email and reporting — planned around your goals and budget. We started in real-estate marketing and now work with shops, schools, clinics, SaaS, NGOs and service businesses.',
    services: [
      { slug: 'social-media-advertising', name: 'Social Media Advertising', icon: 'fa-rectangle-ad', summary: 'Targeted Facebook, Instagram, TikTok and Google campaigns with clear lead and sales goals.', features: ['Audience research & targeting', 'Campaign set-up and A/B testing', 'Weekly optimisation', 'Lead-form and WhatsApp funnels'] },
      { slug: 'seo-content-marketing', name: 'SEO & Content Marketing', icon: 'fa-magnifying-glass-chart', summary: 'Get found on Google with technical SEO, local SEO and useful content.', features: ['Keyword & competitor research', 'On-page and technical SEO fixes', 'Google Business Profile set-up', 'Content calendar'] },
      { slug: 'email-marketing-automation', name: 'Email Marketing & Automation', icon: 'fa-envelope-open-text', summary: 'Welcome series, newsletters and follow-up sequences that run on autopilot.', features: ['List building & segmentation', 'Automated drip sequences', 'Template design', 'Open/click reporting'] },
      { slug: 'real-estate-lead-generation', name: 'Real Estate Lead Generation', icon: 'fa-house-signal', summary: 'Our original specialty: qualified buyer and tenant leads for agents and developers.', features: ['Listing and project campaigns', 'Landing pages & lead capture', 'Lead follow-up automation', 'Cost-per-lead tracking'] },
      { slug: 'ad-creative-branding', name: 'Ad Creative & Brand Design', icon: 'fa-palette', summary: 'Scroll-stopping ad creatives, social templates and consistent brand assets.', features: ['Ad images and short videos', 'Social media templates', 'Logo & brand basics', 'Creative testing'] },
      { slug: 'marketing-analytics-reporting', name: 'Analytics & Reporting', icon: 'fa-chart-line', summary: 'Know what works: tracking set-up and plain-language monthly reports.', features: ['GA4 / Tag Manager / Pixel set-up', 'Conversion tracking', 'Monthly performance report', 'Dashboard in Looker Studio'] },
    ],
  },
  {
    slug: 'web-development', name: 'Web Development', icon: 'fa-code', session_minutes: 45, ...MICHAEL,
    tagline: 'Fast, mobile-first websites and web apps built to convert.',
    description: 'From a simple business site to a custom portal or online shop — designed, built and maintained with modern, secure technology.',
    services: [
      { slug: 'business-websites', name: 'Business Websites', icon: 'fa-globe', summary: 'Professional, mobile-first websites that load quickly and are easy for you to update.', features: ['Custom design', 'Mobile-first and SEO-ready', 'Contact & booking forms', 'Admin area for content'] },
      { slug: 'ecommerce-stores', name: 'E-commerce Stores', icon: 'fa-cart-shopping', summary: 'Online shops with product management, M-Pesa / card payments and order tracking.', features: ['Product & stock management', 'M-Pesa and card payments', 'Delivery and order emails', 'Sales reporting'] },
      { slug: 'web-applications-portals', name: 'Web Apps & Client Portals', icon: 'fa-window-restore', summary: 'Custom web applications: dashboards, portals, booking and membership systems.', features: ['Role-based access', 'Secure login', 'Reports & exports', 'API-ready architecture'] },
      { slug: 'api-payment-integration', name: 'API & Payment Integration', icon: 'fa-plug', summary: 'Connect your site to M-Pesa Daraja, SMS, email, maps, CRMs and third-party services.', features: ['M-Pesa STK push / C2B', 'SMS and WhatsApp APIs', 'Webhook handling', 'Error monitoring'] },
      { slug: 'website-maintenance-speed', name: 'Maintenance & Speed Optimisation', icon: 'fa-gauge-high', summary: 'Keep your site secure, backed-up and fast — or rescue a slow one.', features: ['Updates & security patches', 'Backups', 'Core Web Vitals tuning', 'Uptime monitoring'] },
    ],
  },
  {
    slug: 'software-development', name: 'Software Development', icon: 'fa-laptop-code', session_minutes: 45, ...MICHAEL,
    tagline: 'Custom software that fits the way your organisation really works.',
    description: 'CRMs, management systems, mobile apps and automations built iteratively with you — starting with the smallest version that delivers value.',
    services: [
      { slug: 'custom-software-crm-erp', name: 'Custom Software, CRM & ERP', icon: 'fa-diagram-project', summary: 'Management systems for sales, inventory, clinics, schools, logistics and more.', features: ['Requirements workshop', 'Iterative delivery', 'User training', 'Ongoing support'] },
      { slug: 'android-mobile-apps', name: 'Android & Mobile Apps', icon: 'fa-mobile-screen-button', summary: 'Native Android (Kotlin/Java) and cross-platform apps with offline support where needed.', features: ['Native Android', 'Offline-first design', 'Play Store publishing', 'Push notifications'] },
      { slug: 'automation-integrations', name: 'Automation & Integrations', icon: 'fa-robot', summary: 'Scripts, bots and workflows that remove repetitive manual work.', features: ['Process mapping', 'Data sync between systems', 'Scheduled jobs & alerts', 'Chatbots'] },
      { slug: 'internal-business-tools', name: 'Internal Tools & Dashboards', icon: 'fa-screwdriver-wrench', summary: 'Small, focused tools your team will actually use — replacing spreadsheets and paper.', features: ['Forms & approvals', 'Role permissions', 'Reports & exports', 'Fast to launch'] },
      { slug: 'software-testing-qa', name: 'Software Testing & QA', icon: 'fa-bug', summary: 'Manual and automated testing to catch problems before your users do.', features: ['Test plans & cases', 'Regression testing', 'Bug reports with steps', 'Release checklists'] },
    ],
  },
  {
    slug: 'software-design', name: 'Software Design', icon: 'fa-pen-ruler', session_minutes: 45, ...MICHAEL,
    tagline: 'Design the product and the system before you build it.',
    description: 'UI/UX design, system architecture and technical documentation so your project is clear, costed and buildable.',
    services: [
      { slug: 'ui-ux-design', name: 'UI/UX Design', icon: 'fa-object-group', summary: 'User research, wireframes and polished Figma designs for web and mobile.', features: ['User flows & wireframes', 'Clickable prototypes', 'Design system', 'Developer hand-off'] },
      { slug: 'system-architecture-design', name: 'System Architecture & Design', icon: 'fa-sitemap', summary: 'Choose the right structure, stack and integrations before you spend on development.', features: ['Architecture diagrams', 'Technology selection', 'Scalability & security plan', 'Cost-aware recommendations'] },
      { slug: 'requirements-technical-specs', name: 'Requirements & Technical Specs (SRS)', icon: 'fa-file-lines', summary: 'Turn an idea into a clear written specification any developer can quote against.', features: ['Stakeholder interviews', 'User stories & acceptance criteria', 'Scope & milestones', 'Wireframe annexes'] },
      { slug: 'prototyping-mvp-planning', name: 'Prototyping & MVP Planning', icon: 'fa-flask', summary: 'Validate your idea with a prototype and a lean launch plan.', features: ['Click-through prototype', 'MVP feature prioritisation', 'Build roadmap', 'User testing'] },
    ],
  },
  {
    slug: 'database-management', name: 'Database Management', icon: 'fa-database', session_minutes: 45, ...MICHAEL,
    tagline: 'Reliable, fast and safe data — designed properly and looked after.',
    description: 'Database design, migration, tuning, backups and reporting for MySQL/MariaDB, PostgreSQL, SQL Server, SQLite and Excel-to-database projects.',
    services: [
      { slug: 'database-design-modelling', name: 'Database Design & Modelling', icon: 'fa-table-cells', summary: 'Clean, normalised schemas and ER diagrams built around your business rules.', features: ['Entity-relationship modelling', 'Schema design & indexing', 'Data dictionary', 'Documentation'] },
      { slug: 'database-migration', name: 'Data Migration & Upgrades', icon: 'fa-right-left', summary: 'Move from spreadsheets or legacy systems to a proper database — safely.', features: ['Data audit & mapping', 'Dry-run migrations', 'Validation reports', 'Rollback plan'] },
      { slug: 'database-performance-tuning', name: 'Performance Tuning', icon: 'fa-bolt', summary: 'Find slow queries and fix them with indexing, query rewrites and configuration.', features: ['Slow-query analysis', 'Index strategy', 'Configuration review', 'Before/after benchmarks'] },
      { slug: 'database-backup-security', name: 'Administration, Backups & Security', icon: 'fa-shield-halved', summary: 'Automated backups, tested recovery, access control and monitoring.', features: ['Backup automation', 'Restore testing', 'User & permission audit', 'Monitoring & alerts'] },
      { slug: 'data-cleaning-etl', name: 'Data Cleaning & ETL', icon: 'fa-filter', summary: 'Clean, de-duplicate and combine messy data into one trustworthy source.', features: ['De-duplication', 'Standardisation', 'Automated pipelines', 'Data-quality reports'] },
    ],
  },
  {
    slug: 'consulting', name: 'Consulting', icon: 'fa-handshake-angle', session_minutes: 60, ...TEAM,
    tagline: 'Independent advice on digital marketing and software decisions.',
    description: 'Short, practical engagements that help you decide what to do, in what order, and what it should cost — before you commit budget.',
    services: [
      { slug: 'digital-marketing-consulting', name: 'Digital Marketing Consulting', icon: 'fa-bullseye', summary: 'Strategy, channel mix, budget planning and campaign audits for your business.', features: ['Marketing audit', 'Channel & budget plan', '90-day roadmap', 'Team coaching'] },
      { slug: 'software-development-consulting', name: 'Software Development Consulting', icon: 'fa-code-compare', summary: 'Technology choices, code & architecture reviews, vendor and quote evaluation.', features: ['Stack recommendation', 'Code / architecture review', 'Vendor proposal review', 'Delivery process advice'] },
      { slug: 'digital-transformation-roadmap', name: 'Digital Transformation Roadmap', icon: 'fa-route', summary: 'A step-by-step plan to move paper and spreadsheet processes into reliable systems.', features: ['Process mapping', 'Quick-win identification', 'Phased plan & costs', 'Change-management tips'] },
      { slug: 'technical-audit-due-diligence', name: 'Technical Audit & Due Diligence', icon: 'fa-clipboard-check', summary: 'Independent review of an existing website, app or system: risks, quality and next steps.', features: ['Security & performance review', 'Maintainability assessment', 'Risk register', 'Prioritised recommendations'] },
    ],
  },
  {
    slug: 'data-analytics', name: 'Data Analytics & Statistics', icon: 'fa-chart-pie', session_minutes: 45, ...MICHAEL,
    tagline: 'Statistics and computer science applied to your real questions.',
    description: 'Statistical analysis, surveys, dashboards and predictive models delivered by a Statistics and Computer Science graduate — with results explained in plain language.',
    services: [
      { slug: 'statistical-analysis-reporting', name: 'Statistical Analysis & Reporting', icon: 'fa-square-poll-vertical', summary: 'Hypothesis tests, regression, time series and more in R, Python, SPSS or Stata.', features: ['Method selection', 'Reproducible analysis', 'Plain-language report', 'Charts & tables'] },
      { slug: 'survey-design-data-collection', name: 'Survey Design & Data Collection', icon: 'fa-clipboard-list', summary: 'Questionnaires, sampling plans and mobile data collection (ODK / KoBo / Google Forms).', features: ['Questionnaire design', 'Sample-size calculation', 'Mobile data capture', 'Data-quality checks'] },
      { slug: 'business-intelligence-dashboards', name: 'BI Dashboards', icon: 'fa-chart-column', summary: 'Interactive dashboards in Power BI, Looker Studio or custom web dashboards.', features: ['KPI definition', 'Automated data refresh', 'Role-based views', 'Training for your team'] },
      { slug: 'forecasting-predictive-modelling', name: 'Forecasting & Predictive Modelling', icon: 'fa-wand-magic-sparkles', summary: 'Demand, sales and churn forecasts with transparent, validated models.', features: ['Data preparation', 'Model comparison & validation', 'Forecast dashboards', 'Model hand-over'] },
      { slug: 'ab-testing-experiment-analysis', name: 'A/B Testing & Experiment Analysis', icon: 'fa-vials', summary: 'Design experiments and read results correctly — power, significance, and effect size.', features: ['Test design & sample size', 'Tracking set-up', 'Statistical analysis', 'Decision summary'] },
      { slug: 'monitoring-evaluation-systems', name: 'Monitoring & Evaluation (M&E) Systems', icon: 'fa-list-check', summary: 'Indicators, data collection tools and reporting dashboards for projects and NGOs.', features: ['Results framework & indicators', 'Data collection tools', 'Donor-style reports', 'Dashboards'] },
      { slug: 'web-scraping-data-engineering', name: 'Web Scraping & Data Pipelines', icon: 'fa-spider', summary: 'Collect public data responsibly and deliver it as clean, scheduled datasets.', features: ['Responsible scraping', 'Scheduled pipelines', 'Clean CSV / database output', 'Monitoring'] },
    ],
  },
  {
    slug: 'training', name: 'Training & Mentorship', icon: 'fa-graduation-cap', session_minutes: 60, ...TEAM,
    tagline: 'Practical skills for you or your team.',
    description: 'Workshops and one-to-one mentoring in digital marketing, spreadsheets, SQL, Python/R and data skills. Sessions are hands-on and use your own examples.',
    services: [
      { slug: 'digital-marketing-training', name: 'Digital Marketing Training', icon: 'fa-chalkboard-user', summary: 'Social ads, SEO and email marketing for business owners and teams.', features: ['Live, hands-on sessions', 'Templates and checklists', 'Your own campaigns as practice', 'Follow-up support'] },
      { slug: 'data-skills-training', name: 'Excel, SQL, Python & R Training', icon: 'fa-chart-simple', summary: 'From spreadsheet confidence to databases and data analysis with code.', features: ['Beginner to intermediate', 'Real datasets', 'Exercises & feedback', 'Group or one-to-one'] },
      { slug: 'programming-mentorship', name: 'Programming Mentorship', icon: 'fa-user-graduate', summary: 'Regular mentoring for students and junior developers: projects, code review and career advice.', features: ['Learning plan', 'Code reviews', 'Portfolio guidance', 'Interview preparation'] },
    ],
  },
];
