import type { Jornada, TareaProgramada } from './types';
import { offsetToClock, hhmmToMinutes } from './time';

export interface FilaHojaHoraria {
  horaOffsetMin: number;
  horaLabel: string;
  actividades: string[];
}

export interface ResumenTanqueHoja {
  tanqueId: string;
  loteIndex: number;
  producto: string;
  instruccion: string;
  inicio?: string;
  celulosa1?: string;
  celulosa2?: string;
  resina?: string;
  fin?: string;
}

const PASO_MIN = 5;

function etiquetaTarea(t: TareaProgramada): string {
  const tanque =
    t.tanqueId && t.tanqueId !== '—' ? ` ${t.tanqueId.replace('T', 'Tanque ')}` : '';
  return `${t.operacionNombre}${tanque}`;
}

/** Agrupa tareas por instante de inicio (redondeado a 5 min) para tabla tipo Excel. */
export function filasHorariasDesdeTareas(
  tareas: TareaProgramada[],
  baseInicioMin: number,
): FilaHojaHoraria[] {
  const porMinuto = new Map<number, Set<string>>();

  for (const t of tareas) {
    if (t.tipo === 'pasivo') continue;
    const bucket = Math.floor(t.inicioMin / PASO_MIN) * PASO_MIN;
    if (!porMinuto.has(bucket)) porMinuto.set(bucket, new Set());
    porMinuto.get(bucket)!.add(etiquetaTarea(t));
  }

  return [...porMinuto.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([min, acts]) => ({
      horaOffsetMin: min,
      horaLabel: offsetToClock(baseInicioMin, min),
      actividades: [...acts].sort(),
    }));
}

/** Filas cada 5 min con actividades que están en curso (para vista supervisor). */
export function filasHorariasEnCurso(
  tareas: TareaProgramada[],
  baseInicioMin: number,
): FilaHojaHoraria[] {
  const finMax = tareas.reduce((m, t) => Math.max(m, t.finMin), 0);
  const filas: FilaHojaHoraria[] = [];

  for (let min = 0; min <= finMax; min += PASO_MIN) {
    const activas = tareas.filter(
      (t) => t.tipo !== 'pasivo' && t.inicioMin <= min + 0.001 && t.finMin > min + 0.001,
    );
    if (activas.length === 0) continue;
    filas.push({
      horaOffsetMin: min,
      horaLabel: offsetToClock(baseInicioMin, min),
      actividades: activas.map(etiquetaTarea).sort(),
    });
  }
  return filas;
}

export function resumenPorTanque(
  tareas: TareaProgramada[],
  baseInicioMin: number,
): ResumenTanqueHoja[] {
  const keys = new Set(
    tareas.filter((t) => t.tanqueId !== '—').map((t) => `${t.tanqueId}#${t.loteIndex}`),
  );

  const filas: ResumenTanqueHoja[] = [];
  keys.forEach((key) => {
    const [tanqueId, idxStr] = key.split('#');
    const loteIndex = parseInt(idxStr, 10);
    const lote = tareas
      .filter((t) => t.tanqueId === tanqueId && t.loteIndex === loteIndex)
      .sort((a, b) => a.inicioMin - b.inicioMin);
    if (!lote.length) return;

    const pick = (opId: string) =>
      lote.find((t) => t.operacionId === opId)
        ? offsetToClock(baseInicioMin, lote.find((t) => t.operacionId === opId)!.inicioMin)
        : undefined;

    filas.push({
      tanqueId,
      loteIndex,
      producto: lote[0].productoNombre,
      instruccion: lote[0].productoInstruccion ?? '',
      inicio: pick('montaje') ?? pick('pesaje'),
      celulosa1: pick('celulosa1'),
      celulosa2: pick('celulosa2'),
      resina: pick('resina'),
      fin: pick('finalizacion'),
    });
  });

  return filas.sort((a, b) => a.tanqueId.localeCompare(b.tanqueId) || a.loteIndex - b.loteIndex);
}

export function baseInicioJornada(jornada: Jornada): number {
  return hhmmToMinutes(jornada.horaInicio);
}
