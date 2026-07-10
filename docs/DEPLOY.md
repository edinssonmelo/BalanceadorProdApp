# Despliegue — Balanceador demo (ai-server)

Dominio: **https://demo-balanceador.rootoz.com**

## Arquitectura (igual que otras apps Rootoz)

```text
Internet → Cloudflare → cloudflared → Traefik :80 → balanceador-demo-web :3000
```

- **Repo en servidor:** `/srv/apps/balanceador-demo`
- **Compose:** `docker compose -p balanceador-demo`
- **Red Docker:** `net_internal` (externa, creada por infra)
- **Proxy:** labels Traefik en `docker-compose.yml`

## Requisitos en el servidor

1. Infra activa (`make up` en `/srv/apps/infra`)
2. Red `net_internal` existente
3. Hostname `demo-balanceador.rootoz.com` en Cloudflare Tunnel → Traefik

## Despliegue manual (rápido)

```bash
ssh ai-server
cd /srv/apps/balanceador-demo
git pull origin main
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

El script hace `git reset --hard`, build Docker con **caché BuildKit** (capas + `.next/cache`) y `up -d`.

Rebuild completo forzado: `NO_CACHE=1 ./scripts/deploy.sh`

## CI/CD con GitHub Actions

### Flujo en push a `main` (optimizado)

| Paso | Dónde | Qué hace | ~Tiempo |
|------|-------|----------|---------|
| 1. Tests (gate) | GitHub cloud | `npm ci` + `npm test` | ~30–45 s |
| 2. Deploy | Runner ai-server | `git pull` + Docker build con caché + restart | ~1–3 min |

**Antes:** CI duplicado en cloud (~1 min) + gate con build (~1 min) + Docker `--no-cache` (~3–5 min) → **~5–8 min**.

**Ahora:** un gate ligero + un solo build en servidor con caché → **~2–4 min** típico.

En **pull requests** sigue corriendo CI completo (`npm test` + `npm run build`) sin desplegar.

### Alternativas (si necesitas más velocidad)

| Modo | Tiempo | Trade-off |
|------|--------|-----------|
| **Actual (recomendado)** | ~2–4 min | Gate de tests en cloud + build Docker en servidor con caché |
| **Solo self-hosted** | ~1–3 min | Quitar gate cloud; tests solo en servidor antes del build (`DEPLOY_GATE=skip`) |
| **Imagen preconstruida (GHCR)** | ~30–60 s en servidor | Build en GitHub, `docker pull` en ai-server; más infra (registry, secrets) |
| **Rebuild completo** | +2–4 min | `NO_CACHE=1 ./scripts/deploy.sh` si sospechas caché corrupta |

### Deploy (elegir un modo)

| Variable | Valor | Uso |
|----------|-------|-----|
| `DEPLOY_SELF_HOSTED` | `true` | Runner en ai-server (recomendado) |
| `DEPLOY_VIA_SSH` | `true` | SSH desde GitHub (host público o túnel) |

**Self-hosted (recomendado — ya configurado en ai-server):**

1. Variable de repo: `DEPLOY_SELF_HOSTED=true` (Settings → Actions → Variables)
2. Runner: `ai-server-balanceador` en `/srv/actions-runner/balanceador-prod-app`
3. Servicio systemd: `actions.runner.edinssonmelo-BalanceadorProdApp.ai-server-balanceador.service`
4. Push a `main` → CI en GitHub + deploy en el runner del servidor

**Registrar runner de nuevo** (solo si se reinstala el servidor):

```bash
# En tu máquina: token de un solo uso (~1 h)
gh api --method POST repos/edinssonmelo/BalanceadorProdApp/actions/runners/registration-token --jq .token

# En ai-server (como edsun):
TOKEN=<pegar> bash /srv/apps/balanceador-demo/scripts/github-actions-runner-setup.sh
```

O copiar `scripts/github-actions-runner-setup.sh` del repo y ejecutarlo con `TOKEN`.

**SSH alternativo:**

Secrets: `DEPLOY_SSH_HOST`, `DEPLOY_SSH_USER`, `DEPLOY_SSH_KEY`  
Variable: `DEPLOY_VIA_SSH=true`

## Estilos / CSS 404 tras deploy

Next.js genera hashes nuevos en cada build (`/_next/static/css/XXXX.css`). Si el navegador o Cloudflare guardan HTML viejo, aparece 404 en CSS.

**Solución en este repo:**

- `output: 'standalone'` en `next.config.ts` (Docker copia `.next/static`)
- Headers `Cache-Control: no-store` en páginas HTML
- `docker compose up -d` recrea el contenedor si la imagen cambió

Si persiste en el navegador: recarga forzada (Ctrl+Shift+R) o limpiar caché del sitio.  
Si el CSS sigue roto tras deploy: `NO_CACHE=1 ./scripts/deploy.sh`.

## Verificación post-deploy

```bash
# Contenedor arriba
docker ps | grep balanceador

# CSS responde 200
curl -sI https://demo-balanceador.rootoz.com/_next/static/css/$( \
  curl -s https://demo-balanceador.rootoz.com/plan/nueva | grep -o '_next/static/css/[^"]*\.css' | head -1 | sed 's|_next/static/css/||' \
)
```

## Datos demo (localStorage)

Los datos viven en el navegador del usuario, no en el servidor.  
En **Configuración → Datos demo** puedes exportar, importar o reiniciar.
