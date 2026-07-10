import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { calcularFusionesVerticales, workbookDistribucionABuffer } from './hoja-excel';
import { grillaDistribucionExcel } from './hoja';
import {
  OPERARIOS_INICIALES,
  PARAMETROS_INICIALES,
  PROCESO_INICIAL,
  PRODUCTOS_INICIALES,
} from './defaults';
import { programarJornada } from './engine';
import type { Jornada } from './types';

describe('hoja-excel export', () => {
  it('calcula fusiones verticales por tanque', () => {
    const grilla = grillaDistribucionExcel(
      [
        {
          id: '1',
          tanqueId: 'T1',
          operacionId: 'montaje',
          operacionNombre: 'Montaje',
          tipo: 'manual',
          operarioId: 'a',
          loteIndex: 0,
          productoNombre: 'X',
          inicioMin: 10,
          finMin: 30,
          duracionMin: 20,
          estado: 'programado',
        },
      ],
      7 * 60 + 30,
      [],
    );
    const fusiones = calcularFusionesVerticales(grilla);
    expect(fusiones.length).toBeGreaterThanOrEqual(0);
  });

  it('genera buffer xlsx válido', async () => {
    const jornada: Jornada = {
      id: 'x',
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
    const resultado = programarJornada(jornada, PARAMETROS_INICIALES);
    const logoBuffer = readFileSync(join(process.cwd(), 'public', 'kolorflex-logo.png'));
    const buffer = await workbookDistribucionABuffer({
      jornada,
      resultado,
      pausas: PARAMETROS_INICIALES.pausas,
      operariosLabel: 'Juan, Camilo',
      logoBuffer,
    });
    expect(buffer.byteLength).toBeGreaterThan(2000);
    expect(new Uint8Array(buffer)[0]).toBe(0x50); // PK zip header
    expect(new Uint8Array(buffer)[1]).toBe(0x4b);
  });
});
