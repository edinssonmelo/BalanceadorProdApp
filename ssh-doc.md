### `docs/server/architecture.md`

``````markdown
# Arquitectura — ai-server

Servidor personal/empresarial (`192.168.1.42`, SSH `ai-server`). Ubuntu 24.04, usuario operativo `edsun`.

## Flujo de tráfico

```text
Internet → Cloudflare (HTTPS) → cloudflared → Traefik :80 → servicios internos
```

- **Cloudflare Tunnel:** token en `.env` (`CLOUDFLARE_TUNNEL_TOKEN`). Hostnames en Zero Trust apuntan a `http://traefik:80`.
- **Traefik:** enruta por `Host()` hacia contenedores en `net_internal`.
- **Redes Docker:** `net_internal` (proxy + apps), `net_data` (Postgres, Redis, n8n).

## Qué corre dónde

| Sistema | Runtime | Repo / plantillas |
|---------|---------|-------------------|
| Infra (proxy, datos, n8n) | Docker (`COMPOSE_PROJECT_NAME=infra`) | `/srv/apps/infra` (este repo) |
| Hermes (asistentes) | Host, systemd user (`hermes-gateway-*.service`) | Plantillas `config/hermes/`; datos `/srv/data/hermes/` |
| Odoo | Docker en `/opt/odoo-platform` | Repo separado `odoo-managed-platform` |
| Datos runtime | `/srv/data/` | No versionado |

## Stack Docker activo (`make up`)

- `compose/proxy.yml` — Traefik + cloudflared
- `compose/data.yml` — Postgres + Redis
- `compose/core.yml` — placeholder de redes (sin servicios propios)
- `compose/automation.yml` — n8n

## Hermes

Tres gateways activos: `edsun-ceo`, `tatiana-ceo`, `edsun-dev`. CLI en `/home/edsun/.hermes/hermes-agent/`. Cada perfil tiene `HERMES_HOME` bajo `/srv/data/hermes/<perfil>/`.

Documentación: [docs/hermes/](../hermes/).

## Fuera de este repo

- Código Odoo y addons
- Secretos (`.env`, tokens, sesiones)
- Backups y bases de datos
- Conocimiento personal (`~/projects/` en el servidor)

## Retirado (2026-06)

OpenClaw, Clawbot, Evolution API y datos en `/srv/data/openclaw` / `/srv/data/clawbot` fueron eliminados del runtime. Backup: `/srv/data/backups/legacy-removal/` en el servidor.

``````

### `docs/server/sources-of-truth.md`

``````markdown
# Fuentes de verdad

## Infraestructura

- **Repo:** `/srv/apps/infra` (clon de `Infraestructura-Base-Servidor-Edinsson`)
- **Uso:** proxy, túnel, scripts, docs, plantillas Hermes (sin secretos)

## Hermes runtime

- **Ruta:** `/srv/data/hermes/`
- **Uso:** datos vivos de asistentes, memorias, sesiones, `.env`, logs
- **Plantillas en repo:** `config/hermes/profiles/<perfil>/`

## Odoo

- **Repo:** separado (`odoo-managed-platform` en `/opt/odoo-platform`)
- **Uso:** plataforma Odoo, addons, clientes, tenants

## Productos / apps

Cada producto debe tener su propio repo. Infra solo documenta cómo exponerlo o desplegarlo (dominio, Traefik, túnel).

## Datos

- **Ruta:** `/srv/data/`
- **No se versiona** (Postgres, Redis, n8n, archivos Hermes, etc.)

## Conocimiento personal

- **Ruta:** `~/projects/` (en el servidor)
- **Uso:** Rootoz, personal, decisiones, aprendizaje

## Secretos

- **Ruta:** `.env` en repo (local/servidor), `secrets/` (plantilla + README), tokens en runtime Hermes
- **Nunca** en git

``````

### `docs/server/ssh-access.md`

``````markdown
# Acceso SSH — ai-server

Documentación operativa **sin secretos**. Host lógico: **`ai-server`** (alias en `~/.ssh/config` del Mac).

## Conectar

```bash
ssh ai-server
```

- **Usuario:** `edsun`
- **Autenticación:** clave SSH (p. ej. `~/.ssh/id_ed25519` en el Mac)
- **Red:** LAN privada (`192.168.x.x` estática en el servidor; actualizar netplan y `~/.ssh/config` si cambia)

Antes de `make` o `docker compose`:

```bash
cd /srv/apps/infra
```

## Stack activo (infra)

| Componente | Compose / comando |
|------------|-------------------|
| Traefik + cloudflared | `compose/proxy.yml` |
| Postgres + Redis | `compose/data.yml` |
| n8n | `compose/automation.yml` |
| Arranque | `make up` / `make status` |

**Hermes** corre en el **host** (systemd user), no en Docker. Datos: `/srv/data/hermes/{edsun-dev,edsun-ceo,tatiana-ceo,scrape}`.

**Odoo** vive fuera de este repo: `/opt/odoo-platform` (repo separado).

Ver [architecture.md](architecture.md) y [sources-of-truth.md](sources-of-truth.md).

## Variables sensibles (solo en servidor)

| Archivo | Uso |
|---------|-----|
| `/srv/apps/infra/.env` | `DOMAIN`, `CLOUDFLARE_TUNNEL_TOKEN`, contraseñas Postgres init |
| `/srv/apps/infra/.env.n8n` | n8n + Postgres (plantilla: `.env.n8n.example`) |
| `/srv/data/hermes/<perfil>/.env` | API keys y Telegram por asistente |

**No** versionar ni pegar en chats.

## Operación diaria

```bash
ssh ai-server 'cd /srv/apps/infra && make status'
ssh ai-server 'cd /srv/apps/infra && make up'
ssh ai-server 'cd /srv/apps/infra && make tunnel-logs'
```

Hermes:

```bash
ssh ai-server 'cd /srv/apps/infra && git pull && make hermes-apply-profile-config'
ssh ai-server 'systemctl --user status hermes-gateway-*.service'
```

PATH del CLI si hace falta:

```bash
export PATH="/home/edsun/.hermes/hermes-agent/venv/bin:$PATH"
```

## CI/CD (GitHub Actions)

Workflow: `.github/workflows/deploy.yml`. Push a **`main`** → `git reset --hard origin/main` + `make deploy-apply` en `/srv/apps/infra`.

Modo recomendado: **runner self-hosted** en el servidor (`DEPLOY_SELF_HOSTED=true`). Registro: `scripts/github-actions-runner-setup.sh` (token de un solo uso desde GitHub UI).

Alternativa: `DEPLOY_VIA_SSH=true` con secretos `DEPLOY_SSH_HOST`, `DEPLOY_SSH_USER`, `DEPLOY_SSH_KEY` en GitHub (clave privada **solo** en Secrets, nunca en repo).

## Git — remotos por cuenta (Mac)

| Ámbito | Host SSH en `~/.ssh/config` |
|--------|----------------------------|
| Personal (`edinssonmelo/*`) | `github-edinssonmelo` |
| Trabajo (banco) | `github-emelo-cib` |

El servidor usa su propia deploy key para `git@github.com` (repo infra).

``````

### `docs/server/workflow.md`

``````markdown
# Flujo de trabajo

## Cambios de infraestructura

1. Abrir repo infra en Cursor (rama de trabajo, no `main` directo para cambios grandes).
2. Modificar `docs/`, `scripts/`, `compose/` según necesidad.
3. Commit y revisión.
4. Merge a `main` → GitHub Actions ejecuta `make deploy-apply` en `/srv/apps/infra`.

## Cambios de Odoo

1. Abrir repo Odoo (`odoo-managed-platform`).
2. No mezclar con infra salvo exposición (dominio, proxy).

## Cambios de apps / productos

1. Abrir repo de la app.
2. Infra solo se toca si hay que exponer servicio, dominio o regla Traefik.

## Cambios de Hermes

1. **Plantillas:** editar `config/hermes/profiles/<perfil>/` en este repo.
2. **Runtime:** datos en `/srv/data/hermes/<perfil>/` (memorias, `.env`, sesiones).
3. Aplicar en servidor: `make hermes-apply-profile-config` (desde `/srv/apps/infra`).
4. Reiniciar gateway: `systemctl --user restart hermes-gateway-<id>.service`.

Ver [docs/hermes/operations.md](../hermes/operations.md).

## Rol del asistente (edsun-ceo)

Hermes puede ayudar a decidir, documentar y ejecutar tareas simples en zonas seguras.

Para cambios técnicos fuertes (repos, compose, producción): usar **Cursor** o **`edsun-dev`** con branch, backup y reporte. Ver [docs/hermes/edsun-ceo.md](../hermes/edsun-ceo.md).

## Herramientas por capa

| Herramienta | Rol |
|-------------|-----|
| **Cursor** | Edición de repos, compose, scripts, documentación técnica |
| **Hermes (Telegram)** | Asistencia diaria, memos, priorización, recordatorios |
| **ChatGPT** | Criterio, diseño, revisión de arquitectura y decisiones |
| **edsun-dev** | Implementación técnica autorizada en el servidor |

``````

