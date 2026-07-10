# Guía de operación — Balanceador de Producción

Guía simple para entender y usar el software en planta. Lee esto antes de operar el día a día.

---

## 1. ¿Qué hace este software?

Ayuda a **programar y controlar la producción de pintura en tanques** en una jornada de trabajo.

En lugar de armar el plan a mano en Excel, el sistema:

1. Toma los datos del día (operarios, tanques disponibles, meta de producción).
2. **Genera automáticamente** quién hace qué, en qué tanque y a qué hora.
3. Permite **imprimir una hoja de producción** (tipo Excel) con qué debe pasar cada hora en planta.
4. Permite **control simple del supervisor** desde PC: a las 8/9/10 ver si van a tiempo (OK / Atrasado).
5. Opcionalmente registrar avance tarea a tarea (vista avanzada, no es el flujo principal hoy).

> **Importante:** El motor **no busca la solución perfecta del mundo**. Programa por **disponibilidad de recursos** (operarios, tanques, pausas y esperas). Es una herramienta práctica para organizar el día, no un optimizador matemático absoluto.

---

## 2. ¿Para quién es?

| Rol | Uso principal |
|-----|----------------|
| **Supervisor** | Crear el plan, revisarlo, generar hoja imprimible, control por hora, cerrar jornada |
| **Operario** | (Futuro) Vista por operario en tablet — hoy el flujo principal es la hoja impresa |

La app está pensada para uso del **supervisor en PC** (imprimir hoja, marcar cortes). El registro por operario en tablet queda como función avanzada.

---

## 3. Conceptos que debes conocer

### Plan del día
Es la programación de **un turno** (fecha, hora inicio, hora fin). En la interfaz se llama **"Plan del día"**, no "jornada".

### Tanques (T1–T6)
Son los equipos donde se fabrica. Cada tanque puede estar:

- **Disponible** — se puede usar en el plan.
- **Lleno** — tiene producto, no se programa.
- **En limpieza** — no disponible temporalmente.
- **Fuera de servicio** — no se usa.

Solo los tanques **disponibles** entran al cálculo del plan.

### Operarios
Personas que ejecutan las operaciones. Cada uno tiene:

- **Eficiencia (%)** — si es menor a 100 %, el sistema asume que tarda más (ej. 85 % → un pesaje de 5 min pasa a 6 min).  
  Con eficiencia distinta entre operarios, **los montajes paralelos no arrancan al mismo minuto**.  
  Para planificar como en Excel (tiempos estándar), deja a todos en **100 %**.
- **Carga máxima (%)** — límite de ocupación que el motor respeta al programar.
- **Rol** — operario o auxiliar.

### Proceso estándar (8 pasos por lote)
Cada tanque que se programa sigue esta secuencia:

1. Pesaje  
2. Montaje del tanque  
3. Primera celulosa  
4. **Espera 1** (30 min — el tanque espera, el operario puede hacer otra cosa)  
5. Segunda celulosa  
6. **Espera 2** (30 min — igual que la anterior)  
7. Resina  
8. Finalización  

Las **esperas de 30 minutos son obligatorias** y no se pueden acortar desde configuración.

### Productos / colores
Al crear el plan defines qué se va a fabricar. Cada producto puede llevar una **instrucción visible** para el operario (ej.: "Agregar 2.5 kg azul").  
Eso **no es la fórmula completa** — es solo lo que el operario necesita ver en piso.

### Pausas del operario
Son descansos programados (desayuno, media tarde, etc.). **Bloquean al operario**, no al tanque en espera pasiva.  
Se configuran en **Configuración → Pausas**.

### Montaje = 2 personas
El **montaje del tanque requiere 2 operarios** trabajando juntos. Con 2–3 operarios en el turno solo puede haber **1 montaje a la vez**; con 4 operarios, hasta **2 montajes simultáneos** (`operarios ÷ 2`).

Mientras un montaje está en curso, los dos operarios asignados no pueden hacer otra tarea manual. El **pesaje** u otras tareas pueden ejecutarse en paralelo si hay operarios libres (por ejemplo durante una espera pasiva del tanque).

### Regla de un operario a la vez
En operaciones **manuales** (pesaje, montaje, celulosa, resina, etc.), **una misma persona solo puede hacer una tarea a la vez**.  
El plan puede mostrar varios tanques arrancando en paralelo **solo si hay varios operarios libres** al mismo momento.  
Con 1 operario, los pesajes salen uno tras otro. Con 2 operarios, como máximo 2 pesajes pueden coincidir en hora.

---

## 4. Flujo del día (paso a paso)

```
Configurar (una vez o cuando cambie algo)
        ↓
Crear plan del día
        ↓
Revisar programación  ←  comparar 2 vs 3 operarios
        ↓
Generar hoja de producción → Imprimir
        ↓
Control por hora (8 / 9 / 10…) — OK / Atrasado
        ↓
Cierre simple (tanques reales + observación)
        ↓
Queda en histórico
```

### Paso 1 — Configuración (antes o cuando haga falta)
Ir a **Config** (menú inferior) y revisar:

- **Operarios** — nombres, eficiencia, carga máxima, activo/inactivo.
- **Tanques** — estado actual de cada uno.
- **Proceso estándar** — duración de cada operación (las esperas pasivas no se editan).
- **Pausas** — horarios de descanso.
- **Motivos de retraso** — lista para cuando una tarea se demora.
- **Parámetros** — umbrales del semáforo (verde/amarillo) y sobrecarga.

### Paso 2 — Crear plan del día
**Plan → Crear plan del día** (o botón en Inicio).

Debes indicar:

| Campo | Qué significa |
|-------|----------------|
| Fecha y turno | Día y franja (Mañana / Tarde / Noche) |
| Hora inicio / fin | Ventana de trabajo del plan |
| Operarios | Quiénes trabajan hoy (mínimo 1) |
| Estado de tanques | Toca cada tanque para cambiar su estado inicial |
| Meta (tanques) | Cuántos tanques quieres completar |
| Galones por tanque | Volumen estimado por lote |
| Productos | Colores/referencias e instrucciones para operario |
| Prioridad | Alta / media / baja |

Al pulsar **Calcular**, el sistema genera la programación y te lleva a la revisión.

### Paso 3 — Revisar programación
En **Programación** verás:

- Cuántos tanques se pueden hacer y a qué hora terminaría el plan.
- **Comparación 2 vs 3 operarios** — útil para decidir si conviene sumar personal.
- Carga de cada operario (%).
- Línea de tiempo por tanque.
- Alertas (meta en riesgo, cuello de botella, etc.).

**Acciones posibles:**
- **Generar hoja de producción** — abre la hoja imprimible y marca el plan como activo.
- **Recalcular** — si cambiaste operarios o tanques después del cálculo.
- **Descartar** — elimina el plan y vuelves a crear uno nuevo.

> No imprimas sin revisar carga de operarios, montajes simultáneos y hora fin estimada.

### Paso 4 — Hoja imprimible
En **Hoja** (o desde Programación → Generar hoja):

- Encabezado: fecha, turno, operarios, meta, tanques.
- **Tabla por hora** con todas las actividades concurrentes en planta.
- Resumen por tanque e instrucciones de producto.
- Botón **Imprimir** (o Guardar PDF desde el diálogo del navegador).
- Botón **Descargar Excel** — archivo `.xlsx` con grilla por tanque, colores y hoja de resumen (mismo formato que el Excel de planta).

Entrega esta hoja al piso. Es el entregable principal del día.

### Paso 5 — Control por hora (supervisor en PC)
En **Control**:

- Selecciona la hora actual (o un corte: 8:00, 9:00, 10:00…).
- Revisa qué **debía estar pasando** según el plan.
- Marca cada corte como **OK** o **Atrasado** y anota observaciones.

No requiere registrar cada tarea individual en tablet.

### Paso 6 — Cierre simple
En **Control** (al final del turno):

- Ingresa **tanques reales** completados.
- Escribe observación final si hubo novedades.
- **Cerrar jornada** — el plan pasa a histórico con cumplimiento y retrasos marcados.

### Paso 7 — Avanzado (opcional)
Rutas secundarias (no en menú principal):

- **Registro real** — marcar inicio/fin de cada operación.
- **Vista operario** — pantalla por persona en tablet.
- **Tablero / KPIs** — simulación demo y métricas detalladas.

---

## 5. Navegación rápida

| Menú inferior | Para qué sirve |
|---------------|----------------|
| **Inicio** | Resumen del plan activo y accesos rápidos |
| **Plan** | Crear, revisar y gestionar el plan del día |
| **Hoja** | Hoja de producción imprimible (plan activo) |
| **Control** | Cortes por hora OK/Atrasado y cierre |
| **Histórico** | Planes anteriores (filtros por fecha, turno, estado) |
| **Config** | Operarios, tanques, proceso, pausas, parámetros |

Dentro de un plan activo hay **pestañas**: Resumen, Programación, Hoja, Control, Tanque (consulta). Registro y vista operario quedan como rutas avanzadas.

---

## 6. Estados del plan

| Estado | Significado | Qué puedes hacer |
|--------|-------------|------------------|
| **En revisión** (borrador) | Plan calculado, no aprobado | Revisar, aprobar o descartar |
| **Activo** (aprobada) | En ejecución | Imprimir hoja, control por hora, cierre |
| **Cerrado** | Jornada terminada | Solo consulta en histórico |

El badge del encabezado (Sin plan / En revisión / Activo / Cerrado) refleja el estado actual.

---

## 7. Indicadores — qué mirar

| Indicador | Qué mide |
|-----------|----------|
| **Galones planeados / fabricados** | Meta de volumen vs. lo completado |
| **Cumplimiento %** | Tanques terminados vs. planeados |
| **Eficiencia operativa %** | Minutos estándar reales vs. planeados al corte (más preciso que solo contar tanques) |
| **Carga %** | Qué tan ocupado está cada operario |
| **Semáforo** | Verde ≥ 95 %, amarillo ≥ 85 %, rojo &lt; 85 % (umbrales configurables) |

---

## 8. Cosas importantes al operar

### Antes de crear el plan
- [ ] Tanques en el estado correcto (los no disponibles **no** se programan).
- [ ] Operarios activos y con eficiencia/carga actualizadas.
- [ ] Hora fin mayor que hora inicio.
- [ ] Al menos un producto con nombre.
- [ ] Pausas del día configuradas si aplican.

### Al revisar la programación
- [ ] ¿Los **inicios por operario** son humanamente posibles? (nadie con dos tareas manuales a la misma hora)
- [ ] ¿La **hora fin estimada** cabe en el turno?
- [ ] ¿Algún operario está en **sobrecarga**?
- [ ] ¿La **meta de tanques** es alcanzable o hay alerta de riesgo?
- [ ] ¿Conviene sumar un operario? (usa la comparación 2 vs 3).

### Durante la ejecución
- [ ] Usa la **hoja impresa** en piso como referencia principal.
- [ ] A cada hora (8, 9, 10…), revisa en **Control** si lo planeado va OK o Atrasado.
- [ ] Si un tanque se libera antes (ej. terminó limpieza), **márcalo disponible** desde la vista por tanque.
- [ ] Las **esperas de 30 min** del proceso son del tanque; operarios libres pueden pesar u otra tarea.

### Al cerrar
- [ ] Ingresa **tanques reales** completados.
- [ ] Escribe **observación final** si hubo novedades del día.
- [ ] Cierra la jornada para dejar registro en histórico.

---

## 9. Modo demo (presentaciones y pruebas)

El software guarda todo en el **navegador** (localStorage). Es una demo funcional, no un servidor centralizado.

En el **Tablero** hay botones de simulación:

- **Avanzar 30 min** — simula el paso del tiempo y marca tareas como hechas automáticamente.
- **Simular jornada completa** — ejecuta todo el plan de un golpe.

Úsalos para **mostrar el tablero al cliente** sin esperar horas reales. En operación real, el avance debe venir del **registro manual** o de la vista operario.

---

## 10. Limitaciones que debes tener en cuenta

1. **No hay usuarios ni contraseñas** — cualquiera con acceso al navegador puede usar la app.
2. **Los datos viven en ese dispositivo/navegador** — si borras caché o cambias de equipo, pierdes el historial (salvo que exportes o migres a base de datos en el futuro).
3. **No incluye módulo de empaque** — solo producción en tanques.
4. **El motor es heurístico** — asigna por disponibilidad y menor carga; puede haber escenarios donde un plan manual sea distinto.
5. **La simulación automática usa variación aleatoria** — los tiempos simulados no son exactamente los reales.
6. **Las instrucciones de producto son visibles, no formulación completa** — no reemplazan el sistema de recetas/formulaciones con permisos.

---

## 11. Resumen en una frase

**Configuras recursos → creas el plan del día → revisas → imprimes la hoja → controlas por hora → cierras con tanques reales.**

---

## 12. Arrancar la aplicación

```bash
npm run dev
```

Abre en el navegador la URL que indique la terminal (normalmente `http://localhost:3000`).

Para uso en tablet en planta, abre esa misma URL en el dispositivo conectado a la misma red (o despliega en un servidor cuando salga de la fase demo).

---

*Documento generado para Balanceador de Producción v0.2 — demo con almacenamiento local.*
