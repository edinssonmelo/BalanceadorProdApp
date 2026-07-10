import { describe, expect, it } from 'vitest';
import { compararOperarios, programar, programarJornada } from './engine';
import {
  OPERARIOS_INICIALES,
  PARAMETROS_INICIALES,
  PROCESO_INICIAL,
  PRODUCTOS_INICIALES,
} from './defaults';
import type { Jornada, Operario, TareaProgramada } from './types';

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

describe('programar — invariante operario único', () => {
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

  it('2 operarios, meta 4: máximo 2 pesajes simultáneos, sin solape por operario', () => {
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

  it('ninguna tarea manual del mismo operario se solapa en plan completo', () => {
    const res = programar(baseInput(OPERARIOS_INICIALES, 5));
    assertNoOperatorOverlap(res.tareas);
  });
});

describe('programar — paralelismo y uso de recursos (escenario planta)', () => {
  it('2 operarios: L1 y L2 montan a la misma hora (arranque simétrico)', () => {
    const res = programar(baseInput(OPERARIOS_INICIALES.slice(0, 2), 5));
    const montajes = res.tareas
      .filter((t) => t.operacionId === 'montaje')
      .sort((a, b) => a.loteIndex - b.loteIndex);

    expect(montajes[0].inicioMin).toBe(5); // tras pesaje 5 min
    expect(montajes[1].inicioMin).toBe(5); // mismo instante — 2 personas
    expect(montajes[0].operarioId).not.toBe(montajes[1].operarioId);
    assertNoOperatorOverlap(res.tareas);
  });

  it('2 operarios: durante espera1 de L1 se pesa/monta L3 y L4', () => {
    const res = programar(baseInput(OPERARIOS_INICIALES.slice(0, 2), 5));
    const espera1L1 = res.tareas.find((t) => t.loteIndex === 0 && t.operacionId === 'espera1');
    expect(espera1L1).toBeTruthy();

    const trabajoDurante = res.tareas.filter(
      (t) =>
        t.operarioId &&
        t.loteIndex > 0 &&
        t.inicioMin >= espera1L1!.inicioMin &&
        t.inicioMin < espera1L1!.finMin,
    );
    const ops = new Set(trabajoDurante.map((t) => t.operacionId));
    expect(ops.has('pesaje') || ops.has('montaje')).toBe(true);
    assertNoOperatorOverlap(res.tareas);
  });

  it('3 operarios terminan antes que 2 (más recursos = mejor makespan)', () => {
    const r2 = programar(baseInput(OPERARIOS_INICIALES.slice(0, 2), 5));
    const r3 = programar(baseInput(OPERARIOS_INICIALES.slice(0, 3), 5));
    expect(r3.finEstimadoMin).toBeLessThan(r2.finEstimadoMin);
    expect(r2.tanquesPlaneados).toBe(5);
    expect(r3.tanquesPlaneados).toBe(5);
    // Con 3: tres montajes en paralelo al inicio
    const montajesT0 = r3.tareas.filter((t) => t.operacionId === 'montaje' && t.inicioMin === 5);
    expect(montajesT0.length).toBe(3);
  });

  it('1 operario termina después que 2', () => {
    const r1 = programar(baseInput([OPERARIOS_INICIALES[0]], 5));
    const r2 = programar(baseInput(OPERARIOS_INICIALES.slice(0, 2), 5));
    expect(r1.finEstimadoMin).toBeGreaterThan(r2.finEstimadoMin);
  });

  it('eficiencia <100% alarga tareas y desfasá el montaje paralelo', () => {
    const lento: Operario = {
      ...OPERARIOS_INICIALES[1],
      eficiencia: 85,
    };
    const res = programar(baseInput([OPERARIOS_INICIALES[0], lento], 2));
    const montajes = res.tareas
      .filter((t) => t.operacionId === 'montaje')
      .sort((a, b) => a.loteIndex - b.loteIndex);
    expect(montajes[0].inicioMin).toBe(5);
    expect(montajes[1].inicioMin).toBe(6); // pesaje 6 min por eficiencia 85%
  });

  it('usa 5 tanques físicos distintos con meta 5 y 2 operarios', () => {
    const res = programar(baseInput(OPERARIOS_INICIALES.slice(0, 2), 5));
    expect(res.tanquesUsados.length).toBe(5);
    expect(res.tanquesPlaneados).toBe(5);
  });
});

describe('compararOperarios', () => {
  it('con plan de 2 ops, comparar 3 usa el 3er del snapshot y mejora el fin', () => {
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
    expect(c3.finMin).toBeLessThan(c2.finMin);
    expect(c2.tanques).toBe(5);
    expect(c3.tanques).toBe(5);
  });
});

describe('escenario Excel planta (meta 5, mañana)', () => {
  it('2 ops cierran producción antes de las 12:00 y sin solapes', () => {
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
    // Excel manual cerraba T5 a las 12:00 (270 min); software debe mejorar
    expect(res.finEstimadoMin).toBeLessThan(270);
    expect(res.tanquesPlaneados).toBe(5);
    assertNoOperatorOverlap(res.tareas);
  });
});
