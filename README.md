# ANFMAA community website

Green and cream alumni website for https://anfmaa.vercel.app, with code in https://github.com/anfmaa/anfm-alumni-website.

## What is included

Member-owned profiles with Google sign-in, independent alumni verification, a public directory with search and blood-group filtering, achievement stories, blood requests, fundraising information, community campaigns, sharing, moderator review, admin featuring and moderator assignment. Published edits return to review. Closed or expired requests disappear from the public feed. Each image requires a visible source credit. The existing committee structure and draft constitution are preserved.

The top strip contains only the Official Website link. The footer credits @anfmaa. The supplied campus image and logo are bundled locally with visible Drive source links. Main navigation has an English/Bangla switch; forms include bilingual labels. Some administrative messages and the retained constitution are not fully translated.

## Architecture

GitHub stores source code. Vercel serves the site and the server API. Google verifies sign-in tokens on the server. The server forwards authenticated identities to Apps Script with a private shared secret. Apps Script keeps member, post, report and audit records in a private Google Sheet in Drive and enforces permissions. Members have separate records in one shared database, not separate spreadsheets.

No passwords, account records or API secrets belong in GitHub. The browser keeps the sign-in token in memory only; reload requires sign-in again. There is no payment gateway or card collection. Vercel's normal HTTPS remains enabled; there is no separate SSL purchase or integration.

## Status

Source implementation and local backend tests completed. Live Google authentication, deployed Apps Script, Vercel production and real-user acceptance tests require the configuration in docs/SETUP.md. A Git push alone does not configure these services. The public member directory intentionally starts empty, rather than publishing private spreadsheet records or invented members.

## Run

Use Node 22 or newer. Run `npm ci`, `npm test`, and `npm run check`. `npm run dev` starts a layout preview with member services explicitly unavailable. It is not the production API. Use Vercel with the documented environment variables for the full application.

## Publish

Read docs/SETUP.md, then run `bash scripts/push-update.sh` from the extracted package. This clones the existing repository into a fresh timestamped folder, checks that its original index.html matches the source used for this update, copies this release, tests it, commits it and pushes normally. It never force pushes. It stops if the repository has changed since preparation.

The script uses your currently authenticated GitHub account. That account must have write access to anfmaa/anfm-alumni-website. See docs/SETUP.md for the previous 403 credential issue.

## Operational guidance

Read docs/COMMUNITY_OPERATIONS.md before admitting members. Keep member response files and backups restricted. Do not put the private spreadsheet in a publicly shared image folder.

## November registration update

Start with docs/REGISTRATION_TEST.md for the local member/admin demo and private source import. Use scripts/apply-update.sh for this release, not the older push-update.sh. The 133 legacy member records are not bundled in the public code.

## Name search and counselling update

Use docs/REGISTRATION_TEST.md for the revised no-ID onboarding demo. Use docs/SECURITY_AND_CAPACITY.md for the source audit, external-service disclosures and live setup limits. No deployment or real-data import has been performed by this package.
