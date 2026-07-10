# Contexto activo

## Última sesión (2026-07-10)
Despliegue automático activo: runner `ai-server-balanceador` + `DEPLOY_SELF_HOSTED=true`. Push a `main` despliega en demo.

## Hecho
- Motor: commit incremental (ya no `batchAtTime` ciego); elimina pesajes simultáneos imposibles en el mismo operario.
- Vitest + `lib/domain/engine.test.ts` (4 tests de invariante).
- `AGENTS.md`, `.cursor/rules/*`, `.cursor/skills/*`.
- CI/CD: workflow Deploy verificado (run 29102756594 OK); servidor en `ca3650b`.
- Runner self-hosted en `/srv/actions-runner/balanceador-prod-app`.

## Feedback cliente
"No puede pesar seis tanques a la misma hora" — resuelto en motor; con 2 operarios máx. 2 arranques paralelos de pesaje.

## UI programación (2026-07-10)
- Botón Recalcular, aviso plan desactualizado, etiquetas lotes vs tanques físicos.
- Agente: commit + push automático a `main` documentado en `AGENTS.md`.

## Próximos pasos sugeridos
- Validar con datos reales del cliente.
