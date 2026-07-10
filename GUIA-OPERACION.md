# Guía de operación — Balanceador de Producción

Guía simple para entender y usar el software en planta. Lee esto antes de operar el día a día.

---

## 1. ¿Qué hace este software?

Ayuda a **programar y controlar la producción de pintura en tanques** en una jornada de trabajo.

En lugar de armar el plan a mano en Excel, el sistema:

1. Toma los datos del día (operarios, tanques disponibles, meta de producción).
2. **Genera automáticamente** quién hace qué, en qué tanque y a qué hora.
3. Permite **registrar lo que realmente pasó** en planta.
4. Muestra **avance planeado vs. real** (tablero e indicadores).

> **Importante:** El motor **no busca la solución perfecta del mundo**. Programa por **disponibilidad de recursos** (operarios, tanques, pausas y esperas). Es una herramienta práctica para organizar el día, no un optimizador matemático absoluto.

---

## 2. ¿Para quién es?

| Rol | Uso principal |
|-----|----------------|
| **Supervisor** | Crear el plan, revisarlo, aprobarlo, ver tablero, cerrar jornada |
| **Operario** | Ver su lista de tareas del día e indicar inicio/fin (vista operario) |

La app está pensada para **tablet o celular** en piso de producción.

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
Revisar programación  ←  aquí puedes comparar 2 vs 3 operarios
        ↓
Aprobar plan
        ↓
Ejecutar en planta (registro real o vista operario)
        ↓
Seguir tablero e indicadores
        ↓
Cerrar jornada → queda en histórico
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
- **Aprobar plan del día** — pasa a ejecución.
- **Descartar** — elimina el plan y vuelves a crear uno nuevo.

> No apruebes sin revisar carga de operarios y hora fin estimada.

### Paso 4 — Aprobar
Al aprobar, el plan queda **activo**. El estado cambia de *En revisión* a *Activo*.

A partir de aquí puedes registrar avance real y ver el tablero.

### Paso 5 — Ejecutar en planta

**Opción A — Registro real (supervisor)**  
**Plan → Registro real**: lista todas las operaciones. Por cada una:

1. **Iniciar** — cuando el operario empieza.
2. **Finalizar** — cuando termina. Si tardó más de lo estándar, indica motivo de retraso.

**Opción B — Vista operario (piso)**  
Desde el plan, entra a **Vista operario** de cada persona. Muestra:

- Tarea actual o próxima.
- Instrucción del producto.
- Botones: Iniciar / Finalizar / Novedad.

La vista operario ocupa **toda la pantalla** (sin menú inferior) para uso en tablet.

### Paso 6 — Tablero e indicadores

**Tablero** — avance en vivo:
- Galones planeados vs. fabricados.
- Eficiencia operativa por cortes de tiempo.
- Botones de **demo**: avanzar 30 min o simular jornada completa.

**Indicadores** — resumen del día:
- Cumplimiento, eficiencia, tanques terminados, retrasos.
- Detalle por operario.
- Campo de observación final.
- Botón **Cerrar jornada**.

### Paso 7 — Cerrar jornada
En **Indicadores**, pulsa **Cerrar jornada**. El plan pasa a estado **cerrado** y queda en **Histórico**.

---

## 5. Navegación rápida

| Menú inferior | Para qué sirve |
|---------------|----------------|
| **Inicio** | Resumen del plan activo y accesos rápidos |
| **Plan** | Crear, revisar y gestionar el plan del día |
| **Tablero** | Avance planeado vs. real |
| **KPIs** | Indicadores y cierre de jornada |
| **Histórico** | Planes anteriores (filtros por fecha, turno, estado) |
| **Config** | Operarios, tanques, proceso, pausas, parámetros |

Dentro de un plan activo hay **pestañas**: Resumen, Programación, Por operario, Por tanque, Registro, Tablero, Indicadores.

---

## 6. Estados del plan

| Estado | Significado | Qué puedes hacer |
|--------|-------------|------------------|
| **En revisión** (borrador) | Plan calculado, no aprobado | Revisar, aprobar o descartar |
| **Activo** (aprobada) | En ejecución | Registrar avance, tablero, indicadores |
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
- [ ] Marca **inicio y fin real** de cada operación — sin eso los indicadores no reflejan la realidad.
- [ ] Si un tanque se libera antes (ej. terminó limpieza), puedes **marcarlo disponible** desde la vista por tanque.
- [ ] Las **esperas de 30 min** del proceso son del tanque; el operario puede estar en otra tarea en paralelo.

### Al cerrar
- [ ] Revisa indicadores por operario.
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

**Configuras recursos → creas el plan del día → revisas y apruebas → registras qué pasa en planta → miras tablero e indicadores → cierras la jornada.**

---

## 12. Arrancar la aplicación

```bash
npm run dev
```

Abre en el navegador la URL que indique la terminal (normalmente `http://localhost:3000`).

Para uso en tablet en planta, abre esa misma URL en el dispositivo conectado a la misma red (o despliega en un servidor cuando salga de la fase demo).

---

*Documento generado para Balanceador de Producción v0.2 — demo con almacenamiento local.*
