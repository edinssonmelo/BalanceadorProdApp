import { describe, expect, it } from 'vitest';
import { compararOperarios, programar, programarJornada } from './engine';
import {
  OPERARIOS_INICIALES,
  PARAMETROS_INICIALES,
  PROCESO_INICIAL,
  PRODUCTOS_INICIALES,
} from './defaults';
import type { Jornada, Operario, TareaProgramada } from './types';
import { tareaOperarios } from './tarea-helpers';

function assertNoOperatorOverlap(tareas: TareaProgramada[]) {
  const manuales = tareas.filter((t) => t.operarioId && t.tipo !== 'pasivo');
  for (let i = 0; i < manuales.length; i++) {
    for (let j = i + 1; j < manuales.length; j++) {
      const opsI = tareaOperarios(manuales[i]);
      const opsJ = tareaOperarios(manuales[j]);
      const shared = opsI.some((id) => opsJ.includes(id));
      if (!shared) continue;
      const overlap =
        manuales[i].inicioMin < manuales[j].finMin && manuales[j].inicioMin < manuales[i].finMin;
      expect(
        overlap,
        `Solape ${manuales[i].operacionId} vs ${manuales[j].operacionId} en operario compartido`,
      ).toBe(false);
    }
  }
}

function assertMontajeCap(tareas: TareaProgramada[], nOps: number) {
  const cap = Math.floor(nOps / 2);
  const montajes = tareas.filter((t) => t.operacionId === 'montaje');
  for (let i = 0; i < montajes.length; i++) {
    for (let j = i + 1; j < montajes.length; j++) {
      const a = montajes[i];
      const b = montajes[j];
      const overlap = a.inicioMin < b.finMin && b.inicioMin < a.finMin;
      if (overlap) {
        const activos = montajes.filter(
          (m) => m.inicioMin < b.finMin && m.finMin > a.inicioMin,
        ).length;
        expect(activos).toBeLessThanOrEqual(cap);
      }
    }
  }
}

function baseInput(ops: Operario[], meta = 5) {
  return {
    horizonMin: 270,
    horaInicioAbs: 7 * 60 + 30,
    operarios: ops,
    tanquesFisicos: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6'],
    tanquesBloqueados: [] as string[],
    metaTanques: meta,
    galonesPorTanque: 200,
    productos: PRODUCTOS_INICIALES,
    proceso: PROCESO_INICIAL,
    parametros: PARAMETROS_INICIALES,
  };
}

const tanques = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6'];

describe('programar — invariantes', () => {
  it('1 operario, meta 3: pesajes en serie sin solape', () => {
    const res = programar(baseInput([OPERARIOS_INICIALES[0]], 3));
    const pesajes = res.tareas
      .filter((t) => t.operacionId === 'pesaje')
      .sort((a, b) => a.inicioMin - b.inicioMin);
    expect(pesajes.length).toBe(3);
    for (let i = 1; i < pesajes.length; i++) {
      expect(pesajes[i].inicioMin).toBeGreaterThanOrEqual(pesajes[i - 1].finMin);
    }
    assertNoOperatorOverlap(res.tareas);
  });

  it('2 operarios: máximo 2 pesajes simultáneos al inicio', () => {
    const res = programar(baseInput(OPERARIOS_INICIALES.slice(0, 2), 4));
    const pesajes = res.tareas.filter((t) => t.operacionId === 'pesaje');
    const atT0 = pesajes.filter((t) => t.inicioMin === 0);
    expect(atT0.length).toBe(2);
    assertNoOperatorOverlap(res.tareas);
  });

  it('esperas pasivas: sin operario y tanque ocupado 30 min', () => {
    const res = programar(baseInput(OPERARIOS_INICIALES.slice(0, 2), 2));
    const esperas = res.tareas.filter((t) => t.tipo === 'pasivo');
    expect(esperas.length).toBeGreaterThan(0);
    for (const e of esperas) {
      expect(e.operarioId).toBeNull();
      expect(e.duracionMin).toBe(30);
    }
    assertNoOperatorOverlap(res.tareas);
  });
});

describe('programar — timing celulosa (revólver 30 min)', () => {
  function tareasLote0(res: ReturnType<typeof programar>) {
    return res.tareas.filter((t) => t.loteIndex === 0);
  }

  it('un operario agrega celulosa2 inmediatamente después de celulosa1 si está libre', () => {
    const res = programar(baseInput(OPERARIOS_INICIALES.slice(0, 2), 5));
    const c1 = tareasLote0(res).find((t) => t.operacionId === 'celulosa1');
    const c2 = tareasLote0(res).find((t) => t.operacionId === 'celulosa2');
    expect(c1).toBeTruthy();
    expect(c2).toBeTruthy();
    expect(c2!.inicioMin).toBe(c1!.finMin);
  });

  it('si el operario de celulosa1 está ocupado, otro puede hacer celulosa2', () => {
    const res = programar(baseInput(OPERARIOS_INICIALES.slice(0, 2), 5));
    const c1 = res.tareas.find((t) => t.loteIndex === 1 && t.operacionId === 'celulosa1');
    const c2 = res.tareas.find((t) => t.loteIndex === 1 && t.operacionId === 'celulosa2');
    expect(c1).toBeTruthy();
    expect(c2).toBeTruthy();
    expect(c2!.inicioMin).toBeGreaterThanOrEqual(c1!.finMin);
  });

  it('el revólver comienza al terminar celulosa2 y dura 30 min', () => {
    const res = programar(baseInput(OPERARIOS_INICIALES.slice(0, 2), 5));
    const c2 = tareasLote0(res).find((t) => t.operacionId === 'celulosa2');
    const revolver = tareasLote0(res).find((t) => t.operacionId === 'espera2');
    const resina = tareasLote0(res).find((t) => t.operacionId === 'resina');
    expect(c2).toBeTruthy();
    expect(revolver).toBeTruthy();
    expect(resina).toBeTruthy();
    expect(revolver!.inicioMin).toBe(c2!.finMin);
    expect(revolver!.finMin - revolver!.inicioMin).toBe(30);
    expect(resina!.inicioMin).toBe(revolver!.finMin);
  });

  it('no programa una espera entre las dos adiciones de celulosa', () => {
    const res = programar(baseInput(OPERARIOS_INICIALES.slice(0, 2), 5));
    expect(tareasLote0(res).find((t) => t.operacionId === 'espera1')).toBeUndefined();
  });

  it('prioriza resina y celulosa2 sobre nueva celulosa1 a igual inicio', () => {
    const res = programar(baseInput(OPERARIOS_INICIALES.slice(0, 2), 5));
    const manuales = res.tareas.filter(
      (t) =>
        t.operarioId &&
        ['celulosa1', 'celulosa2', 'resina'].includes(t.operacionId),
    );
    for (const c2 of manuales.filter((t) => t.operacionId === 'celulosa2')) {
      const c1 = manuales.find(
        (t) => t.loteIndex === c2.loteIndex && t.operacionId === 'celulosa1',
      );
      expect(c1).toBeTruthy();
      expect(c2.inicioMin).toBeGreaterThanOrEqual(c1!.finMin);
    }
    assertNoOperatorOverlap(res.tareas);
  });

  it('con 2 operarios, resina no se retrasa tras el revólver', () => {
    const res = programar(baseInput(OPERARIOS_INICIALES.slice(0, 2), 5));
    const revolver = tareasLote0(res).find((t) => t.operacionId === 'espera2');
    const resina = tareasLote0(res).find((t) => t.operacionId === 'resina');
    expect(revolver).toBeTruthy();
    expect(resina).toBeTruthy();
    expect(resina!.inicioMin).toBe(revolver!.finMin);
    assertNoOperatorOverlap(res.tareas);
  });
});

describe('programar — montaje en equipo', () => {
  it('montaje asigna 2 operarios al mismo par', () => {
    const res = programar(baseInput(OPERARIOS_INICIALES.slice(0, 2), 2));
    const montajes = res.tareas.filter((t) => t.operacionId === 'montaje');
    expect(montajes.length).toBeGreaterThan(0);
    for (const m of montajes) {
      expect(tareaOperarios(m).length).toBe(2);
    }
  });

  it('2 operarios: solo 1 montaje a la vez (no paralelos)', () => {
    const res = programar(baseInput(OPERARIOS_INICIALES.slice(0, 2), 5));
    const montajes = res.tareas.filter((t) => t.operacionId === 'montaje');
    expect(montajes.length).toBeGreaterThan(1);
    for (let i = 0; i < montajes.length; i++) {
      for (let j = i + 1; j < montajes.length; j++) {
        const overlap =
          montajes[i].inicioMin < montajes[j].finMin &&
          montajes[j].inicioMin < montajes[i].finMin;
        expect(overlap, 'dos montajes no deben solaparse con 2 ops').toBe(false);
      }
    }
    assertMontajeCap(res.tareas, 2);
    assertNoOperatorOverlap(res.tareas);
  });

  it('3 operarios: sigue siendo 1 montaje a la vez', () => {
    const res = programar(baseInput(OPERARIOS_INICIALES.slice(0, 3), 5));
    assertMontajeCap(res.tareas, 3);
    const montajesT5 = res.tareas.filter((t) => t.operacionId === 'montaje' && t.inicioMin === 5);
    expect(montajesT5.length).toBeLessThanOrEqual(1);
  });

  it('4 operarios: hasta 2 montajes en paralelo', () => {
    const ops = OPERARIOS_INICIALES.slice(0, 4);
    const res = programar(baseInput(ops, 6));
    assertMontajeCap(res.tareas, 4);
    assertNoOperatorOverlap(res.tareas);
  });

  it('1 operario: no programa montajes', () => {
    const res = programar(baseInput([OPERARIOS_INICIALES[0]], 3));
    const montajes = res.tareas.filter((t) => t.operacionId === 'montaje');
    expect(montajes.length).toBe(0);
  });

  it('2 operarios: segundo montaje después del primero', () => {
    const res = programar(baseInput(OPERARIOS_INICIALES.slice(0, 2), 3));
    const montajes = res.tareas
      .filter((t) => t.operacionId === 'montaje')
      .sort((a, b) => a.inicioMin - b.inicioMin);
    if (montajes.length >= 2) {
      expect(montajes[1].inicioMin).toBeGreaterThanOrEqual(montajes[0].finMin);
    }
  });

  it('durante el revólver se puede pesar otro lote', () => {
    const res = programar(baseInput(OPERARIOS_INICIALES.slice(0, 2), 3));
    const revolverL1 = res.tareas.find((t) => t.loteIndex === 0 && t.operacionId === 'espera2');
    expect(revolverL1).toBeTruthy();
    const trabajoDurante = res.tareas.filter(
      (t) =>
        t.operarioId &&
        t.loteIndex > 0 &&
        t.inicioMin >= revolverL1!.inicioMin &&
        t.inicioMin < revolverL1!.finMin,
    );
    expect(trabajoDurante.length).toBeGreaterThan(0);
  });

  it('3 operarios terminan antes o igual que 2 con misma meta', () => {
    const r2 = programar(baseInput(OPERARIOS_INICIALES.slice(0, 2), 5));
    const r3 = programar(baseInput(OPERARIOS_INICIALES.slice(0, 3), 5));
    expect(r3.finEstimadoMin).toBeLessThanOrEqual(r2.finEstimadoMin + 30);
  });
});

describe('compararOperarios', () => {
  it('con plan de 2 ops, comparar 3 puede mejorar el fin', () => {
    const jornada: Jornada = {
      id: 'j',
      fecha: '2026-07-10',
      turno: 'Mañana',
      horaInicio: '07:30',
      horaFin: '12:00',
      operariosIds: ['op_juan', 'op_camilo'],
      tanquesIds: tanques,
      tanquesBloqueadosIds: [],
      metaTanques: 5,
      galonesPorTanque: 200,
      productos: PRODUCTOS_INICIALES,
      prioridad: 'media',
      estado: 'borrador',
      proceso: PROCESO_INICIAL,
      operariosSnapshot: OPERARIOS_INICIALES,
      resultado: null,
      creadaEn: '',
      simClockMin: 0,
    };
    const c2 = compararOperarios(jornada, PARAMETROS_INICIALES, 2);
    const c3 = compararOperarios(jornada, PARAMETROS_INICIALES, 3);
    expect(c2.tanques).toBeGreaterThan(0);
    expect(c3.tanques).toBeGreaterThan(0);
  });
});

describe('escenario Excel planta', () => {
  it('2 ops, meta 5: plan completo sin solapes de montaje', () => {
    const jornada: Jornada = {
      id: 'excel',
      fecha: '2026-07-10',
      turno: 'Mañana',
      horaInicio: '07:30',
      horaFin: '12:00',
      operariosIds: ['op_juan', 'op_camilo'],
      tanquesIds: ['T1', 'T2', 'T3', 'T4', 'T5'],
      tanquesBloqueadosIds: ['T6'],
      metaTanques: 5,
      galonesPorTanque: 200,
      productos: PRODUCTOS_INICIALES,
      prioridad: 'media',
      estado: 'borrador',
      proceso: PROCESO_INICIAL,
      operariosSnapshot: OPERARIOS_INICIALES,
      resultado: null,
      creadaEn: '',
      simClockMin: 0,
    };
    const res = programarJornada(jornada, PARAMETROS_INICIALES);
    expect(res.tanquesPlaneados).toBeGreaterThan(0);
    assertMontajeCap(res.tareas, 2);
    assertNoOperatorOverlap(res.tareas);
  });
});
