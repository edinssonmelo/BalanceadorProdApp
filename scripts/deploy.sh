#!/usr/bin/env bash
# Despliegue en ai-server — ejecutar desde /srv/apps/balanceador-demo
set -euo pipefail

APP_DIR="${APP_DIR:-/srv/apps/balanceador-demo}"
BRANCH="${BRANCH:-main}"
COMPOSE_PROJECT="${COMPOSE_PROJECT:-balanceador-demo}"
NO_CACHE="${NO_CACHE:-0}"

export DOCKER_BUILDKIT="${DOCKER_BUILDKIT:-1}"
export COMPOSE_DOCKER_CLI_BUILD="${COMPOSE_DOCKER_CLI_BUILD:-1}"

cd "$APP_DIR"

echo "==> Fetch $BRANCH"
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git reset --hard "origin/$BRANCH"

echo "==> Build & restart container (BuildKit cache)"
BUILD_ARGS=()
if [[ "$NO_CACHE" == "1" ]]; then
  BUILD_ARGS+=(--no-cache)
  echo "    (NO_CACHE=1 — rebuild completo)"
fi

docker compose -p "$COMPOSE_PROJECT" build "${BUILD_ARGS[@]}" web
docker compose -p "$COMPOSE_PROJECT" up -d web

echo "==> Health check"
sleep 2
docker compose -p "$COMPOSE_PROJECT" ps
docker exec balanceador-demo-web wget -qO- http://127.0.0.1:3000/plan/nueva >/dev/null \
  && echo "Health OK: /plan/nueva responde"

echo "==> Deploy OK"
