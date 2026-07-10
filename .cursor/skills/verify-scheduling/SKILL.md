---
name: verify-scheduling
description: >-
  Regression checklist for Plan del día scheduling before merge or deploy.
  Use when reviewing scheduler changes, fixing programación bugs, or validating
  tanques/operarios/pausas behavior.
disable-model-invocation: true
---

# Verify scheduling

## Automated
```bash
npm test
npm run build
```

## Scenarios (minimum)

| # | Setup | Assert |
|---|--------|--------|
| 1 | 1 op, meta 3 | Pesajes en serie; no operator overlap |
| 2 | 2 ops, meta 4 | ≤2 pesajes at t=0; no same-operator overlap |
| 3 | Passive waits | `operarioId: null`; tank busy 30 min |
| 4 | 3 ops, meta 5, 6 tanques | Full plan: `assertNoOperatorOverlap` on all manual tasks |
| 5 | Pausa 10:05 15 min | No manual task crosses pause for assigned operator |

## UI smoke
- `ProgramacionView`: timeline shows staggered starts when few operators.
- `PlanOperarioView`: no duplicate clock times for same operator on manual ops.

## Before merge
- [ ] `engine.test.ts` covers new behavior if rules changed.
- [ ] `memory-bank/progress.md` updated if issue was fixed.
