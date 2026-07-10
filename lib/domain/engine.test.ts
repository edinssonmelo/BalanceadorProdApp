import { describe, expect, it } from 'vitest';
import { programar } from './engine';
import {
  OPERARIOS_INICIALES,
  PARAMETROS_INICIALES,
  PROCESO_INICIAL,
  PRODUCTOS_INICIALES,
} from './defaults';
import type { TareaProgramada } from './types';

function assertNoOperatorOverlap(tareas: TareaProgramada[]) {
  const manuales = tareas.filter((t) => t.operarioId && t.tipo !== 'pasivo');
  for (let i = 0; i < manuales.length; i++) {
    for (let j = i + 1; j < manuales.length; j++) {
      const a = manuales[i];
      const b = manuales[j];
      if (a.operarioId !== b.operarioId) continue;
      const overlap = a.inicioMin < b.finMin && b.inicioMin < a.finMin;
      expect(overlap, `Solape ${a.operacionId} vs ${b.operacionId} en ${a.operarioId}`).toBe(false);
    }
  }
}

const tanques = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6'];

describe('programar — invariante operario único', () => {
  it('1 operario, meta 3: pesajes en serie sin solape', () => {
    const op = OPERARIOS_INICIALES[0];
    const res = programar({
      horizonMin: 270,
      horaInicioAbs: 7 * 60 + 30,
      operarios: [op],
      tanquesFisicos: tanques,
      tanquesBloqueados: [],
      metaTanques: 3,
      galonesPorTanque: 200,
      productos: PRODUCTOS_INICIALES,
      proceso: PROCESO_INICIAL,
      parametros: PARAMETROS_INICIALES,
    });

    const pesajes = res.tareas
      .filter((t) => t.operacionId === 'pesaje')
      .sort((a, b) => a.inicioMin - b.inicioMin);

    expect(pesajes.length).toBe(3);
    for (let i = 1; i < pesajes.length; i++) {
      expect(pesajes[i].inicioMin).toBeGreaterThanOrEqual(pesajes[i - 1].finMin);
    }
    assertNoOperatorOverlap(res.tareas);
  });

  it('2 operarios, meta 4: máximo 2 pesajes simultáneos, sin solape por operario', () => {
    const ops = OPERARIOS_INICIALES.slice(0, 2);
    const res = programar({
      horizonMin: 270,
      horaInicioAbs: 7 * 60 + 30,
      operarios: ops,
      tanquesFisicos: tanques,
      tanquesBloqueados: [],
      metaTanques: 4,
      galonesPorTanque: 200,
      productos: PRODUCTOS_INICIALES,
      proceso: PROCESO_INICIAL,
      parametros: PARAMETROS_INICIALES,
    });

    const pesajes = res.tareas.filter((t) => t.operacionId === 'pesaje');
    const atT0 = pesajes.filter((t) => t.inicioMin === 0);
    expect(atT0.length).toBeLessThanOrEqual(2);

    assertNoOperatorOverlap(res.tareas);
  });

  it('esperas pasivas: sin operario y tanque ocupado 30 min', () => {
    const ops = OPERARIOS_INICIALES.slice(0, 2);
    const res = programar({
      horizonMin: 270,
      horaInicioAbs: 7 * 60 + 30,
      operarios: ops,
      tanquesFisicos: tanques,
      tanquesBloqueados: [],
      metaTanques: 2,
      galonesPorTanque: 200,
      productos: PRODUCTOS_INICIALES,
      proceso: PROCESO_INICIAL,
      parametros: PARAMETROS_INICIALES,
    });

    const esperas = res.tareas.filter((t) => t.tipo === 'pasivo');
    expect(esperas.length).toBeGreaterThan(0);
    for (const e of esperas) {
      expect(e.operarioId).toBeNull();
      expect(e.duracionMin).toBe(30);
    }
    assertNoOperatorOverlap(res.tareas);
  });

  it('ninguna tarea manual del mismo operario se solapa en plan completo', () => {
    const res = programar({
      horizonMin: 270,
      horaInicioAbs: 7 * 60 + 30,
      operarios: OPERARIOS_INICIALES,
      tanquesFisicos: tanques,
      tanquesBloqueados: [],
      metaTanques: 5,
      galonesPorTanque: 200,
      productos: PRODUCTOS_INICIALES,
      proceso: PROCESO_INICIAL,
      parametros: PARAMETROS_INICIALES,
    });

    assertNoOperatorOverlap(res.tareas);
  });
});
