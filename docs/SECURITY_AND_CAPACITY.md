# Security review and platform capacity

Scope: source-code review and local tests, not an independent penetration test of the deployed website. No website can be guaranteed unhackable. No deployment or live account configuration was changed by this release.

## Controls included

Google ID tokens are verified on the server. Browser-supplied roles cannot elevate privileges. Demo identities work only in the separate local server. Production authenticated actions reject missing or invalid Google tokens. The API checks the request origin, action allowlist and body size. Apps Script requires the backend secret before accessing data and serializes operations with a script lock.

Name/year discovery returns only names and Dakhil years plus fields already approved for public display. Ownership requires independent admin verification. Private source records are returned only to their linked owner and authorized review workflows. A record cannot be linked to two accounts. New students and alumni are reviewed before public posting.

Appointment requests are limited to verified members and opted-in verified mentors. Only the recipient can accept or decline; only the sender can cancel. Other members cannot read the request or notification. Admin backup exports contain private data by design and must be protected. Moderators cannot grant roles. Staff cannot approve their own submissions.

Rendering uses textContent and escaped form values. A Content Security Policy restricts scripts and connections to the site and necessary Google sign-in endpoints. Framing is denied; camera, microphone and geolocation permissions are disabled. Referrers are suppressed. Google Identity Services is loaded only after an explicit sign-in click. Tokens stay in memory rather than browser local storage.

Apps Script has best-effort CacheService request limits. Cache entries can be evicted; this is not a strong distributed anti-abuse barrier. Appointment creation also has a database-backed five-request daily limit and blocks duplicate pending requests. Vercel Firewall rate limits and bot protection still require production configuration and validation. Public search must remain paginated and may still be scraped.

## External monitoring and privacy

No analytics SDK, advertising pixel, session replay, embedded social widget, remote font or third-party notification service is added. Campus image and logo are served from the website. Arbitrary external post images are links rather than automatically loaded images, because image hosts can otherwise collect visitor IP addresses. Source credits remain visible. Opening an external image, social share or official-site link intentionally contacts that destination.

This does not mean zero third-party processing. Vercel serves requests and may retain operational logs. Google processes sign-in and hosts the private database. GitHub stores code and deployment history. Provider/account settings have not been audited here. Public pages can be read, copied or monitored by outsiders; no technical control can promise otherwise. Keep private records out of public pages, Git history and exported ZIPs.

## Remaining production work

Confirm private spreadsheet and backup permissions; protect administrator Google, GitHub and Vercel accounts with MFA or passkeys; restrict collaborators; store secrets only in Vercel environment settings and Apps Script properties; rotate leaked secrets; configure abuse protection; test backup restoration and notification retention; verify production CSP and Google sign-in; load-test the configured backend. Retain security audit logs while avoiding personal data in request logs. The source security tests do not prove these account settings are correct.

## What each component does

GitHub: versioned application code, review, change history and rollback. It is not the member database.
Vercel: HTTPS website delivery and serverless API. It verifies identity and forwards authorized requests to the backend. It is not configured here as a durable database or real-time notification service.
Google Drive and Sheets: private member records, legacy imports, posts, claims, appointments, notifications, reports and audit rows. Apps Script provides business rules and controlled updates. Members share protected tables keyed by account identity; they do not each receive a separate spreadsheet.

For the 133-record pilot, this is a reasonable starting architecture, subject to live validation. This is an engineering assessment, not measured capacity. The implementation reads full tables and serializes backend calls, so response time and contention will grow with traffic and history. Google quotas and Vercel limits apply. Do not promise a fixed supported user count without load tests. For heavier concurrent traffic or real-time messaging, migrate records to a transactional database with indexes, durable rate limits and a notification queue. Drive can remain the backup/document store and GitHub/Vercel can remain code/hosting.

Official references checked during this review:
https://developers.google.com/apps-script/guides/services/quotas
https://vercel.com/docs/functions/limitations
https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid
