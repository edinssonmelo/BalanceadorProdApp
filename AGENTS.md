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
| Passive ops | `tipo: 'pasivo'` blocks **tank**, not operator (`espera1`/`espera2`, 30 min, non-editable in UI). |
| Pausas | Block **operator** via `ajustarVentanaPorPausas`; absolute `HH:mm`, not offset. |
| Operator pick | Prefer under `cargaMaxima`; else least loaded, then earliest start. |
| Special op ids | `pesaje`, `montaje` have dedicated branches — do not rename without updating engine. |
| Montaje | Assigns `tanqueId` to lot; later ops require it. |
| Time model | Task `inicioMin`/`finMin` are offsets from `horaInicio`; use `lib/domain/time.ts`. |
| Indicators | `calcularIndicadores`, `calcularCortes` use std accumulators — keep aligned with engine output. |

## Change checklist (scheduling-related PRs)
- [ ] Logic only in `engine.ts` (or pure helpers colocated there).
- [ ] `npm test` and `npm run build` pass.
- [ ] Manual scenario: 2 ops, 6 tanques, meta 5 — no operator overlap violations.
- [ ] Update `memory-bank/` if behavior or architecture changes.

## Out of scope unless explicitly requested
Auth, DB, empaque module, global optimizer, committing without user ask.

## Agent assets in this repo
- `.cursor/rules/` — always-on and file-scoped guardrails.
- `.cursor/skills/change-scheduler/` — safe engine edits.
- `.cursor/skills/verify-scheduling/` — regression checklist.
- `lib/domain/engine.test.ts` — automated invariant tests.
