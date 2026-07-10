# Contexto activo

## Última sesión (2026-07-09)
Rediseño UI: tema **minimalista claro**, compacto y profesional (sustituye diseño industrial oscuro).

## Hecho
- Stack UI: **shadcn-style** (`components/ui/*`), **Lucide** icons, **Inter**, tokens HSL zinc/neutral.
- `AppShell`: header h-12, nav inferior con iconos Lucide, fondo claro.
- Vistas unificadas: tipografía `font-semibold`, `text-muted-foreground`, cards compactas.
- Motor, flujo Plan del día, localStorage y rutas sin cambios funcionales.
- `npm run build` exitoso.

## Próximos pasos sugeridos
- Validar motor con datos reales del cliente.
- Migrar persistencia a DB cuando aprueben demo.
- Auth/roles para supervisor vs operario.
