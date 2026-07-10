import { describe, expect, it } from 'vitest';
import { etiquetaHitoExcel, grillaDistribucionExcel } from './hoja';
import type { TareaProgramada } from './types';

function tarea(partial: Partial<TareaProgramada> & Pick<TareaProgramada, 'operacionId' | 'inicioMin' | 'finMin'>): TareaProgramada {
  return {
    id: 't1',
    tanqueId: 'T1',
    operacionNombre: partial.operacionId ?? '',
    tipo: 'manual',
    operarioId: 'op1',
    loteIndex: 0,
    productoNombre: 'Test',
    duracionMin: partial.finMin - partial.inicioMin,
    estado: 'programado',
    ...partial,
  } as TareaProgramada;
}

describe('hoja excel', () => {
  it('etiquetas en mayúsculas como planta', () => {
    expect(etiquetaHitoExcel('pesaje', 'T1')).toBe('INICIO PESAJE TANQUE 1');
    expect(etiquetaHitoExcel('montaje', 'T2', { finPesajeInicioMontaje: true })).toBe(
      'FIN DEL PESAJE TANQUE 2 E INICIO DEL MONTAJE TANQUE 2',
    );
    expect(etiquetaHitoExcel('finalizacion', 'T3')).toBe('FIN DEL PROCESO EN TANQUE 3');
  });

  it('grilla: columnas por tanque y filas cada 5 min', () => {
    const tareas = [
      tarea({ operacionId: 'pesaje', tanqueId: '—', inicioMin: 5, finMin: 10 }),
      tarea({ operacionId: 'montaje', inicioMin: 10, finMin: 30 }),
      tarea({ operacionId: 'celulosa1', inicioMin: 30, finMin: 35, loteIndex: 0 }),
    ];
    const { columnas, filas } = grillaDistribucionExcel(tareas, 7 * 60 + 30, [
      { id: 'd', nombre: 'Desayuno', inicio: '10:05', duracionMin: 15 },
    ]);
    expect(columnas.map((c) => c.tanqueId)).toEqual(['T1']);
    expect(filas[0].celdas.T1?.texto).toBe('HORARIO DE ENTRADA');
    expect(filas.find((f) => f.horaOffsetMin === 5)?.celdas.T1?.texto).toBe('INICIO PESAJE TANQUE 1');
    expect(filas.find((f) => f.horaOffsetMin === 10)?.celdas.T1?.texto).toContain('MONTAJE TANQUE 1');
    expect(filas.length).toBeGreaterThan(5);
  });
});
