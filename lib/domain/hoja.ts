import type { Jornada, PausaOperario, TareaProgramada } from './types';
import { offsetToClock, hhmmToMinutes } from './time';
import { colorTanque } from './brand';

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

export interface CeldaDistribucion {
  texto?: string;
  activo?: boolean;
}

export interface FilaDistribucion {
  horaOffsetMin: number;
  horaLabel: string;
  celdas: Record<string, CeldaDistribucion>;
  pausaNombre?: string;
}

export interface GrillaDistribucion {
  columnas: { tanqueId: string; color: string }[];
  filas: FilaDistribucion[];
}

const PASO_MIN = 5;

/** Colores por tanque (paleta Kolorflex: K azul / F rojo). */
export const COLORES_TANQUE: Record<string, string> = {
  T1: colorTanque('T1'),
  T2: colorTanque('T2'),
  T3: colorTanque('T3'),
  T4: colorTanque('T4'),
  T5: colorTanque('T5'),
  T6: colorTanque('T6'),
};

function tanquePorLote(tareas: TareaProgramada[]): Map<number, string> {
  const map = new Map<number, string>();
  for (const t of tareas) {
    if (t.tanqueId && t.tanqueId !== '—') map.set(t.loteIndex, t.tanqueId);
  }
  return map;
}

function numeroTanque(tanqueId: string): string {
  return tanqueId.replace(/^T/i, '');
}

/** Etiquetas en mayúsculas como el Excel de planta. */
export function etiquetaHitoExcel(
  operacionId: string,
  tanqueId: string,
  opts?: { finPesajeInicioMontaje?: boolean },
): string {
  const n = numeroTanque(tanqueId);
  switch (operacionId) {
    case 'pesaje':
      return `INICIO PESAJE TANQUE ${n}`;
    case 'montaje':
      return opts?.finPesajeInicioMontaje
        ? `FIN DEL PESAJE TANQUE ${n} E INICIO DEL MONTAJE TANQUE ${n}`
        : `INICIO MONTAJE TANQUE ${n}`;
    case 'celulosa1':
      return `AGREGAR PRIMERA CELULOSA AL TANQUE ${n}`;
    case 'celulosa2':
      return `AGREGAR LA SEGUNDA CELULOSA AL TANQUE ${n}`;
    case 'resina':
      return `AGREGO RESINA AL TANQUE ${n}`;
    case 'finalizacion':
      return `FIN DEL PROCESO EN TANQUE ${n}`;
    default:
      return '';
  }
}

function pausasComoOffsets(pausas: PausaOperario[], baseInicioMin: number) {
  return pausas.map((p) => {
    const abs = hhmmToMinutes(p.inicio);
    const inicioMin = abs - baseInicioMin;
    return { nombre: p.nombre.toUpperCase(), inicioMin, finMin: inicioMin + p.duracionMin };
  });
}

function enPausa(min: number, pausas: { inicioMin: number; finMin: number }[]): boolean {
  return pausas.some((p) => min >= p.inicioMin && min < p.finMin);
}

function nombrePausa(min: number, pausas: { nombre: string; inicioMin: number; finMin: number }[]): string | undefined {
  const p = pausas.find((x) => min >= x.inicioMin && min < x.finMin);
  return p?.nombre;
}

function bucketMin(min: number): number {
  return Math.floor(min / PASO_MIN) * PASO_MIN;
}

/** Grilla tipo Excel: columna HORA + una columna por tanque, filas cada 5 min. */
export function grillaDistribucionExcel(
  tareas: TareaProgramada[],
  baseInicioMin: number,
  pausas: PausaOperario[] = [],
): GrillaDistribucion {
  const loteTanque = tanquePorLote(tareas);
  const tanques = [...new Set([...loteTanque.values()])].sort();
  const columnas = tanques.map((tanqueId) => ({
    tanqueId,
    color: COLORES_TANQUE[tanqueId] ?? '#EEEEEE',
  }));

  const hitos = new Map<string, string>();
  const tareasPorLote = new Map<number, TareaProgramada[]>();
  for (const t of tareas) {
    tareasPorLote.set(t.loteIndex, [...(tareasPorLote.get(t.loteIndex) ?? []), t]);
  }

  for (const t of tareas.filter((x) => x.tipo !== 'pasivo')) {
    const tanqueId =
      t.tanqueId !== '—' ? t.tanqueId : loteTanque.get(t.loteIndex);
    if (!tanqueId) continue;
    const b = bucketMin(t.inicioMin);
    const key = `${tanqueId}@${b}`;
    if (t.operacionId === 'montaje') {
      const tienePesaje = (tareasPorLote.get(t.loteIndex) ?? []).some((x) => x.operacionId === 'pesaje');
      hitos.set(key, etiquetaHitoExcel('montaje', tanqueId, { finPesajeInicioMontaje: tienePesaje }));
    } else if (t.operacionId === 'pesaje') {
      hitos.set(key, etiquetaHitoExcel('pesaje', tanqueId));
    } else {
      const label = etiquetaHitoExcel(t.operacionId, tanqueId);
      if (label) hitos.set(key, label);
    }
  }

  const tareasTanque = tareas.filter((t) => t.tanqueId && t.tanqueId !== '—');
  const pausaOffsets = pausasComoOffsets(pausas, baseInicioMin);
  const finMax = Math.max(
    0,
    ...tareas.map((t) => t.finMin),
    ...pausaOffsets.map((p) => p.finMin),
  );
  const finGrid = Math.ceil(finMax / PASO_MIN) * PASO_MIN;

  const filas: FilaDistribucion[] = [];

  for (let min = 0; min <= finGrid; min += PASO_MIN) {
    const horaLabel = offsetToClock(baseInicioMin, min);
    const celdas: Record<string, CeldaDistribucion> = {};
    const pausaNombre = nombrePausa(min, pausaOffsets);

    if (min === 0 && columnas.length > 0) {
      celdas[columnas[0].tanqueId] = { texto: 'HORARIO DE ENTRADA' };
    } else if (!pausaNombre) {
      for (const col of columnas) {
        const texto = hitos.get(`${col.tanqueId}@${min}`);
        const activo = tareasTanque.some(
          (t) => t.tanqueId === col.tanqueId && t.inicioMin <= min + 0.001 && t.finMin > min + 0.001,
        );
        celdas[col.tanqueId] = { texto, activo: activo && !texto };
      }
    }

    filas.push({ horaOffsetMin: min, horaLabel, celdas, pausaNombre });
  }

  return { columnas, filas };
}

const PASO_MIN_LEGACY = PASO_MIN;

function etiquetaTarea(t: TareaProgramada): string {
  const tanque =
    t.tanqueId && t.tanqueId !== '—' ? ` ${t.tanqueId.replace('T', 'Tanque ')}` : '';
  return `${t.operacionNombre}${tanque}`;
}

/** Agrupa tareas por instante de inicio (redondeado a 5 min) — usado en Control. */
export function filasHorariasDesdeTareas(
  tareas: TareaProgramada[],
  baseInicioMin: number,
): FilaHojaHoraria[] {
  const porMinuto = new Map<number, Set<string>>();

  for (const t of tareas) {
    if (t.tipo === 'pasivo') continue;
    const bucket = Math.floor(t.inicioMin / PASO_MIN_LEGACY) * PASO_MIN_LEGACY;
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

  for (let min = 0; min <= finMax; min += PASO_MIN_LEGACY) {
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
      inicio: pick('pesaje') ?? pick('montaje'),
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
