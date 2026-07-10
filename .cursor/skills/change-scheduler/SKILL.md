---
name: change-scheduler
description: >-
  Safely modify the production scheduling engine (programar, programarJornada,
  compararOperarios). Use when changing lib/domain/engine.ts, operator/tank
  assignment, pausas, parallel lots, passive waits, or scheduling alerts.
disable-model-invocation: true
---

# Change scheduler

## Before editing
1. Read `memory-bank/systemPatterns.md`, `GUIA-OPERACION.md` § proceso estándar, full `lib/domain/engine.ts`.
2. Read `AGENTS.md` invariants table.
3. State intended behavior change in one sentence.

## Rules
- Edit **only** `lib/domain/engine.ts` (+ tests). Wire store only for new inputs/outputs.
- One candidate committed per loop; update `opFreeAt`/`tankFreeAt` immediately.
- Never schedule overlapping manual tasks for the same `operarioId`.
- Do not move scheduling logic into React or Zustand.

## After editing
1. `npm test`
2. `npm run build`
3. Update `memory-bank/` if semantics changed.

## Anti-patterns
- Batch commit without refreshing resource maps.
- Renaming `pesaje`/`montaje` without engine update.
- Using simulation jitter in `programar()`.
