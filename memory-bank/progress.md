# Progreso

## Completado
- [x] Migración Next.js App Router
- [x] Design system minimalista claro (shadcn + Lucide)
- [x] Motor scheduler por eventos + pausas + carga máxima
- [x] Flujo UX Plan del día (pasos, tabs, empty states)
- [x] Tablero eficiencia operativa + simular jornada (avanzado)
- [x] Timeline tanque + comparación operarios
- [x] Instrucciones visibles por producto
- [x] Memory bank inicializado
- [x] AGENTS.md + `.cursor/rules` + `.cursor/skills`
- [x] Deploy automático GitHub Actions → ai-server
- [x] Fix paralelismo + compararOperarios + makespan
- [x] Exportación Excel (`hoja-excel.ts`, ExcelJS) con grilla tipo planta
- [x] **Control por hora** + cierre simple (`ControlDiaView`, `cortesControl`)
- [x] Nav reorientado (Hoja/Control principal; Registro/Operario secundario)
- [x] 13 tests motor; `npm test` + `npm run build` OK
- [x] **Fix timing celulosa:** revólver 30 min anclado al inicio de adición; guard de deadlines en montajes (21 tests)

## Pendiente (post-demo)
- [ ] Base de datos y auth
- [ ] Validación hoja + control con cliente en planta
- [ ] Logo empresa en hoja
- [ ] Módulo empaque
- [ ] Reportes mensuales

## Issues conocidos
- Motor heurístico greedy, no óptimo global.
- Simulación demo usa jitter aleatorio.
- Planes en localStorage: recalcular manualmente si cambia config global.
- PDF server-side no implementado (imprimir desde navegador).
