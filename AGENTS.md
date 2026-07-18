# Balanceador de Producción — Agent Guide

## Read first
1. All files in `memory-bank/` (especially `systemPatterns.md`, `productContext.md`).
2. `GUIA-OPERACION.md` for domain language and supervisor checklist.
3. `lib/domain/engine.ts` before any scheduling change.

## Product language (do not regress)
- UI copy: **"Plan del día"** — not "Jornada" in user-facing text.
- Scheduling is **heuristic by resource availability**, not global optimization. Never promise optimality in copy or code comments.

## Architecture (do not bypass)
- **Single scheduler:** `programar()` / `programarJornada()` in `lib/domain/engine.ts`.
- **Store triggers only:** `crearJornada`, `recalcularJornada`, `marcarTanqueDisponibleEnJornada` call `programarJornada`.
- **Never** duplicate assignment logic in views or store.
- **Simulation ≠ scheduling:** `aplicarSimulacionHasta` in `useStore.ts` uses random jitter for demo only.

## Frozen plan snapshots
Each `Jornada` stores `proceso` and `operariosSnapshot` at creation. Global config edits do not auto-update existing plans. If inputs change, call `recalcularJornada` or document why not.

## Scheduling invariants (must hold)
| Rule | Detail |
|------|--------|
| One manual op per operator | A single operator cannot have overlapping manual tasks. Commit one candidate per loop iteration. |
| Parallel lots | Allowed only when distinct operators/tanks are free. |
| Passive ops | `tipo: 'pasivo'` blocks **tank**, not operator (`espera2` = revólver de 30 min, non-editable in UI). |
| Celulosa | Un operario agrega `celulosa1` y, al terminar sus 5 min, `celulosa2` durante 5 min consecutivos. El revólver empieza después de `celulosa2`; luego se agrega resina. |
| Pausas | Block **operator** via `ajustarVentanaPorPausas`; absolute `HH:mm`, not offset. |
| Operator pick | Prefer under `cargaMaxima`; else least loaded, then earliest start. |
| Special op ids | `pesaje`, `montaje` have dedicated branches — do not rename without updating engine. |
| Task operators | Use `tareaOperarios` / `tareaAsignadaA` in views — montaje tasks have `operarioIds`. |
| Montaje | Requires **2 operators** (`operariosRequeridos: 2`); max concurrent montajes = `floor(n_ops/2)`. Assigns `tanqueId` to lot; `operarioIds[]` on task. |
| Time model | Task `inicioMin`/`finMin` are offsets from `horaInicio`; use `lib/domain/time.ts`. |
| Indicators | `calcularIndicadores`, `calcularCortes` use std accumulators — keep aligned with engine output. |

## Change checklist (scheduling-related PRs)
- [ ] Logic only in `engine.ts` (or pure helpers colocated there).
- [ ] `npm test` and `npm run build` pass.
- [ ] Manual scenario: 2 ops, 6 tanques, meta 5 — no operator overlap violations.
- [ ] Update `memory-bank/` if behavior or architecture changes.

## Git — commit y push obligatorio (default)

**Regla por defecto:** si la tarea tocó código o docs y quedó lista para producción, **siempre** commit + **push a `origin/main`** en la misma sesión. No dejar cambios solo en local salvo que el usuario lo pida explícitamente.

Checklist al cerrar trabajo con cambios:
1. `npm test` y `npm run build` (si tocaste lógica, UI con build, o dependencias).
2. Commit en `main` con mensaje claro (1–2 frases, el porqué).
3. **`git push origin main`** — el pipeline despliega solo en ai-server. **No terminar la tarea sin push** si el commit fue exitoso.
4. Verificar con `git status` que no queden archivos pendientes sin commitear.
5. No incluir secretos (`.env`, claves SSH privadas).

**Excepciones** (no commit/push):
- El usuario pidió explícitamente no hacerlo.
- La tarea fue **solo** pregunta, revisión o análisis sin cambios en el repo.
- Los checks fallan y no hay arreglo claro en la misma sesión (dejar indicado qué falta).

Si el usuario dice que **siempre** suba los cambios, trátalo como confirmación del default: push sin preguntar al terminar.

## Out of scope unless explicitly requested
Auth, DB, empaque module, global optimizer.

## Agent assets in this repo
- `.cursor/rules/` — always-on and file-scoped guardrails.
- `.cursor/skills/change-scheduler/` — safe engine edits.
- `.cursor/skills/verify-scheduling/` — regression checklist.
- `lib/domain/engine.test.ts` — automated invariant tests.
