#!/usr/bin/env bash
# Despliegue en ai-server — ejecutar desde /srv/apps/balanceador-demo
set -euo pipefail

APP_DIR="${APP_DIR:-/srv/apps/balanceador-demo}"
BRANCH="${BRANCH:-main}"
COMPOSE_PROJECT="${COMPOSE_PROJECT:-balanceador-demo}"

cd "$APP_DIR"

echo "==> Fetch $BRANCH"
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git reset --hard "origin/$BRANCH"

echo "==> Build & restart container"
docker compose -p "$COMPOSE_PROJECT" build --no-cache web
docker compose -p "$COMPOSE_PROJECT" up -d --force-recreate web

echo "==> Health check"
sleep 3
docker compose -p "$COMPOSE_PROJECT" ps
docker exec balanceador-demo-web wget -qO- http://127.0.0.1:3000/plan/nueva >/dev/null \
  && echo "Health OK: /plan/nueva responde"

echo "==> Deploy OK"
