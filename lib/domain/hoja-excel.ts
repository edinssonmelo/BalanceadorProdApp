import ExcelJS from 'exceljs';
import type { Jornada, PausaOperario, ResultadoProgramacion } from './types';
import type { GrillaDistribucion, ResumenTanqueHoja } from './hoja';
import {
  baseInicioJornada,
  grillaDistribucionExcel,
  resumenPorTanque,
} from './hoja';
const PAUSA_FILL = 'FF595959';
const BORDER_THIN = {
  top: { style: 'thin' as const },
  left: { style: 'thin' as const },
  bottom: { style: 'thin' as const },
  right: { style: 'thin' as const },
};

export interface DatosHojaExcel {
  jornada: Jornada;
  resultado: ResultadoProgramacion;
  pausas: PausaOperario[];
  operariosLabel: string;
}

function hexArgb(hex: string): string {
  const h = hex.replace('#', '').toUpperCase();
  return h.length === 6 ? `FF${h}` : h;
}

function clockToExcelDate(hhmm: string): Date {
  const [h, m] = hhmm.split(':').map((n) => parseInt(n, 10));
  return new Date(1899, 11, 30, h || 0, m || 0, 0);
}

function styleCell(
  cell: ExcelJS.Cell,
  opts: {
    fill?: string;
    bold?: boolean;
    fontSize?: number;
    align?: 'left' | 'center';
    wrap?: boolean;
    color?: string;
    numFmt?: string;
  },
) {
  cell.font = {
    name: 'Calibri',
    size: opts.fontSize ?? 9,
    bold: opts.bold,
    color: opts.color ? { argb: opts.color } : undefined,
  };
  cell.alignment = {
    vertical: 'middle',
    horizontal: opts.align ?? 'left',
    wrapText: opts.wrap ?? false,
  };
  cell.border = BORDER_THIN;
  if (opts.fill) {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: opts.fill } };
  }
  if (opts.numFmt) cell.numFmt = opts.numFmt;
}

interface FusionVertical {
  colIndex: number;
  filaInicio: number;
  filaFin: number;
  texto?: string;
  fill: string;
}

/** Agrupa filas consecutivas activas bajo el mismo hito (como bloques del Excel del cliente). */
export function calcularFusionesVerticales(grilla: GrillaDistribucion): FusionVertical[] {
  const fusiones: FusionVertical[] = [];

  for (let colIndex = 0; colIndex < grilla.columnas.length; colIndex++) {
    const { tanqueId, color } = grilla.columnas[colIndex];
    let abierta: FusionVertical | null = null;

    const cerrar = () => {
      if (abierta && abierta.filaFin > abierta.filaInicio) fusiones.push(abierta);
      abierta = null;
    };

    grilla.filas.forEach((fila, filaIndex) => {
      if (fila.pausaNombre || fila.horaOffsetMin === 0) {
        cerrar();
        return;
      }

      const celda = fila.celdas[tanqueId] ?? {};
      if (celda.texto) {
        cerrar();
        abierta = {
          colIndex,
          filaInicio: filaIndex,
          filaFin: filaIndex,
          texto: celda.texto,
          fill: hexArgb(color),
        };
      } else if (celda.activo && abierta) {
        abierta.filaFin = filaIndex;
      } else {
        cerrar();
      }
    });
    cerrar();
  }

  return fusiones;
}

export async function generarDistribucionWorkbook(datos: DatosHojaExcel): Promise<ExcelJS.Workbook> {
  const { jornada, resultado, pausas, operariosLabel } = datos;
  const base = baseInicioJornada(jornada);
  const grilla = grillaDistribucionExcel(resultado.tareas, base, pausas);
  const resumen = resumenPorTanque(resultado.tareas, base);
  const fusiones = calcularFusionesVerticales(grilla);

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Balanceador de Producción';
  wb.created = new Date();

  const ws = wb.addWorksheet('Distribución', {
    views: [{ showGridLines: true }],
    pageSetup: {
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 },
    },
  });

  const nTanques = Math.max(grilla.columnas.length, 1);
  const colProdInicio = 2;
  const colProdFin = colProdInicio + nTanques - 1;
  const colHora = 1;

  ws.getColumn(colHora).width = 9;
  for (let c = colProdInicio; c <= colProdFin; c++) {
    ws.getColumn(c).width = 24;
  }

  const tituloCols = Math.max(colProdFin, 6);
  ws.mergeCells(1, 1, 1, tituloCols);
  const titleCell = ws.getCell(1, 1);
  titleCell.value = 'DISTRIBUCIÓN DE PROCESO EN LA JORNADA LABORAL';
  styleCell(titleCell, { bold: true, fontSize: 14, align: 'center' });

  ws.mergeCells(2, 1, 2, tituloCols);
  const metaCell = ws.getCell(2, 1);
  metaCell.value =
    `${jornada.fecha} · ${jornada.turno} · ${jornada.horaInicio}–${jornada.horaFin}  |  ` +
    `Meta: ${jornada.metaTanques} tanques (${resultado.galonesPlaneados} gal)  |  ` +
    `Operarios: ${operariosLabel}  |  Tanques: ${jornada.tanquesIds.join(', ')}`;
  styleCell(metaCell, { fontSize: 10, align: 'center', wrap: true });

  const headerRow = 4;
  const subHeaderRow = 5;
  const dataStartRow = 6;

  ws.getCell(headerRow, colHora).value = 'HORA';
  styleCell(ws.getCell(headerRow, colHora), { bold: true, align: 'center' });

  if (nTanques > 0) {
    ws.mergeCells(headerRow, colProdInicio, headerRow, colProdFin);
    const prodHeader = ws.getCell(headerRow, colProdInicio);
    prodHeader.value = 'PRODUCCIÓN';
    styleCell(prodHeader, { bold: true, align: 'center' });

    grilla.columnas.forEach((col, i) => {
      const cell = ws.getCell(subHeaderRow, colProdInicio + i);
      cell.value = col.tanqueId;
      styleCell(cell, { bold: true, align: 'center', fill: hexArgb(col.color) });
    });
    styleCell(ws.getCell(subHeaderRow, colHora), { bold: true });
  }

  const celdasFusionadas = new Set<string>();

  grilla.filas.forEach((fila, filaIndex) => {
    const row = dataStartRow + filaIndex;
    const horaCell = ws.getCell(row, colHora);
    horaCell.value = clockToExcelDate(fila.horaLabel);
    styleCell(horaCell, { numFmt: 'hh:mm', align: 'center' });

    if (fila.pausaNombre) {
      ws.mergeCells(row, colProdInicio, row, colProdFin);
      const pausaCell = ws.getCell(row, colProdInicio);
      pausaCell.value = fila.pausaNombre;
      styleCell(pausaCell, { fill: PAUSA_FILL, bold: true, align: 'center', color: 'FFFFFFFF' });
      return;
    }

    if (fila.horaOffsetMin === 0) {
      ws.mergeCells(row, colProdInicio, row, colProdFin);
      const entradaCell = ws.getCell(row, colProdInicio);
      entradaCell.value =
        grilla.columnas[0] ? fila.celdas[grilla.columnas[0].tanqueId]?.texto ?? '' : '';
      styleCell(entradaCell, { bold: true, align: 'center' });
      return;
    }

    grilla.columnas.forEach((col, i) => {
      const cell = ws.getCell(row, colProdInicio + i);
      const info = fila.celdas[col.tanqueId] ?? {};
      const key = `${colProdInicio + i}:${row}`;
      if (celdasFusionadas.has(key)) return;

      if (info.texto) {
        cell.value = info.texto;
        styleCell(cell, { fill: hexArgb(col.color), wrap: true, fontSize: 8 });
      } else if (info.activo) {
        styleCell(cell, { fill: hexArgb(col.color) });
      } else {
        styleCell(cell, {});
      }
    });
  });

  for (const fusion of fusiones) {
    const col = colProdInicio + fusion.colIndex;
    const startRow = dataStartRow + fusion.filaInicio;
    const endRow = dataStartRow + fusion.filaFin;
    if (endRow <= startRow) continue;

    ws.mergeCells(startRow, col, endRow, col);
    for (let r = startRow; r <= endRow; r++) {
      celdasFusionadas.add(`${col}:${r}`);
    }
    const cell = ws.getCell(startRow, col);
    if (fusion.texto) cell.value = fusion.texto;
    styleCell(cell, {
      fill: fusion.fill,
      wrap: true,
      fontSize: 8,
      align: 'left',
    });
  }

  const footerRow = dataStartRow + grilla.filas.length + 1;
  ws.mergeCells(footerRow, colHora, footerRow, colProdFin);
  const footerCell = ws.getCell(footerRow, colHora);
  footerCell.value = `FIN DE LA JORNADA · ${jornada.turno.toUpperCase()}`;
  styleCell(footerCell, { bold: true, align: 'center', fontSize: 10 });

  agregarHojaResumen(wb, resumen);

  return wb;
}

function agregarHojaResumen(wb: ExcelJS.Workbook, resumen: ResumenTanqueHoja[]) {
  const ws = wb.addWorksheet('Resumen');
  const headers = ['Tanque', 'Producto', 'Inicio', 'Cel. 1', 'Cel. 2', 'Resina', 'Fin', 'Instrucción'];
  headers.forEach((h, i) => {
    const cell = ws.getCell(1, i + 1);
    cell.value = h;
    styleCell(cell, { bold: true, fill: 'FFE7E6E6' });
  });
  resumen.forEach((r, idx) => {
    const row = idx + 2;
    const vals = [
      r.tanqueId,
      r.producto,
      r.inicio ?? '—',
      r.celulosa1 ?? '—',
      r.celulosa2 ?? '—',
      r.resina ?? '—',
      r.fin ?? '—',
      r.instruccion,
    ];
    vals.forEach((v, i) => {
      styleCell(ws.getCell(row, i + 1), { wrap: i === 7 });
      ws.getCell(row, i + 1).value = v;
    });
  });
  ws.columns.forEach((col) => {
    col.width = 16;
  });
}

export async function workbookDistribucionABuffer(datos: DatosHojaExcel): Promise<ArrayBuffer> {
  const wb = await generarDistribucionWorkbook(datos);
  const buf = await wb.xlsx.writeBuffer();
  return buf as ArrayBuffer;
}

export function nombreArchivoDistribucion(jornada: Jornada): string {
  const fecha = jornada.fecha.replace(/-/g, '');
  const turno = jornada.turno.toLowerCase().replace(/\s+/g, '-');
  return `distribucion-proceso-${fecha}-${turno}.xlsx`;
}

/** Descarga el Excel en el navegador (solo cliente). */
export async function descargarDistribucionExcel(datos: DatosHojaExcel): Promise<void> {
  const buffer = await workbookDistribucionABuffer(datos);
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = nombreArchivoDistribucion(datos.jornada);
  anchor.click();
  URL.revokeObjectURL(url);
}
