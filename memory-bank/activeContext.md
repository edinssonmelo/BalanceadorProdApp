# Contexto activo

## Última sesión (2026-07-10)
Fix crítico del motor: **un operario = una operación manual a la vez**. Guardrails del agente añadidos al repo.

## Hecho
- Motor: commit incremental (ya no `batchAtTime` ciego); elimina pesajes simultáneos imposibles en el mismo operario.
- Vitest + `lib/domain/engine.test.ts` (4 tests de invariante).
- `AGENTS.md`, `.cursor/rules/*`, `.cursor/skills/*`.
- Memory bank y `GUIA-OPERACION.md` actualizados.

## Feedback cliente
"No puede pesar seis tanques a la misma hora" — resuelto en motor; con 2 operarios máx. 2 arranques paralelos de pesaje.

## Próximos pasos sugeridos
- Redesplegar demo en ai-server tras push.
- Validar con datos reales del cliente.
- Opcional: `recalcularJornada` desde configuración cuando cambie proceso/pausas.
