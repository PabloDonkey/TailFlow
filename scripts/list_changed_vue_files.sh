#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<'EOF'
Usage: list_changed_vue_files.sh [--base-ref <ref>] [--committed-only] [--absolute]

Lists changed .vue files for the current branch in a deterministic way.

Behavior:
- compares committed branch changes against the merge-base with the base ref
- optionally includes staged, unstaged, and untracked .vue files (default)
- prints one file per line, sorted and deduplicated

Options:
  --base-ref <ref>   Base branch/ref to compare against.
  --committed-only   Only include committed branch changes.
  --absolute         Print absolute file paths.
  --help             Show this help message.
EOF
}

BASE_REF=""
COMMITTED_ONLY="false"
ABSOLUTE="false"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --base-ref)
      BASE_REF="${2:-}"
      if [[ -z "$BASE_REF" ]]; then
        echo "Missing value for --base-ref" >&2
        exit 1
      fi
      shift 2
      ;;
    --committed-only)
      COMMITTED_ONLY="true"
      shift
      ;;
    --absolute)
      ABSOLUTE="true"
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "$REPO_ROOT" ]]; then
  echo "Not inside a git repository." >&2
  exit 1
fi

cd "$REPO_ROOT"

resolve_default_base_ref() {
  local remote_head

  remote_head="$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD 2>/dev/null || true)"
  if [[ -n "$remote_head" ]]; then
    echo "${remote_head#origin/}"
    return
  fi

  if git show-ref --verify --quiet refs/heads/main; then
    echo "main"
    return
  fi

  if git show-ref --verify --quiet refs/remotes/origin/main; then
    echo "origin/main"
    return
  fi

  if git show-ref --verify --quiet refs/heads/master; then
    echo "master"
    return
  fi

  if git show-ref --verify --quiet refs/remotes/origin/master; then
    echo "origin/master"
    return
  fi

  echo "HEAD"
}

resolve_ref() {
  local ref="$1"

  if git rev-parse --verify --quiet "$ref^{commit}" >/dev/null; then
    echo "$ref"
    return
  fi

  if git rev-parse --verify --quiet "origin/$ref^{commit}" >/dev/null; then
    echo "origin/$ref"
    return
  fi

  echo "Unable to resolve base ref: $ref" >&2
  exit 1
}

BASE_REF="${BASE_REF:-$(resolve_default_base_ref)}"
RESOLVED_BASE_REF="$(resolve_ref "$BASE_REF")"
MERGE_BASE="$(git merge-base HEAD "$RESOLVED_BASE_REF")"

TMP_FILE="$(mktemp)"
trap 'rm -f "$TMP_FILE"' EXIT

git diff --name-only --diff-filter=ACMR "$MERGE_BASE...HEAD" -- ':(glob)**/*.vue' >> "$TMP_FILE"

if [[ "$COMMITTED_ONLY" != "true" ]]; then
  git diff --name-only --diff-filter=ACMR -- ':(glob)**/*.vue' >> "$TMP_FILE"
  git diff --cached --name-only --diff-filter=ACMR -- ':(glob)**/*.vue' >> "$TMP_FILE"
  (git ls-files --others --exclude-standard | grep -E '\.vue$' || true) >> "$TMP_FILE"
fi

sort -u "$TMP_FILE" | while IFS= read -r file_path; do
  [[ -z "$file_path" ]] && continue
  [[ ! -f "$file_path" ]] && continue

  if [[ "$ABSOLUTE" == "true" ]]; then
    printf '%s/%s\n' "$REPO_ROOT" "$file_path"
  else
    printf '%s\n' "$file_path"
  fi
done