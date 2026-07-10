# Contexto activo

## Última sesión (2026-07-10)
MVP **planificar → imprimir → controlar** según validación del cliente.

## Flujo principal (MVP)
1. Crear y revisar plan del día (comparación 2 vs 3 ops).
2. **Generar hoja de producción** (`/plan/[id]/hoja`) — imprimir.
3. **Control por hora** (`/plan/[id]/control`) — OK / Atrasado + cierre con tanques reales.
4. Registro/vista operario/tablero/KPIs: rutas avanzadas, fuera del menú principal.

## Motor — montaje en equipo
- `operariosRequeridos: 2` en montaje (`defaults.ts`).
- Capacidad montajes simultáneos = `floor(n_operarios / 2)`.
- `elegirParOperarios`; tareas con `operarioIds[]`.
- Helpers: `lib/domain/tarea-helpers.ts`.
- 13 tests en `engine.test.ts`.

## Hecho en esta iteración
- `lib/domain/hoja.ts` + `HojaProduccionView` + print CSS.
- Logo Kolorflex en `public/kolorflex-logo.png`; Excel y hoja usan colores K (#001088) y F (#F03038).
- `ControlDiaView` + `cortesControl` / `tanquesReales` en store.
- Nav: AppShell/PlanTabs → Hoja + Control; CTAs reorientados.
- Docs: GUIA-OPERACION, AGENTS, memory-bank.

## Próximos pasos sugeridos
- Logo real del cliente en hoja (`public/logo.svg`).
- Validar hoja impresa en planta con supervisor.
- Reiniciar datos demo tras deploy (montaje 2 personas).
