#!/usr/bin/env bash
# One-shot DB setup: create aimlbms, apply main schema + extended (alarm_evidence, explanations).
# Run from repo root: ./backend/scripts/setup_mysql.sh
# Or from backend: ./scripts/setup_mysql.sh
# Env: MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DB (or load from backend/.env)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$BACKEND_DIR/.." && pwd)"
DB_DIR="$REPO_ROOT/db"

if [ -f "$BACKEND_DIR/.env" ]; then
  set -a
  # shellcheck source=/dev/null
  . "$BACKEND_DIR/.env"
  set +a
fi

MYSQL_HOST="${MYSQL_HOST:-localhost}"
MYSQL_PORT="${MYSQL_PORT:-3306}"
MYSQL_USER="${MYSQL_USER:-root}"
MYSQL_PASSWORD="${MYSQL_PASSWORD:-12345}"
MYSQL_DB="${MYSQL_DB:-aimlbms}"

echo "[1/4] Create database if not exists..."
mysql -h "$MYSQL_HOST" -P "$MYSQL_PORT" -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" \
  -e "CREATE DATABASE IF NOT EXISTS $MYSQL_DB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

echo "[2/4] Apply main schema (vehicle, telemetry_*, alarm_event, ml_run, ...)..."
mysql -h "$MYSQL_HOST" -P "$MYSQL_PORT" -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DB" \
  < "$DB_DIR/DB_SCHEMA_MYSQL.sql"

echo "[3/4] Apply extended schema (alarm_evidence, explanations)..."
mysql -h "$MYSQL_HOST" -P "$MYSQL_PORT" -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DB" \
  < "$DB_DIR/DB_SCHEMA_MYSQL_EXTENDED.sql"

echo "[4/4] Done. DB: $MYSQL_DB"
