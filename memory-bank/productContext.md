# Contexto de producto

## Problema
La planta programa manualmente en Excel; difícil balancear operarios, tanques y esperas de 30 min.

## Valor (MVP validado por cliente)
- Programación automática con **montaje en equipo** (2 personas).
- **Hoja de producción imprimible** (tabla por hora, resumen tanque, instrucciones).
- **Control supervisor** desde PC: cortes OK/Atrasado + cierre con tanques reales.
- Comparación 2 vs 3 operarios al planificar.
- Registro tarea-a-tarea y vista operario: secundario (sin tablet en piso hoy).

## Proceso estándar (7 pasos)
Pesaje → Montaje → Celulosa 1 (5 min) → Celulosa 2 (5 min, mismo operario y consecutiva) → Revólver 30 min → Resina → Finalización.

## Copy UI
"Plan del día" (no "Jornada" en interfaz principal).

## Demo
localStorage + botones simular jornada para presentación al cliente.

## Documentación operativa
- `GUIA-OPERACION.md` — guía simple para supervisores y operarios (flujo, conceptos, limitaciones).
- `docs/DEPLOY.md` — despliegue en ai-server + CI/CD GitHub Actions.
- `AGENTS.md` — guía para agentes/desarrolladores (invariantes del motor).
