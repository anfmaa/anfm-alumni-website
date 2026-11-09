# Deployment and account setup

## 1. Private database in Drive

Use the association-owned Google account. Create a new private Google Sheet named ANFMAA Community Database. Do not share it publicly or place it in a folder whose public permissions expose its records.

The supplied folder is https://drive.google.com/drive/folders/159hYnehit2esOlurT64ytnSFW_aNNoI_. It contains a member-response Excel file and a Story images folder. Keep the response file as the existing source of verification, with restricted access. The code does not import it into public profiles. Members sign in and submit their own profiles; reviewers compare those submissions with the existing records. This avoids binding accounts by an unverified typed email or publishing phone numbers without consent.

The Story images folder is https://drive.google.com/drive/folders/1Nobvt-DUqbbcudIeF8Ruy5VUFI0aBqqm. Only images approved for public display should be kept publicly accessible.

Open the private database spreadsheet, then Extensions > Apps Script. Paste database/Code.js into Code.gs. In Project Settings > Script properties add:

* Property: Value
* SPREADSHEET_ID: The new private spreadsheet ID
* BACKEND_SECRET: A random secret generated with `openssl rand -hex 32`
* ADMIN_EMAILS: Comma-separated exact Google email addresses of the designated administrators
* BACKUP_FOLDER_ID: Optional private backup folder ID

Keep the secret out of source code and chat. Run `setup()` once and authorize spreadsheet access. It creates Members, Posts, Audit and Reports sheets. Do not rename the headers or edit JSON cells manually.

Use at least two designated reviewers during initial setup. An administrator can sign in and review profiles without an approved personal profile, but nobody can approve their own profile. A second administrator can approve the first administrator's submitted alumni profile. Administrators are assigned only through Script properties; the website can assign or remove moderator roles for approved members.

Deploy > New deployment > Web app. Execute as the association owner and allow Anyone to reach the endpoint. Requests without the secret are rejected; the endpoint must remain reachable by Vercel. Copy the /exec deployment URL. After code changes, update the deployment to a new version.

## 2. Google sign-in

In Google Cloud Console, configure a Google Auth Platform project and a Web application OAuth client. Add https://anfmaa.vercel.app as an authorized JavaScript origin. Use the same exact origin as SITE_ORIGIN below. Configure the application name, support contact, authorized domain and the site's privacy information. If the consent setup is in testing, add the test users; complete the applicable production setup before admitting everyone.

Copy the web client ID. A client secret is not required for the ID-token flow used here.

## 3. Vercel

Keep the existing GitHub-linked Vercel project. Select Other as the framework preset, leave the build command and output directory unset, and let Vercel install package dependencies. The root index.html is the static entry point and api/community.js is the server function. Use Node 22 or a supported newer runtime.

Set Production environment variables:

* Variable: Value
* GOOGLE_CLIENT_ID: The web client ID
* APPS_SCRIPT_URL: The deployed /exec URL
* BACKEND_SECRET: Exactly the same secret as Apps Script
* SITE_ORIGIN: https://anfmaa.vercel.app

Do not prefix secrets with a public-exposure prefix. Redeploy after changing environment variables. The exact origin check means a preview URL needs its own matching configuration and Google authorized origin. Do not weaken this check to a wildcard.

## 4. Push the ZIP release from a Mac

Download ANFMAA_Community_Release.zip to Downloads. Run:

```bash
cd "$HOME/Downloads"
unzip ANFMAA_Community_Release.zip
cd anfm-alumni-website
bash scripts/push-update.sh
```

If GitHub reports 403, run `gh auth status`. The active account needs write access to the anfmaa repository. If anfmaa is already signed in, use `gh auth switch --user anfmaa` and `gh auth setup-git`. Otherwise use `gh auth login --hostname github.com --git-protocol https --web` and sign in with the authorized account, then `gh auth setup-git`. Do not paste a password or token into a command.

The push script performs npm ci, tests and syntax checks before committing. It uses a fresh clone, so your existing local project is untouched. If the remote source changed, it stops for reconciliation rather than overwriting newer work.

## 5. Launch acceptance checks

1. Anonymous visitor can browse approved content but cannot submit or read private fields.
2. A new member signs in and submits a profile. The member cannot post before approval.
3. Another reviewer approves the profile, recording a reason and no conflict declaration.
4. The member submits each of the four post types. None is visible before approval.
5. Approve a story and open its shared URL while signed out. Check Facebook and system share links.
6. Edit the story. It disappears until independently approved again.
7. Test optional contact consent, report resolution, featuring, moderator assignment, closure and expiry.
8. Check an image's displayed source link and credit.
9. Test on a phone and a desktop. Confirm the Google sign-in popup works on the actual deployed origin.
10. Confirm the private spreadsheet and backups are not accessible to anonymous visitors.

Automated tests use an in-memory Apps Script data adapter. They do not substitute for the live checks above.

## 6. Backups

Set BACKUP_FOLDER_ID to a private Drive folder, then run backup() manually. Optionally create an Apps Script time-driven trigger yourself after choosing a retention policy. No recurring backup trigger has been created by this release. Backups are full copies with personal information; retain and delete them under the association's policy. Test restoration to a separate spreadsheet before replacing a live database.

## Known boundaries

Google Sheets is suitable for a small association but has quotas and limited throughput. This implementation reads whole tables and serializes operations with a script lock. Monitor latency and migrate to a transactional database if volume grows. Audit entries are not cryptographically immutable and multiple sheet writes are not a transaction. An administrator with spreadsheet access can alter records.

Images in posts use public HTTPS URLs and credited source URLs. This release does not upload files into Drive from the browser. The bundled campus image and logo work without Drive embedding. Social sharing opens a stable post link, but platforms may show the general site preview rather than a post-specific image because posts render in the browser.

Privacy deletion is an administrator-assisted process. Profile withdrawal removes public visibility but does not erase private audit records. Member edits temporarily return the profile to pending verification.

## Official technical references

Google server-side ID-token verification: https://developers.google.com/identity/gsi/web/guides/verify-google-id-token

Google client setup: https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid

Apps Script web apps: https://developers.google.com/apps-script/guides/web
