#!/usr/bin/env bash
set -euo pipefail
release_dir="$(cd "$(dirname "$0")/.." && pwd)"
command -v git >/dev/null || { echo 'Install Git first.'; exit 1; }
command -v npm >/dev/null || { echo 'Install Node.js 22 or newer first.'; exit 1; }
command -v rsync >/dev/null || { echo 'Install rsync first.'; exit 1; }
if command -v gh >/dev/null; then gh auth status; gh auth setup-git; fi
checkout_dir="$HOME/Documents/ANFMAA-release-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$(dirname "$checkout_dir")"
git clone https://github.com/anfmaa/anfm-alumni-website.git "$checkout_dir"
cd "$checkout_dir"
branch="$(git branch --show-current)"
source_hash="$(git hash-object index.html)"
if [ "$source_hash" != '2c6b7351b165ae7ef0e640a74ada291dc94adb3b' ]; then
  echo "The remote index.html has changed since this release was prepared. Your fresh clone is at $checkout_dir. Reconcile the changes before applying this package."
  exit 1
fi
rsync -a --exclude='.git' --exclude='node_modules' --exclude='.env' --exclude='.env.local' --exclude='.vercel' --exclude='*.zip' "$release_dir/" "$checkout_dir/"
npm ci --ignore-scripts --no-audit --no-fund
npm test
npm run check
git add index.html assets api database docs scripts tests package.json package-lock.json vercel.json README.md .gitignore .env.example
if git diff --cached --quiet; then echo 'No changes to push.'; exit 0; fi
git commit -m "Add verified alumni community, review workflows and Drive backend"
git push origin "$branch"
echo "Pushed successfully. Working copy: $checkout_dir"
echo 'Complete the Google and Vercel setup in docs/SETUP.md before enabling member services.'
