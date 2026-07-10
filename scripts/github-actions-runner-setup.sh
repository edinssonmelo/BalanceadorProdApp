#!/usr/bin/env bash
# Registro one-shot del self-hosted runner para BalanceadorProdApp en ai-server.
# Uso (en ai-server, como edsun):
#   TOKEN=<registration-token de GitHub> ./scripts/github-actions-runner-setup.sh
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/edinssonmelo/BalanceadorProdApp}"
RUNNER_NAME="${RUNNER_NAME:-ai-server-balanceador}"
RUNNER_LABELS="${RUNNER_LABELS:-ai-server,balanceador}"
RUNNER_DIR="${RUNNER_DIR:-/srv/actions-runner/balanceador-prod-app}"
RUNNER_USER="${RUNNER_USER:-edsun}"
TARBALL="${TARBALL:-/srv/actions-runner/odoo-managed-platform/actions-runner-linux-x64-2.334.0.tar.gz}"

if [[ -z "${TOKEN:-}" ]]; then
  echo "ERROR: export TOKEN con el registration token de GitHub (Settings → Actions → Runners → New)."
  exit 1
fi

mkdir -p "$RUNNER_DIR"
cd "$RUNNER_DIR"

if [[ ! -f config.sh ]]; then
  tar xzf "$TARBALL"
fi

if [[ -f .runner ]]; then
  echo "Runner ya registrado en $RUNNER_DIR"
  cat .runner
else
  ./config.sh \
    --url "$REPO_URL" \
    --token "$TOKEN" \
    --unattended \
    --name "$RUNNER_NAME" \
    --labels "$RUNNER_LABELS"
fi

sudo ./svc.sh install "$RUNNER_USER"
sudo ./svc.sh start
sudo ./svc.sh status
