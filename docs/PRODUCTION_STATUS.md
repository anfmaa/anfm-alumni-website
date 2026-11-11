# Production setup status

The production database is private and owned by anfmalumnia@gmail.com.
Database ID: 13jNY3FNllr37vNexjibiBQOMBU1jGA0pgl0e_Ti2soQ
Imported Legacy records: 133. Original responses retained. Do not import them again.

Backend project created under association account:
106kcAHD1v9RP-Js2xFzBbDH3_4-v4spkFYlOeOJRFZnI9k-0CGcWRu0C
This project still needs the current database/Code.js uploaded and deployment.

Apps Script properties:
SPREADSHEET_ID: production database ID above
ADMIN_EMAILS: anfmalumnia@gmail.com
BACKEND_SECRET: generate privately and share only with Vercel server configuration

Vercel production variables still required:
GOOGLE_CLIENT_ID
APPS_SCRIPT_URL
BACKEND_SECRET
SITE_ORIGIN=https://anfmaa.vercel.app

Do not commit member data, OAuth tokens or backend secrets to Git.
19 backend tests passed. Live Google sign-in and real database search still require deployment verification.
