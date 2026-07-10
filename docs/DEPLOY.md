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

El script hace `git reset --hard`, rebuild sin caché y `--force-recreate` del contenedor.

## CI/CD con GitHub Actions

### 1. CI (automático)

Cada push/PR a `main` ejecuta `npm ci` + `npm run build`.

### 2. Deploy (elegir un modo)

| Variable | Valor | Uso |
|----------|-------|-----|
| `DEPLOY_SELF_HOSTED` | `true` | Runner en ai-server (recomendado) |
| `DEPLOY_VIA_SSH` | `true` | SSH desde GitHub (host público o túnel) |

**Self-hosted (recomendado):**

1. En GitHub → repo → Settings → Actions → Runners → New self-hosted
2. En ai-server, registrar runner para **este repo** (no solo infra)
3. Activar variable `DEPLOY_SELF_HOSTED=true`
4. Push a `main` → build + deploy automático

**SSH alternativo:**

Secrets: `DEPLOY_SSH_HOST`, `DEPLOY_SSH_USER`, `DEPLOY_SSH_KEY`  
Variable: `DEPLOY_VIA_SSH=true`

## Estilos / CSS 404 tras deploy

Next.js genera hashes nuevos en cada build (`/_next/static/css/XXXX.css`). Si el navegador o Cloudflare guardan HTML viejo, aparece 404 en CSS.

**Solución en este repo:**

- `output: 'standalone'` en `next.config.ts` (Docker copia `.next/static`)
- Headers `Cache-Control: no-store` en páginas HTML
- Deploy con `--force-recreate` y rebuild completo

Si persiste en el navegador: recarga forzada (Ctrl+Shift+R) o limpiar caché del sitio.

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
