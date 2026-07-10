'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Operario,
  Tanque,
  OperacionEstandar,
  MotivoRetraso,
  Jornada,
  EstadoTanque,
  EstadoOperacion,
  ProductoPlan,
  PausaOperario,
  TareaProgramada,
} from '@/lib/domain/types';
import {
  OPERARIOS_INICIALES,
  TANQUES_INICIALES,
  PROCESO_INICIAL,
  MOTIVOS_INICIALES,
  PARAMETROS_INICIALES,
  PAUSAS_INICIALES,
  normalizarProductos,
  type Parametros,
  genId,
} from '@/lib/domain/defaults';
import { programarJornada } from '@/lib/domain/engine';

interface NuevaJornadaInput {
  fecha: string;
  turno: string;
  horaInicio: string;
  horaFin: string;
  operariosIds: string[];
  tanquesIds: string[];
  tanquesBloqueadosIds: string[];
  metaTanques: number;
  galonesPorTanque: number;
  productos: ProductoPlan[];
  prioridad: Jornada['prioridad'];
}

interface AppState {
  operarios: Operario[];
  tanques: Tanque[];
  proceso: OperacionEstandar[];
  motivos: MotivoRetraso[];
  parametros: Parametros;
  jornadas: Jornada[];
  jornadaActivaId: string | null;

  crearOperario: (o: Omit<Operario, 'id'>) => void;
  actualizarOperario: (id: string, patch: Partial<Operario>) => void;
  toggleOperario: (id: string) => void;
  eliminarOperario: (id: string) => void;

  actualizarTanque: (id: string, patch: Partial<Tanque>) => void;
  setEstadoTanque: (id: string, estado: EstadoTanque) => void;

  actualizarOperacion: (id: string, patch: Partial<OperacionEstandar>) => void;

  agregarMotivo: (nombre: string) => void;
  eliminarMotivo: (id: string) => void;
  actualizarParametros: (patch: Partial<Parametros>) => void;
  agregarPausa: (pausa: Omit<PausaOperario, 'id'>) => void;
  eliminarPausa: (id: string) => void;
  actualizarPausa: (id: string, patch: Partial<PausaOperario>) => void;

  crearJornada: (input: NuevaJornadaInput) => string;
  recalcularJornada: (id: string) => void;
  aprobarJornada: (id: string) => void;
  cerrarJornada: (id: string) => void;
  setObservacionFinal: (id: string, texto: string) => void;
  eliminarJornada: (id: string) => void;

  registrarInicioReal: (jornadaId: string, tareaId: string, min: number) => void;
  registrarFinReal: (
    jornadaId: string,
    tareaId: string,
    min: number,
    motivoRetrasoId?: string | null,
    observacion?: string | null,
  ) => void;
  marcarTanqueDisponibleEnJornada: (jornadaId: string, tanqueId: string) => void;

  avanzarSimulacion: (jornadaId: string, minutos: number) => void;
  simularJornadaCompleta: (jornadaId: string) => void;

  jornadaActiva: () => Jornada | undefined;
  jornadaPorId: (id: string) => Jornada | undefined;

  exportarDatosDemo: () => void;
  importarDatosDemo: (json: string) => void;
  reiniciarDatosDemo: () => void;
}

function mapTareas(
  jornada: Jornada,
  tareaId: string,
  fn: (t: TareaProgramada) => TareaProgramada,
): Jornada {
  if (!jornada.resultado) return jornada;
  return {
    ...jornada,
    resultado: {
      ...jornada.resultado,
      tareas: jornada.resultado.tareas.map((t) => (t.id === tareaId ? fn(t) : t)),
    },
  };
}

function aplicarSimulacionHasta(jornada: Jornada, hastaMin: number): Jornada {
  if (!jornada.resultado) return jornada;
  const tareas = [...jornada.resultado.tareas].sort((a, b) => a.inicioMin - b.inicioMin);
  const actualizadas = tareas.map((t) => {
    if (t.realFinMin != null) return t;
    if (t.finMin > hastaMin) return t;
    const retraso = Math.random() < 0.12;
    const factor = retraso ? 1.25 + Math.random() * 0.3 : 0.95 + Math.random() * 0.1;
    const realDur = Math.max(1, Math.round(t.duracionMin * factor));
    const realInicio = Math.max(t.inicioMin, t.realInicioMin ?? t.inicioMin);
    const realFin = realInicio + realDur;
    if (realFin > hastaMin) {
      if (t.realInicioMin == null && t.inicioMin <= hastaMin) {
        return { ...t, realInicioMin: t.inicioMin, estado: 'proceso' as EstadoOperacion };
      }
      return t;
    }
    const estado: EstadoOperacion = retraso ? 'retrasado' : 'terminado';
    return {
      ...t,
      realInicioMin: t.inicioMin,
      realFinMin: realFin,
      estado: t.tipo === 'pasivo' ? ('terminado' as EstadoOperacion) : estado,
      motivoRetrasoId: retraso ? 'proceso_largo' : t.motivoRetrasoId,
    };
  });
  return {
    ...jornada,
    simClockMin: hastaMin,
    resultado: { ...jornada.resultado, tareas: actualizadas },
  };
}

function migrarJornada(j: Jornada): Jornada {
  return {
    ...j,
    productos: normalizarProductos(j.productos as ProductoPlan[] | string[]),
    simClockMin: j.simClockMin ?? 0,
  };
}

export const PERSIST_KEY = 'balanceador-produccion-v2';

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      operarios: OPERARIOS_INICIALES,
      tanques: TANQUES_INICIALES,
      proceso: PROCESO_INICIAL,
      motivos: MOTIVOS_INICIALES,
      parametros: PARAMETROS_INICIALES,
      jornadas: [],
      jornadaActivaId: null,

      crearOperario: (o) =>
        set((s) => ({ operarios: [...s.operarios, { ...o, id: genId('op') }] })),
      actualizarOperario: (id, patch) =>
        set((s) => ({
          operarios: s.operarios.map((o) => (o.id === id ? { ...o, ...patch } : o)),
        })),
      toggleOperario: (id) =>
        set((s) => ({
          operarios: s.operarios.map((o) => (o.id === id ? { ...o, activo: !o.activo } : o)),
        })),
      eliminarOperario: (id) =>
        set((s) => ({ operarios: s.operarios.filter((o) => o.id !== id) })),

      actualizarTanque: (id, patch) =>
        set((s) => ({ tanques: s.tanques.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),
      setEstadoTanque: (id, estado) =>
        set((s) => ({ tanques: s.tanques.map((t) => (t.id === id ? { ...t, estado } : t)) })),

      actualizarOperacion: (id, patch) =>
        set((s) => ({
          proceso: s.proceso.map((op) => (op.id === id ? { ...op, ...patch } : op)),
        })),

      agregarMotivo: (nombre) =>
        set((s) => ({ motivos: [...s.motivos, { id: genId('mv'), nombre }] })),
      eliminarMotivo: (id) => set((s) => ({ motivos: s.motivos.filter((m) => m.id !== id) })),
      actualizarParametros: (patch) =>
        set((s) => ({ parametros: { ...s.parametros, ...patch } })),

      agregarPausa: (pausa) =>
        set((s) => ({
          parametros: {
            ...s.parametros,
            pausas: [...(s.parametros.pausas ?? []), { ...pausa, id: genId('pa') }],
          },
        })),
      eliminarPausa: (id) =>
        set((s) => ({
          parametros: {
            ...s.parametros,
            pausas: (s.parametros.pausas ?? []).filter((p) => p.id !== id),
          },
        })),
      actualizarPausa: (id, patch) =>
        set((s) => ({
          parametros: {
            ...s.parametros,
            pausas: (s.parametros.pausas ?? []).map((p) => (p.id === id ? { ...p, ...patch } : p)),
          },
        })),

      crearJornada: (input) => {
        const state = get();
        const id = genId('jor');
        const operariosSnapshot = state.operarios.map((o) => ({ ...o }));
        const proceso = state.proceso.map((p) => ({ ...p }));
        const base: Jornada = {
          id,
          ...input,
          estado: 'borrador',
          proceso,
          operariosSnapshot,
          resultado: null,
          creadaEn: new Date().toISOString(),
          simClockMin: 0,
        };
        const resultado = programarJornada(base, state.parametros);
        const jornada: Jornada = { ...base, resultado };
        set((s) => ({
          jornadas: [jornada, ...s.jornadas.filter((j) => j.id !== id)],
          jornadaActivaId: id,
        }));
        return id;
      },

      recalcularJornada: (id) =>
        set((s) => ({
          jornadas: s.jornadas.map((j) =>
            j.id === id ? { ...j, resultado: programarJornada(j, s.parametros) } : j,
          ),
        })),

      aprobarJornada: (id) =>
        set((s) => ({
          jornadas: s.jornadas.map((j) =>
            j.id === id ? { ...j, estado: 'aprobada', simClockMin: j.simClockMin ?? 0 } : j,
          ),
          jornadaActivaId: id,
        })),

      cerrarJornada: (id) =>
        set((s) => ({
          jornadas: s.jornadas.map((j) => (j.id === id ? { ...j, estado: 'cerrada' } : j)),
        })),

      setObservacionFinal: (id, texto) =>
        set((s) => ({
          jornadas: s.jornadas.map((j) => (j.id === id ? { ...j, observacionFinal: texto } : j)),
        })),

      eliminarJornada: (id) =>
        set((s) => ({
          jornadas: s.jornadas.filter((j) => j.id !== id),
          jornadaActivaId: s.jornadaActivaId === id ? null : s.jornadaActivaId,
        })),

      registrarInicioReal: (jornadaId, tareaId, min) =>
        set((s) => ({
          jornadas: s.jornadas.map((j) =>
            j.id !== jornadaId
              ? j
              : mapTareas(j, tareaId, (t) => ({
                  ...t,
                  realInicioMin: min,
                  estado: 'proceso' as EstadoOperacion,
                })),
          ),
        })),

      registrarFinReal: (jornadaId, tareaId, min, motivoRetrasoId, observacion) =>
        set((s) => ({
          jornadas: s.jornadas.map((j) =>
            j.id !== jornadaId
              ? j
              : mapTareas(j, tareaId, (t) => {
                  const inicio = t.realInicioMin ?? min;
                  const real = min - inicio;
                  const retrasado = real > t.duracionMin + 2;
                  return {
                    ...t,
                    realInicioMin: inicio,
                    realFinMin: min,
                    motivoRetrasoId: motivoRetrasoId ?? t.motivoRetrasoId ?? null,
                    observacion: observacion ?? t.observacion ?? null,
                    estado: (retrasado ? 'retrasado' : 'terminado') as EstadoOperacion,
                  };
                }),
          ),
        })),

      marcarTanqueDisponibleEnJornada: (jornadaId, tanqueId) =>
        set((s) => ({
          jornadas: s.jornadas.map((j) => {
            if (j.id !== jornadaId) return j;
            const updated: Jornada = {
              ...j,
              tanquesBloqueadosIds: j.tanquesBloqueadosIds.filter((t) => t !== tanqueId),
              tanquesIds: j.tanquesIds.includes(tanqueId) ? j.tanquesIds : [...j.tanquesIds, tanqueId],
            };
            return { ...updated, resultado: programarJornada(updated, s.parametros) };
          }),
        })),

      avanzarSimulacion: (jornadaId, minutos) =>
        set((s) => ({
          jornadas: s.jornadas.map((j) => {
            if (j.id !== jornadaId) return j;
            const hasta = (j.simClockMin ?? 0) + minutos;
            return aplicarSimulacionHasta(j, hasta);
          }),
        })),

      simularJornadaCompleta: (jornadaId) =>
        set((s) => ({
          jornadas: s.jornadas.map((j) => {
            if (j.id !== jornadaId || !j.resultado) return j;
            return aplicarSimulacionHasta(j, j.resultado.finEstimadoMin);
          }),
        })),

      jornadaActiva: () => {
        const s = get();
        return s.jornadas.find((j) => j.id === s.jornadaActivaId);
      },
      jornadaPorId: (id) => get().jornadas.find((j) => j.id === id),

      exportarDatosDemo: () => {
        if (typeof window === 'undefined') return;
        const raw = localStorage.getItem(PERSIST_KEY);
        const payload = {
          version: 2,
          exportedAt: new Date().toISOString(),
          data: raw ? JSON.parse(raw) : null,
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `balanceador-demo-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
      },

      importarDatosDemo: (json) => {
        if (typeof window === 'undefined') return;
        const parsed = JSON.parse(json) as { data?: { state?: unknown }; state?: unknown } | { state?: unknown };
        const state = 'data' in parsed && parsed.data && typeof parsed.data === 'object' && 'state' in parsed.data
          ? parsed.data.state
          : 'state' in parsed
            ? parsed.state
            : parsed;
        if (!state || typeof state !== 'object') {
          throw new Error('Archivo inválido: no contiene estado de la app.');
        }
        localStorage.setItem(PERSIST_KEY, JSON.stringify({ state, version: 0 }));
        window.location.reload();
      },

      reiniciarDatosDemo: () => {
        if (typeof window === 'undefined') return;
        useStore.persist.clearStorage();
        window.location.reload();
      },
    }),
    {
      name: PERSIST_KEY,
      merge: (persisted, current) => {
        const p = persisted as Partial<AppState>;
        return {
          ...current,
          ...p,
          parametros: {
            ...PARAMETROS_INICIALES,
            ...p.parametros,
            pausas: p.parametros?.pausas ?? PAUSAS_INICIALES,
          },
          jornadas: (p.jornadas ?? []).map(migrarJornada),
        };
      },
    },
  ),
);
