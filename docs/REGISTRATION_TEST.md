# Member search, verification and career appointments

This release replaces ID-based onboarding. Run npm ci then npm run demo and open http://localhost:3000. Demo member, Demo mentor and Demo admin use synthetic data only. Restarting the server resets it. Never deploy scripts/demo.js as the production backend.

## Existing members

1. Click Become a member, then Yes, link my record.
2. Search Demo Alumni and 2012. Either input can be blank. Both blank returns a paginated list. Bengali digits are supported for the year.
3. Select This is my profile. Only name and Dakhil year from unclaimed records are public. Approved members can show their consented public profile fields.
4. Click Demo member, then Verify selected profile. Enter a synthetic class reference and submit.
5. Sign out and choose Demo admin. In Review desk, inspect the private identity claim. Enter a reason and tick both verification checkboxes before approving.
6. Return as Demo member. The dashboard shows identity approval and a notification. Click Register / Edit my profile. The verified original record fills the available fields. Check everything, fill remaining details and consent, then submit.
7. Return as Demo admin and approve the completed member profile. Return as Demo member to share stories or request guidance.

A name/year match is discovery, not authentication. An administrator must independently verify ownership against trusted association records. Selecting a public result never exposes that person's private original data. Competing claims cannot link a record to two accounts.

## New students and alumni

Choose No, register me, sign in, and complete the form. Select Current student or Alumni. Students supply their current class; alumni supply their Dakhil year. Enter verification details, career interests and the remaining profile fields. Public phone and mentoring are optional opt-ins. Submit for review and return after approval. Publication remains subject to consent and independent review.

## Career guidance

1. As an approved Demo member, find Demo Career Mentor under Career guidance. Search Computing or Teaching.
2. Request an appointment with a topic, message, future local date/time and time zone. The stored timestamp is UTC.
3. Sign out and choose Demo mentor. The dashboard shows a notification and the private request.
4. Accept or decline. Return as Demo member and click Refresh to see the response and notification.
5. The requester can cancel pending or accepted appointments. Duplicate pending requests to the same mentor are blocked. Each requester has a five-request daily limit.

Notifications are inside the website and refresh when signing in or clicking Refresh. This release does not send email, SMS, browser push notifications or calendar invitations. There is no automatic conflict detection against external calendars.

## Real database activation

The original Excel source contains 133 named records. It is not included in public code. Keep the original unchanged.

1. Open the XLSX in Google Sheets and save a native Google Sheets copy. Keep it private and do not reorder its source rows.
2. Create a separate private application spreadsheet. Set SPREADSHEET_ID to that ID and LEGACY_SOURCE_ID to the source copy ID in Apps Script properties.
3. Replace Code.gs with database/Code.js, run setup to create all eight data tables, then importLegacySource. The supplied unchanged source should yield 133 named records.
4. Configure ADMIN_EMAILS and BACKEND_SECRET, redeploy the Apps Script web app with a new version, and configure Google sign-in and Vercel environment variables using docs/SETUP.md.
5. Verify the native database's sharing remains Restricted. Give access only to designated administrators. Run a real member test and test production headers before public launch.

For an existing configured backend, replace Code.gs, run setup again to add Claims, Appointments and Notifications without deleting existing rows, then redeploy. The import skips already imported rows from the same unchanged source copy.

## Updating the code

scripts/apply-update.sh checks a clean main branch and the expected repository before copying files, testing, committing and pushing. It accepts the original release or an unchanged copy of the preceding registration package, and stops if the repository contains other changes; newer changes need reconciliation. Do not force-push or overwrite a newer checkout. API and vercel.json are included in this update.

## Validation

16 automated tests passed. Browser demo verified empty-input search, selecting a record, submitting a claim, admin identity approval, member notification and private prefilled registration. Appointment authorization and privacy were verified by automated tests. Mobile visual QA and live Google sign-in, Drive import, deployed security headers and multi-user load tests remain pending.

## Simplified registration update

Google name and verified email are offered from the existing sign-in token. No Gmail inbox, contacts, employment or education access is requested. A verified legacy record or previously saved profile takes precedence over Google name. Email is read-only in the form and comes from the server-verified identity.

Dakhil, Alim and Fazil year lists cover every year from 1993 through 2026, newest first. Alim and Fazil can be left blank. Alumni must select a Dakhil year. Current students select a current class and may leave Dakhil blank. Historical imported years outside this requested range must be reviewed before saving; they are not silently converted.

Profession, stream, current position and career interests have suggestions but accept custom text. Current position has examples such as Assistant Teacher or Doctor. Institute / organization name has an example placeholder and accepts the member's own institution. Examples are never saved as defaults. Optional family and address fields are collapsed. Employment information appears in the approved public profile.

Typed details stay in memory while signed in and survive closing and reopening the form. They are cleared on sign-out or page reload. Only Submit saves to the backend. This avoids leaving personal information in local storage on shared computers.

Test as Demo member using No, register me: Google name should prefill as Demo Google Member, with member@example.test displayed privately. Change the name, choose years, type a custom position and institution, close and reopen the form, then submit and inspect from Demo admin. Check that example placeholders never become stored values. Seventeen backend/API tests and JavaScript syntax checks pass; the new form's live Google sign-in and mobile visual checks remain pending.
