# Progreso

## Completado
- [x] Migración Next.js App Router
- [x] Design system minimalista claro (shadcn + Lucide)
- [x] Motor scheduler por eventos + pausas + carga máxima
- [x] Flujo UX Plan del día (pasos, tabs, empty states)
- [x] Tablero eficiencia operativa + simular jornada
- [x] Timeline tanque + comparación operarios
- [x] Instrucciones visibles por producto
- [x] Memory bank inicializado
- [x] `npm run build` exitoso
- [x] Fix solapamiento operario en motor (commit incremental)
- [x] Tests Vitest `engine.test.ts`
- [x] AGENTS.md + `.cursor/rules` + `.cursor/skills`

## Pendiente (post-demo)
- [ ] Base de datos y auth
- [ ] Validación motor con datos reales cliente
- [ ] Módulo empaque
- [ ] Reportes mensuales

## Issues conocidos
- Motor es heurístico greedy, no óptimo global (copy: "programación por disponibilidad de recursos").
- Simulación demo usa jitter aleatorio en tareas.
- Planes existentes en localStorage no se recalculan solos si cambia configuración global (`recalcularJornada` no cableado en UI).
