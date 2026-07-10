# Contexto activo

## Última sesión (2026-07-10)
Análisis exhaustivo del motor vs Excel/demo JSON. Fixes de paralelismo y comparación 2 vs 3 ops.

## Hallazgos
- Desfase T1/T2 de 1 min: Camilo con eficiencia 85% → pesaje 6 min (no bug de paralelismo).
- "2 y 3 ops mismo fin": bug en `compararOperarios` (solo miraba ops del plan).
- Con eficiencia 100%: 1 op → 11:45, 2 → 10:30, 3 → 09:45. Arranque simétrico 07:35.

## Hecho
- Defaults eficiencia 100% (tiempos estándar).
- `elegirOperario`: inicio → fin → carga (makespan).
- Prioridad lotes en curso; `compararOperarios` usa snapshot completo.
- 12 tests (paralelismo, espera+trabajo, 2 vs 3, Excel).
- Push `b323e29` a main (deploy automático).

## Próximos pasos sugeridos
- En demo: Configuración → Datos demo → Reiniciar (limpia eficiencias viejas 85/70).
- Validar con cliente en planta.
