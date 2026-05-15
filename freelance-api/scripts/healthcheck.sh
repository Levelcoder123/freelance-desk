#!/usr/bin/env bash
set -euo pipefail

APP_ENV="${1:?usage: healthcheck.sh <staging|production>}"

if [ "$APP_ENV" = "staging" ]; then
  BASE_URL="https://staging.yourdomain.com"
else
  BASE_URL="https://api.yourdomain.com"
fi

echo "==> Smoke testing $BASE_URL"

check() {
  local path="$1"
  local expected="$2"
  local status
  status=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}${path}")
  if [ "$status" != "$expected" ]; then
    echo "FAIL  $path → HTTP $status (expected $expected)"
    exit 1
  fi
  echo "OK    $path → $status"
}

check "/health"              200
check "/api/v1/auth/login"   400   # no body → 400, not 404
check "/api/v1/nonexistent"  404

echo "==> All checks passed"
