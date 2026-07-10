import type {
  Operario,
  OperacionEstandar,
  TareaProgramada,
  CargaOperario,
  Alerta,
  ResultadoProgramacion,
  Jornada,
  EstadoOperacion,
  ProductoPlan,
  PausaOperario,
} from './types';
import type { Parametros } from './defaults';
import { genId } from './defaults';
import { hhmmToMinutes } from './time';
import { tareaAsignadaA } from './tarea-helpers';

interface EngineInput {
  horizonMin: number;
  horaInicioAbs: number;
  operarios: Operario[];
  tanquesFisicos: string[];
  tanquesBloqueados: string[];
  metaTanques: number;
  galonesPorTanque: number;
  productos: ProductoPlan[];
  proceso: OperacionEstandar[];
  parametros: Parametros;
}

interface LoteState {
  loteIndex: number;
  producto: ProductoPlan;
  opIndex: number;
  readyAt: number;
  tanqueId: string | null;
  completado: boolean;
}

interface ScheduleCandidate {
  lote: LoteState;
  op: OperacionEstandar;
  inicio: number;
  fin: number;
  dur: number;
  operarioId: string | null;
  operarioIds: string[];
  tanqueId: string;
  sobrecarga: boolean;
}

function capacidadMontaje(nOperarios: number): number {
  return Math.floor(nOperarios / 2);
}

function montajesSolapados(tareas: TareaProgramada[], inicio: number, fin: number): number {
  return tareas.filter(
    (t) => t.operacionId === 'montaje' && t.inicioMin < fin - 0.001 && t.finMin > inicio + 0.001,
  ).length;
}

function duracionAjustada(base: number, eficiencia: number): number {
  if (!eficiencia || eficiencia <= 0) return base;
  return Math.max(1, Math.round((base * 100) / eficiencia));
}

/** Evita solapar pausas de operario al programar tareas manuales */
function ajustarVentanaPorPausas(
  inicioOffset: number,
  duracion: number,
  horaInicioAbs: number,
  pausas: PausaOperario[],
): { inicio: number; fin: number } {
  let absStart = horaInicioAbs + inicioOffset;
  let absEnd = absStart + duracion;

  for (const pausa of pausas) {
    const pStart = hhmmToMinutes(pausa.inicio);
    const pEnd = pStart + pausa.duracionMin;
    if (absStart < pEnd && absEnd > pStart) {
      const delay = pEnd - absStart;
      absStart += delay;
      absEnd += delay;
    }
  }

  return {
    inicio: absStart - horaInicioAbs,
    fin: absEnd - horaInicioAbs,
  };
}

function elegirOperario(
  desde: number,
  durBase: number,
  operarios: Operario[],
  opFreeAt: Record<string, number>,
  opMinutes: Record<string, number>,
  horizonMin: number,
  horaInicioAbs: number,
  pausas: PausaOperario[],
): { operario: Operario; inicio: number; fin: number; dur: number; sobrecarga: boolean } | null {
  if (operarios.length === 0) return null;

  const candidates = operarios.map((o) => {
    const libreDesde = Math.max(desde, opFreeAt[o.id] ?? 0);
    const dur = duracionAjustada(durBase, o.eficiencia);
    const ventana = ajustarVentanaPorPausas(libreDesde, dur, horaInicioAbs, pausas);
    const nuevaCarga =
      horizonMin > 0
        ? Math.round(((opMinutes[o.id] ?? 0) + dur) / horizonMin) * 100
        : 0;
    return {
      operario: o,
      inicio: ventana.inicio,
      fin: ventana.fin,
      dur,
      sobrecarga: nuevaCarga > o.cargaMaxima,
      cargaActual: opMinutes[o.id] ?? 0,
    };
  });

  const sinSobrecarga = candidates.filter((c) => !c.sobrecarga);
  const pool = sinSobrecarga.length > 0 ? sinSobrecarga : candidates;

  // Makespan: quien puede empezar antes; a igualdad, quien termina antes (más eficiente);
  // luego balance de carga.
  pool.sort((a, b) => {
    if (a.inicio !== b.inicio) return a.inicio - b.inicio;
    if (a.fin !== b.fin) return a.fin - b.fin;
    return a.cargaActual - b.cargaActual;
  });

  const best = pool[0];
  return {
    operario: best.operario,
    inicio: best.inicio,
    fin: best.fin,
    dur: best.dur,
    sobrecarga: best.sobrecarga,
  };
}

/** Montaje: elige un par de operarios; ambos quedan ocupados hasta fin. */
function elegirParOperarios(
  desde: number,
  tankAt: number,
  durBase: number,
  operarios: Operario[],
  opFreeAt: Record<string, number>,
  opMinutes: Record<string, number>,
  horizonMin: number,
  horaInicioAbs: number,
  pausas: PausaOperario[],
): {
  operarios: [Operario, Operario];
  inicio: number;
  fin: number;
  dur: number;
  sobrecarga: boolean;
} | null {
  if (operarios.length < 2) return null;

  type PairCand = {
    o1: Operario;
    o2: Operario;
    inicio: number;
    fin: number;
    dur: number;
    sobrecarga: boolean;
    cargaSum: number;
  };

  const pairs: PairCand[] = [];

  for (let i = 0; i < operarios.length; i++) {
    for (let j = i + 1; j < operarios.length; j++) {
      const o1 = operarios[i];
      const o2 = operarios[j];
      const dur1 = duracionAjustada(durBase, o1.eficiencia);
      const dur2 = duracionAjustada(durBase, o2.eficiencia);
      const libre1 = Math.max(desde, tankAt, opFreeAt[o1.id] ?? 0);
      const libre2 = Math.max(desde, tankAt, opFreeAt[o2.id] ?? 0);
      const jointLibre = Math.max(libre1, libre2);
      const v1 = ajustarVentanaPorPausas(jointLibre, dur1, horaInicioAbs, pausas);
      const v2 = ajustarVentanaPorPausas(jointLibre, dur2, horaInicioAbs, pausas);
      const inicio = Math.max(v1.inicio, v2.inicio);
      const end1 = ajustarVentanaPorPausas(inicio, dur1, horaInicioAbs, pausas).fin;
      const end2 = ajustarVentanaPorPausas(inicio, dur2, horaInicioAbs, pausas).fin;
      const fin = Math.max(end1, end2);
      const dur = fin - inicio;
      const carga1 =
        horizonMin > 0 ? Math.round(((opMinutes[o1.id] ?? 0) + dur) / horizonMin) * 100 : 0;
      const carga2 =
        horizonMin > 0 ? Math.round(((opMinutes[o2.id] ?? 0) + dur) / horizonMin) * 100 : 0;
      const sobrecarga = carga1 > o1.cargaMaxima || carga2 > o2.cargaMaxima;
      pairs.push({
        o1,
        o2,
        inicio,
        fin,
        dur,
        sobrecarga,
        cargaSum: (opMinutes[o1.id] ?? 0) + (opMinutes[o2.id] ?? 0),
      });
    }
  }

  if (pairs.length === 0) return null;

  const sinSobrecarga = pairs.filter((p) => !p.sobrecarga);
  const pool = sinSobrecarga.length > 0 ? sinSobrecarga : pairs;
  pool.sort((a, b) => {
    if (a.inicio !== b.inicio) return a.inicio - b.inicio;
    if (a.fin !== b.fin) return a.fin - b.fin;
    return a.cargaSum - b.cargaSum;
  });

  const best = pool[0];
  return {
    operarios: [best.o1, best.o2],
    inicio: best.inicio,
    fin: best.fin,
    dur: best.dur,
    sobrecarga: best.sobrecarga,
  };
}

/**
 * Motor por eventos: en cada paso programa una operación lista.
 * Paralelismo solo cuando hay recursos distintos libres (operarios/tanques).
 * Un operario nunca tiene dos tareas manuales solapadas.
 */
export function programar(input: EngineInput): ResultadoProgramacion {
  const {
    horizonMin,
    horaInicioAbs,
    operarios,
    tanquesFisicos,
    tanquesBloqueados,
    metaTanques,
    galonesPorTanque,
    productos,
    proceso,
    parametros,
  } = input;

  const tareas: TareaProgramada[] = [];
  const alertas: Alerta[] = [];
  const opsOrdenadas = [...proceso].sort((a, b) => a.orden - b.orden);
  const operariosSel = operarios.filter((o) => o.activo);
  const pausas = parametros.pausas ?? [];

  const tankFreeAt: Record<string, number> = {};
  tanquesFisicos.forEach((t) => {
    tankFreeAt[t] = 0;
  });

  const opFreeAt: Record<string, number> = {};
  const opMinutes: Record<string, number> = {};
  operariosSel.forEach((o) => {
    opFreeAt[o.id] = 0;
    opMinutes[o.id] = 0;
  });

  const lotes: LoteState[] = Array.from({ length: metaTanques }, (_, i) => ({
    loteIndex: i,
    producto: productos[i % Math.max(productos.length, 1)] ?? {
      nombre: 'Producto estándar',
      instruccionVisible: '',
    },
    opIndex: 0,
    readyAt: 0,
    tanqueId: null,
    completado: false,
  }));

  const sobrecargasRegistradas = new Set<string>();
  let iter = 0;
  const MAX_ITER = 50000;

  if (tanquesFisicos.length === 0) {
    alertas.push({ id: genId('al'), nivel: 'error', mensaje: 'No hay tanques disponibles para programar.' });
  }
  if (operariosSel.length === 0) {
    alertas.push({ id: genId('al'), nivel: 'error', mensaje: 'No hay operarios seleccionados para el plan.' });
  }
  if (operariosSel.length > 0 && operariosSel.length < 2) {
    alertas.push({
      id: genId('al'),
      nivel: 'advertencia',
      mensaje: 'Montaje requiere mínimo 2 personas. Con 1 operario no se puede montar tanques.',
    });
  }

  const capMontaje = capacidadMontaje(operariosSel.length);

  function intentarProgramar(lote: LoteState): ScheduleCandidate | null {
    if (lote.completado || lote.opIndex >= opsOrdenadas.length) {
      lote.completado = true;
      return null;
    }

    const op = opsOrdenadas[lote.opIndex];

    if (op.tipo === 'pasivo') {
      if (!lote.tanqueId) return null;
      const inicio = Math.max(lote.readyAt, tankFreeAt[lote.tanqueId]);
      const fin = inicio + op.duracionMin;
      return {
        lote,
        op,
        inicio,
        fin,
        dur: op.duracionMin,
        operarioId: null,
        operarioIds: [],
        tanqueId: lote.tanqueId,
        sobrecarga: false,
      };
    }

    if (op.id === 'pesaje' || !op.requiereTanque) {
      const pick = elegirOperario(
        lote.readyAt,
        op.duracionMin,
        operariosSel,
        opFreeAt,
        opMinutes,
        horizonMin,
        horaInicioAbs,
        pausas,
      );
      if (!pick) return null;
      return {
        lote,
        op,
        inicio: pick.inicio,
        fin: pick.fin,
        dur: pick.dur,
        operarioId: pick.operario.id,
        operarioIds: [pick.operario.id],
        tanqueId: '—',
        sobrecarga: pick.sobrecarga,
      };
    }

    if (op.id === 'montaje') {
      if (capMontaje === 0) return null;

      const intentarEnTanque = (tanque: string, desde: number): ScheduleCandidate | null => {
        const pick = elegirParOperarios(
          desde,
          tankFreeAt[tanque],
          op.duracionMin,
          operariosSel,
          opFreeAt,
          opMinutes,
          horizonMin,
          horaInicioAbs,
          pausas,
        );
        if (!pick) return null;
        const inicio = Math.max(pick.inicio, tankFreeAt[tanque]);
        const fin = inicio + pick.dur;
        if (montajesSolapados(tareas, inicio, fin) >= capMontaje) return null;
        return {
          lote,
          op,
          inicio,
          fin,
          dur: pick.dur,
          operarioId: pick.operarios[0].id,
          operarioIds: [pick.operarios[0].id, pick.operarios[1].id],
          tanqueId: tanque,
          sobrecarga: pick.sobrecarga,
        };
      };

      const tanquesLibres = tanquesFisicos.filter((t) => tankFreeAt[t] <= lote.readyAt + 0.001);
      if (tanquesLibres.length === 0) {
        const proximoTanque = tanquesFisicos.reduce((best, t) =>
          tankFreeAt[t] < tankFreeAt[best] ? t : best,
        );
        return intentarEnTanque(proximoTanque, Math.max(lote.readyAt, tankFreeAt[proximoTanque]));
      }

      let mejor: ScheduleCandidate | null = null;
      for (const tanque of tanquesLibres) {
        const cand = intentarEnTanque(tanque, Math.max(lote.readyAt, tankFreeAt[tanque]));
        if (!cand) continue;
        if (!mejor || cand.inicio < mejor.inicio) mejor = cand;
      }
      return mejor;
    }

    if (!lote.tanqueId) return null;
    const pick = elegirOperario(
      Math.max(lote.readyAt, tankFreeAt[lote.tanqueId]),
      op.duracionMin,
      operariosSel,
      opFreeAt,
      opMinutes,
      horizonMin,
      horaInicioAbs,
      pausas,
    );
    if (!pick) return null;
    const inicio = Math.max(pick.inicio, lote.readyAt, tankFreeAt[lote.tanqueId]);
    const fin = inicio + pick.dur;
    return {
      lote,
      op,
      inicio,
      fin,
      dur: pick.dur,
      operarioId: pick.operario.id,
      operarioIds: [pick.operario.id],
      tanqueId: lote.tanqueId,
      sobrecarga: pick.sobrecarga,
    };
  }

  while (lotes.some((l) => !l.completado) && iter++ < MAX_ITER) {
    const candidatos: ScheduleCandidate[] = [];
    for (const lote of lotes) {
      const c = intentarProgramar(lote);
      if (c) candidatos.push(c);
    }

    if (candidatos.length === 0) {
      const tiempos: number[] = [];
      for (const lote of lotes.filter((l) => !l.completado)) {
        tiempos.push(lote.readyAt);
        if (lote.tanqueId) tiempos.push(tankFreeAt[lote.tanqueId]);
      }
      for (const o of operariosSel) tiempos.push(opFreeAt[o.id]);
      for (const t of tanquesFisicos) tiempos.push(tankFreeAt[t]);

      const now = Math.min(...lotes.filter((l) => !l.completado).map((l) => l.readyAt));
      const futuros = [...new Set(tiempos)].filter((t) => t > now + 0.001).sort((a, b) => a - b);
      if (futuros.length === 0) break;

      let avanzado = false;
      for (const lote of lotes.filter((l) => !l.completado)) {
        if (lote.readyAt <= futuros[0] + 0.001) continue;
        const op = opsOrdenadas[lote.opIndex];
        if (op?.id === 'montaje' && !lote.tanqueId) {
          const minTank = Math.min(...tanquesFisicos.map((t) => tankFreeAt[t]));
          if (minTank > lote.readyAt && minTank <= futuros[0]) {
            lote.readyAt = minTank;
            avanzado = true;
          }
        }
      }
      if (!avanzado) break;
      continue;
    }

    // Primero el que puede empezar antes; a igualdad, avanzar lotes ya en curso
    // (mayor opIndex) antes de abrir lotes nuevos — libera tanques y operarios antes.
    candidatos.sort(
      (a, b) =>
        a.inicio - b.inicio ||
        b.lote.opIndex - a.lote.opIndex ||
        a.lote.loteIndex - b.lote.loteIndex,
    );
    const cand = candidatos[0];
    const { lote, op } = cand;

    if (cand.fin > horizonMin) {
      lote.completado = true;
      continue;
    }

    if (op.id === 'montaje') {
      lote.tanqueId = cand.tanqueId;
    }

    if (cand.operarioIds.length > 0) {
      for (const opId of cand.operarioIds) {
        opFreeAt[opId] = cand.fin;
        opMinutes[opId] = (opMinutes[opId] ?? 0) + cand.dur;
        if (cand.sobrecarga) {
          const opSel = operariosSel.find((o) => o.id === opId);
          if (opSel && !sobrecargasRegistradas.has(opSel.id)) {
            sobrecargasRegistradas.add(opSel.id);
          }
        }
      }
    }

    if (lote.tanqueId && lote.tanqueId !== '—') {
      tankFreeAt[lote.tanqueId] = cand.fin;
    }

    tareas.push({
      id: genId('tk'),
      tanqueId: cand.tanqueId,
      operacionId: op.id,
      operacionNombre: op.nombre,
      tipo: op.tipo,
      operarioId: cand.operarioId,
      operarioIds: cand.operarioIds,
      loteIndex: lote.loteIndex,
      productoNombre: lote.producto.nombre,
      productoInstruccion: lote.producto.instruccionVisible,
      inicioMin: cand.inicio,
      finMin: cand.fin,
      duracionMin: cand.dur,
      estado: 'programado',
      realInicioMin: null,
      realFinMin: null,
      motivoRetrasoId: null,
      observacion: null,
    });

    lote.opIndex += 1;
    lote.readyAt = cand.fin;
    if (lote.opIndex >= opsOrdenadas.length) lote.completado = true;
  }

  const lotesCompletos = new Set(
    tareas
      .filter((t) => t.operacionId === opsOrdenadas[opsOrdenadas.length - 1]?.id)
      .map((t) => t.loteIndex),
  );
  const tanquesPlaneados = lotesCompletos.size;

  const cargas: CargaOperario[] = operariosSel.map((o) => {
    const min = tareas
      .filter((t) => tareaAsignadaA(t, o.id))
      .reduce((s, t) => s + t.duracionMin, 0);
    const cargaPct = horizonMin > 0 ? Math.round((min / horizonMin) * 100) : 0;
    let estadoCarga: CargaOperario['estadoCarga'] = 'adecuada';
    if (cargaPct > o.cargaMaxima) estadoCarga = 'sobrecarga';
    else if (cargaPct < parametros.umbralCargaBaja) estadoCarga = 'baja';
    return {
      operarioId: o.id,
      minutosDisponibles: horizonMin,
      minutosAsignados: min,
      cargaPct,
      estadoCarga,
    };
  });

  const finEstimadoMin = tareas.reduce((mx, t) => Math.max(mx, t.finMin), 0);
  const cargaPromedioPct =
    cargas.length > 0 ? Math.round(cargas.reduce((s, c) => s + c.cargaPct, 0) / cargas.length) : 0;
  const galonesPlaneados = tanquesPlaneados * galonesPorTanque;
  const metaAlcanzable = tanquesPlaneados >= metaTanques;
  const tanquesUsados = [...new Set(tareas.map((t) => t.tanqueId).filter((t) => t && t !== '—'))];

  const opCount: Record<string, number> = {};
  tareas.forEach((t) => {
    opCount[t.operacionId] = (opCount[t.operacionId] ?? 0) + t.duracionMin;
  });
  const cuelloDeBotella = Object.entries(opCount).sort((a, b) => b[1] - a[1])[0]?.[0];
  const cuelloNombre = opsOrdenadas.find((o) => o.id === cuelloDeBotella)?.nombre;

  if (tanquesFisicos.length > 0 && operariosSel.length > 0) {
    if (metaAlcanzable) {
      alertas.push({
        id: genId('al'),
        nivel: 'exito',
        mensaje: `Meta alcanzable: ${tanquesPlaneados} tanques (${galonesPlaneados} galones) dentro del horario.`,
      });
    } else {
      alertas.push({
        id: genId('al'),
        nivel: 'advertencia',
        mensaje: `Meta no alcanzable. Programados ${tanquesPlaneados} de ${metaTanques} tanques.`,
      });
    }
  }

  cargas.forEach((c) => {
    const op = operariosSel.find((o) => o.id === c.operarioId);
    if (!op || c.estadoCarga !== 'sobrecarga') return;
    alertas.push({
      id: genId('al'),
      nivel: 'advertencia',
      mensaje: `${op.nombre} queda sobrecargado (${c.cargaPct}% > ${op.cargaMaxima}% máximo).`,
    });
  });

  if (cuelloNombre) {
    alertas.push({
      id: genId('al'),
      nivel: 'info',
      mensaje: `Cuello de botella estimado: ${cuelloNombre} (mayor tiempo acumulado en el plan).`,
    });
  }

  if (cargas.length > 0 && cargaPromedioPct < parametros.umbralCargaBaja) {
    alertas.push({
      id: genId('al'),
      nivel: 'info',
      mensaje: `Tiempo ocioso alto: carga promedio ${cargaPromedioPct}%. Considere reducir tanques u operarios.`,
    });
  }

  if (tanquesBloqueados.length > 0 && !metaAlcanzable) {
    alertas.push({
      id: genId('al'),
      nivel: 'advertencia',
      mensaje: `${tanquesBloqueados.length} tanque(s) no disponible(s) limitan la programación.`,
    });
  }

  return {
    tareas,
    cargas,
    alertas,
    galonesPlaneados,
    tanquesPlaneados,
    finEstimadoMin,
    cargaPromedioPct,
    metaAlcanzable,
    tanquesUsados,
    cuelloDeBotella: cuelloNombre,
  };
}

export function programarJornada(jornada: Jornada, parametros: Parametros): ResultadoProgramacion {
  const inicio = hhmmToMinutes(jornada.horaInicio);
  const fin = hhmmToMinutes(jornada.horaFin);
  const horizonMin = Math.max(0, fin - inicio);
  const tanquesFisicos = jornada.tanquesIds.filter((t) => !jornada.tanquesBloqueadosIds.includes(t));
  const operarios = jornada.operariosSnapshot.filter((o) => jornada.operariosIds.includes(o.id));

  return programar({
    horizonMin,
    horaInicioAbs: inicio,
    operarios,
    tanquesFisicos,
    tanquesBloqueados: jornada.tanquesBloqueadosIds,
    metaTanques: jornada.metaTanques,
    galonesPorTanque: jornada.galonesPorTanque,
    productos: jornada.productos,
    proceso: jornada.proceso,
    parametros,
  });
}

/**
 * Comparación rápida con N operarios.
 * Usa el snapshot completo (activos), priorizando los del plan actual,
 * para que "con 3" no quede igual a "con 2" solo porque el plan eligió 2.
 */
export function compararOperarios(
  jornada: Jornada,
  parametros: Parametros,
  cantidad: number,
): { tanques: number; finMin: number; galones: number } {
  const inicio = hhmmToMinutes(jornada.horaInicio);
  const fin = hhmmToMinutes(jornada.horaFin);
  const horizonMin = Math.max(0, fin - inicio);
  const tanquesFisicos = jornada.tanquesIds.filter((t) => !jornada.tanquesBloqueadosIds.includes(t));

  const seleccionados = jornada.operariosSnapshot.filter(
    (o) => o.activo && jornada.operariosIds.includes(o.id),
  );
  const extras = jornada.operariosSnapshot.filter(
    (o) => o.activo && !jornada.operariosIds.includes(o.id),
  );
  const operarios = [...seleccionados, ...extras].slice(0, cantidad);

  const res = programar({
    horizonMin,
    horaInicioAbs: inicio,
    operarios,
    tanquesFisicos,
    tanquesBloqueados: jornada.tanquesBloqueadosIds,
    metaTanques: jornada.metaTanques,
    galonesPorTanque: jornada.galonesPorTanque,
    productos: jornada.productos,
    proceso: jornada.proceso,
    parametros,
  });

  return {
    tanques: res.tanquesPlaneados,
    finMin: res.finEstimadoMin,
    galones: res.galonesPlaneados,
  };
}

// ---- Indicadores ----

export interface IndicadoresJornada {
  galonesPlaneados: number;
  galonesFabricados: number;
  cumplimientoPct: number;
  eficienciaPlantaPct: number;
  tanquesPlaneados: number;
  tanquesTerminados: number;
  retrasoAcumuladoMin: number;
  eficienciaOperativaPct: number;
  stdCompletadoMin: number;
  stdPlaneadoAlCorteMin: number;
}

export interface IndicadorOperario {
  operarioId: string;
  nombre: string;
  eficienciaPct: number;
  cargaPct: number;
  tareasCompletadas: number;
  retrasoMin: number;
}

function loteCompleto(tareas: TareaProgramada[], tanqueId: string, loteIndex: number): boolean {
  const lote = tareas.filter((t) => t.tanqueId === tanqueId && t.loteIndex === loteIndex);
  return lote.length > 0 && lote.every((t) => t.estado === 'terminado' || t.estado === 'retrasado');
}

function tareaCompletada(t: TareaProgramada): boolean {
  return t.realFinMin != null && t.realInicioMin != null;
}

export function calcularIndicadores(jornada: Jornada): IndicadoresJornada {
  const res = jornada.resultado;
  const corte = jornada.simClockMin ?? res?.finEstimadoMin ?? 0;

  if (!res) {
    return {
      galonesPlaneados: 0,
      galonesFabricados: 0,
      cumplimientoPct: 0,
      eficienciaPlantaPct: 0,
      tanquesPlaneados: 0,
      tanquesTerminados: 0,
      retrasoAcumuladoMin: 0,
      eficienciaOperativaPct: 0,
      stdCompletadoMin: 0,
      stdPlaneadoAlCorteMin: 0,
    };
  }

  const lotes = new Set(res.tareas.map((t) => `${t.tanqueId}#${t.loteIndex}`));
  let tanquesTerminados = 0;
  lotes.forEach((key) => {
    const [tanqueId, idx] = key.split('#');
    if (tanqueId === '—') return;
    if (loteCompleto(res.tareas, tanqueId, parseInt(idx, 10))) tanquesTerminados += 1;
  });

  const galonesFabricados =
    (jornada.tanquesReales ?? tanquesTerminados) * jornada.galonesPorTanque;
  const tanquesReales = jornada.tanquesReales ?? tanquesTerminados;
  const cumplimientoPct =
    res.galonesPlaneados > 0 ? Math.round((galonesFabricados / res.galonesPlaneados) * 100) : 0;

  const completadas = res.tareas.filter(tareaCompletada);
  const stdCompletadas = completadas.reduce((s, t) => s + t.duracionMin, 0);
  const realUsado = completadas.reduce(
    (s, t) => s + Math.max(0, (t.realFinMin as number) - (t.realInicioMin as number)),
    0,
  );
  const eficienciaPlantaPct = realUsado > 0 ? Math.round((stdCompletadas / realUsado) * 100) : 0;

  const retrasoAcumuladoMin = completadas.reduce((s, t) => {
    const real = (t.realFinMin as number) - (t.realInicioMin as number);
    return s + Math.max(0, real - t.duracionMin);
  }, 0);

  const stdPlaneadoAlCorte = res.tareas
    .filter((t) => t.finMin <= corte)
    .reduce((s, t) => s + t.duracionMin, 0);
  const stdRealAlCorte = res.tareas
    .filter(tareaCompletada)
    .filter((t) => (t.realFinMin as number) <= corte)
    .reduce((s, t) => s + t.duracionMin, 0);
  const eficienciaOperativaPct =
    stdPlaneadoAlCorte > 0 ? Math.round((stdRealAlCorte / stdPlaneadoAlCorte) * 100) : 100;

  return {
    galonesPlaneados: res.galonesPlaneados,
    galonesFabricados,
    cumplimientoPct,
    eficienciaPlantaPct,
    tanquesPlaneados: res.tanquesPlaneados,
    tanquesTerminados: tanquesReales,
    retrasoAcumuladoMin,
    eficienciaOperativaPct,
    stdCompletadoMin: stdRealAlCorte,
    stdPlaneadoAlCorteMin: stdPlaneadoAlCorte,
  };
}

export function calcularIndicadoresOperario(jornada: Jornada): IndicadorOperario[] {
  const res = jornada.resultado;
  if (!res) return [];
  return jornada.operariosSnapshot
    .filter((o) => jornada.operariosIds.includes(o.id))
    .map((o) => {
      const tareasOp = res.tareas.filter((t) => tareaAsignadaA(t, o.id));
      const completadas = tareasOp.filter(tareaCompletada);
      const std = completadas.reduce((s, t) => s + t.duracionMin, 0);
      const real = completadas.reduce(
        (s, t) => s + Math.max(0, (t.realFinMin as number) - (t.realInicioMin as number)),
        0,
      );
      const eficienciaPct = real > 0 ? Math.round((std / real) * 100) : 0;
      const retrasoMin = completadas.reduce((s, t) => {
        const r = (t.realFinMin as number) - (t.realInicioMin as number);
        return s + Math.max(0, r - t.duracionMin);
      }, 0);
      const carga = res.cargas.find((c) => c.operarioId === o.id);
      return {
        operarioId: o.id,
        nombre: o.nombre,
        eficienciaPct,
        cargaPct: carga?.cargaPct ?? 0,
        tareasCompletadas: completadas.length,
        retrasoMin,
      };
    });
}

export interface CorteAvance {
  horaOffsetMin: number;
  planeadoAcum: number;
  realAcum: number;
  diferencia: number;
  eficienciaPct: number;
  stdPlaneadoAcum: number;
  stdRealAcum: number;
  eficienciaOperativaPct: number;
}

export function calcularCortes(jornada: Jornada, pasoMin = 60): CorteAvance[] {
  const res = jornada.resultado;
  if (!res || res.finEstimadoMin === 0) return [];

  const galPorTanque = jornada.galonesPorTanque;
  const lotesKeys = Array.from(
    new Set(res.tareas.filter((t) => t.tanqueId !== '—').map((t) => `${t.tanqueId}#${t.loteIndex}`)),
  );

  const finPlaneado: number[] = [];
  const finReal: (number | null)[] = [];
  lotesKeys.forEach((key) => {
    const [tanqueId, idx] = key.split('#');
    const lote = res.tareas.filter((t) => t.tanqueId === tanqueId && t.loteIndex === parseInt(idx, 10));
    finPlaneado.push(Math.max(...lote.map((t) => t.finMin)));
    const completo = lote.every(tareaCompletada);
    finReal.push(completo ? Math.max(...lote.map((t) => t.realFinMin as number)) : null);
  });

  const cortes: CorteAvance[] = [];
  const maxMin = Math.ceil(res.finEstimadoMin / pasoMin) * pasoMin;
  for (let corte = pasoMin; corte <= maxMin; corte += pasoMin) {
    const planeadoAcum = finPlaneado.filter((f) => f <= corte).length * galPorTanque;
    const realAcum = finReal.filter((f) => f != null && (f as number) <= corte).length * galPorTanque;
    const stdPlaneadoAcum = res.tareas.filter((t) => t.finMin <= corte).reduce((s, t) => s + t.duracionMin, 0);
    const stdRealAcum = res.tareas
      .filter(tareaCompletada)
      .filter((t) => (t.realFinMin as number) <= corte)
      .reduce((s, t) => s + t.duracionMin, 0);
    const diferencia = realAcum - planeadoAcum;
    const eficienciaPct = planeadoAcum > 0 ? Math.round((realAcum / planeadoAcum) * 100) : 0;
    const eficienciaOperativaPct =
      stdPlaneadoAcum > 0 ? Math.round((stdRealAcum / stdPlaneadoAcum) * 100) : 100;
    cortes.push({
      horaOffsetMin: corte,
      planeadoAcum,
      realAcum,
      diferencia,
      eficienciaPct,
      stdPlaneadoAcum,
      stdRealAcum,
      eficienciaOperativaPct,
    });
  }
  return cortes;
}

export function estadoJornadaSemaforo(
  eficienciaPct: number,
  parametros: Parametros,
): { label: string; nivel: EstadoOperacion } {
  if (eficienciaPct >= parametros.semaforoVerde) return { label: 'En tiempo', nivel: 'terminado' };
  if (eficienciaPct >= parametros.semaforoAmarillo) return { label: 'En riesgo', nivel: 'proceso' };
  return { label: 'Retrasado', nivel: 'retrasado' };
}
