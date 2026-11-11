#!/usr/bin/env bash
set -euo pipefail
source_dir="$(cd "$(dirname "$0")/.." && pwd)"
target_dir="${1:?Usage: bash scripts/apply-update.sh /path/to/existing/git/clone}"
cd "$target_dir"
git rev-parse --is-inside-work-tree >/dev/null
if [[ -n "$(git status --porcelain)" ]]; then
  echo 'Your clone has local changes. Commit or save them before applying this update.' >&2
  exit 1
fi
remote_url="$(git remote get-url origin)"
case "$remote_url" in
  https://github.com/anfmaa/anfm-alumni-website.git|https://github.com/anfmaa/anfm-alumni-website|git@github.com:anfmaa/anfm-alumni-website.git) ;;
  *) echo 'Unexpected repository. No changes applied.' >&2; exit 1;;
esac
if [[ "$(git branch --show-current)" != main ]]; then
  echo 'Switch to main before applying this update.' >&2; exit 1
fi
git pull --ff-only
# Refuse to overwrite an unexpected release. Review newer repository changes first.
if [[ "$(git rev-parse HEAD)" != 0056d6f5272582dacac63f2d0af3707cb7d9dd71 ]]; then
 echo 'Repository changed since this update was prepared. Stop and reconcile before applying.' >&2
 exit 1
fi
for item in index.html assets api database scripts tests docs package.json README.md vercel.json; do
  cp -R "$source_dir/$item" .
done
npm ci
npm test
npm run check
git add index.html assets api database scripts tests docs package.json README.md vercel.json
git commit -m "Add navy identity, education search and protected member registration"
git push origin main
