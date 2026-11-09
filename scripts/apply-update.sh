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
if [[ "$(git rev-parse HEAD)" != a7feed91bde84a5e6ff7f74c33b29bd5d270ec6c ]]; then
  if ! shasum -a 256 -c "$source_dir/scripts/search-release.sha256" >/dev/null 2>&1 && { [[ -e assets/member-flow.js ]] || ! shasum -a 256 -c "$source_dir/scripts/previous-release.sha256" >/dev/null 2>&1; }; then
    echo 'Repository contains changes beyond the known releases. Reconcile those changes before applying this package.' >&2
    exit 1
  fi
fi
for item in index.html assets api database scripts tests docs package.json README.md vercel.json; do
  cp -R "$source_dir/$item" .
done
npm ci
npm test
npm run check
git add index.html assets api database scripts tests docs package.json README.md vercel.json
git commit -m "Simplify registration with Google prefill, year lists and profession suggestions"
git push origin main
