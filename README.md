# AdConnect

Website + admin for AdConnect: digital marketing, web development, software development, software design,
database management, consulting, data analytics and training.

**Client side:** services, session booking per category, project-proposal upload, email subscription, blog, FAQs, careers, contact.
**Admin (`/admin.html`):** manages all of it — services & categories, bookings and availability rules, proposals (status, quote, reply, file download),
subscribers, the email campaign (welcome + 50 follow-ups), broadcasts, messages, content, team, settings, and **Appearance** (theme colours).
Both sides are mobile friendly; the admin uses a slide-in menu and card-style tables on phones.

## Setup
1. Create a MySQL/MariaDB database and user.
2. `create a .env` and fill it in. **Required:** DB_*, `JWT_SECRET`, `CRON_SECRET`, `ADMIN_DEFAULT_PASSWORD`, SMTP settings.
   (Upgrading? Keep your existing `.env` and add the new variables.)
3. `npm install` then `npm start`. Tables are created/upgraded automatically on start (`database/schema.sql` is the same schema for manual import).
4. Optional demo content: import `database/sample-data.sql` (or `npm run sample-data` to rebuild it). It adds the service catalogue, the welcome email + 50 follow-ups,
   14 blog posts, 40 fictional subscribers with send history, and a few bookings/proposals. Safe to run twice.
5. Log in at `/admin.html` with `ADMIN_DEFAULT_EMAIL` / `ADMIN_DEFAULT_PASSWORD`, then change the password under Settings.
   Passwords are stored as scrypt hashes; any old plain-text passwords are upgraded on first start.

## Email campaign
Each new subscriber gets the welcome email (step 0) then one email every 3 days (steps 1–50). Edit, preview, test-send or pause any step in Admin → Campaign.
Sending is driven by an in-process job every 15 minutes. On hosts that stop idle Node apps, add a cPanel cron job as well:
`*/15 * * * * curl -s "https://adconnect.co.ke/api/campaign/cron?key=CRON_SECRET" >/dev/null`
Every email has a signed unsubscribe link and one-click unsubscribe header.

## Theme colours
Admin → Appearance: pick a preset or set colours; a contrast check warns about unreadable combinations. Fonts (Syne, DM Sans, IBM Plex Mono) are fixed by design.

## Deployment (cPanel)
Edit `DEPLOYPATH` in `.cpanel.yml`, push, deploy. `.env` and `uploads/` are never overwritten. Run NPM Install in *Setup Node.js App* and restart.

## Notes
- Uploaded proposal files and CVs are not publicly served; they are downloaded through the authenticated admin only.
- Service prices are blank by default ("custom quote"); add them in Admin → Services.
- Google Meet links need the Google redirect URI set to `https://adconnect.co.ke/api/google-oauth/callback`.
