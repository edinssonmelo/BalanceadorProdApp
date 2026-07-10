'use client';

import { useParams } from 'next/navigation';
import { useStore } from '@/lib/store/useStore';
import { PageHeader } from '@/components/PageHeader';
import { PlanTabs } from '@/components/PlanTabs';
import { EmptyState } from '@/components/ui';
import {
  baseInicioJornada,
  grillaDistribucionExcel,
  resumenPorTanque,
} from '@/lib/domain/hoja';
import { PARAMETROS_INICIALES } from '@/lib/domain/defaults';
import { useState } from 'react';

export function HojaProduccionView() {
  const params = useParams();
  const id = params.id as string;
  const jornada = useStore((s) => s.jornadas.find((j) => j.id === id));
  const aprobarJornada = useStore((s) => s.aprobarJornada);
  const parametros = useStore((s) => s.parametros);
  const [exportando, setExportando] = useState(false);

  if (!jornada?.resultado) {
    return (
      <div>
        <PageHeader titulo="Hoja de producción" back="/plan" />
        <EmptyState titulo="Plan no encontrado" />
      </div>
    );
  }

  const base = baseInicioJornada(jornada);
  const res = jornada.resultado;
  const pausas = parametros.pausas ?? PARAMETROS_INICIALES.pausas;
  const grilla = grillaDistribucionExcel(res.tareas, base, pausas);
  const resumen = resumenPorTanque(res.tareas, base);
  const operarios = jornada.operariosSnapshot
    .filter((o) => jornada.operariosIds.includes(o.id))
    .map((o) => o.nombre)
    .join(', ');

  const usarPlan = () => {
    if (jornada.estado === 'borrador') aprobarJornada(jornada.id);
  };

  const descargarExcel = async () => {
    setExportando(true);
    try {
      usarPlan();
      const { descargarDistribucionExcel } = await import('@/lib/domain/hoja-excel');
      await descargarDistribucionExcel({
        jornada,
        resultado: res,
        pausas,
        operariosLabel: operarios,
      });
    } finally {
      setExportando(false);
    }
  };

  return (
    <div className="space-y-4 print:space-y-2">
      <div className="print:hidden">
        <PageHeader titulo="Hoja de producción" subtitulo="Imprimible para piso" back={`/plan/${id}/programacion`} />
        <PlanTabs id={id} />
        <div className="flex flex-wrap gap-2 mb-4">
          <button type="button" className="btn btn-primary" onClick={() => { usarPlan(); window.print(); }}>
            Imprimir hoja
          </button>
          <button
            type="button"
            className="btn btn-success"
            disabled={exportando}
            onClick={descargarExcel}
          >
            {exportando ? 'Generando Excel…' : 'Descargar Excel'}
          </button>
          {jornada.estado === 'borrador' && (
            <button type="button" className="btn btn-ghost" onClick={usarPlan}>
              Usar este plan
            </button>
          )}
        </div>
      </div>

      <article className="hoja-print bg-white text-black p-6 print:p-4 rounded-lg border print:border-0 print:shadow-none">
        <header className="border-b border-black/20 pb-4 mb-4 flex justify-between gap-4">
          <div>
            <div className="h-12 w-32 border border-dashed border-black/30 flex items-center justify-center text-xs text-black/50 mb-2">
              Logo empresa
            </div>
            <h1 className="text-base font-bold uppercase tracking-tight">
              Distribución de proceso en la jornada laboral
            </h1>
            <p className="text-sm mt-1">
              {jornada.fecha} · {jornada.turno} · {jornada.horaInicio}–{jornada.horaFin}
            </p>
          </div>
          <div className="text-right text-sm">
            <p>
              <strong>Meta:</strong> {jornada.metaTanques} tanques ({res.galonesPlaneados} gal)
            </p>
            <p>
              <strong>Operarios:</strong> {operarios}
            </p>
            <p>
              <strong>Tanques:</strong> {jornada.tanquesIds.join(', ')}
            </p>
          </div>
        </header>

        <section className="mb-6 overflow-x-auto">
          <table className="hoja-grid w-full text-[10px] border-collapse min-w-[640px]">
            <thead>
              <tr className="border border-black/40">
                <th className="border border-black/40 px-1 py-1 w-14 font-bold bg-white">HORA</th>
                <th
                  colSpan={grilla.columnas.length || 1}
                  className="border border-black/40 px-1 py-1 font-bold text-center bg-white"
                >
                  PRODUCCIÓN
                </th>
              </tr>
              {grilla.columnas.length > 0 && (
                <tr className="border border-black/40">
                  <th className="border border-black/40 bg-white" />
                  {grilla.columnas.map((col) => (
                    <th
                      key={col.tanqueId}
                      className="border border-black/40 px-1 py-0.5 font-semibold text-center"
                      style={{ backgroundColor: col.color }}
                    >
                      {col.tanqueId}
                    </th>
                  ))}
                </tr>
              )}
            </thead>
            <tbody>
              {grilla.filas.map((fila) => {
                if (fila.pausaNombre) {
                  return (
                    <tr key={fila.horaOffsetMin} className="hoja-pausa">
                      <td className="border border-black/40 px-1 py-0.5 font-mono whitespace-nowrap align-middle">
                        {fila.horaLabel}
                      </td>
                      <td
                        colSpan={grilla.columnas.length || 1}
                        className="border border-black/40 px-2 py-1 text-center font-bold text-white uppercase"
                      >
                        {fila.pausaNombre}
                      </td>
                    </tr>
                  );
                }

                if (fila.horaOffsetMin === 0) {
                  const texto = grilla.columnas[0]
                    ? fila.celdas[grilla.columnas[0].tanqueId]?.texto
                    : '';
                  return (
                    <tr key={fila.horaOffsetMin}>
                      <td className="border border-black/40 px-1 py-0.5 font-mono whitespace-nowrap bg-white">
                        {fila.horaLabel}
                      </td>
                      <td
                        colSpan={grilla.columnas.length || 1}
                        className="border border-black/40 px-1 py-0.5 font-semibold"
                      >
                        {texto}
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={fila.horaOffsetMin}>
                    <td className="border border-black/40 px-1 py-0.5 font-mono whitespace-nowrap align-top bg-white">
                      {fila.horaLabel}
                    </td>
                    {grilla.columnas.map((col) => {
                      const celda = fila.celdas[col.tanqueId] ?? {};
                      return (
                        <td
                          key={col.tanqueId}
                          className="border border-black/40 px-1 py-0.5 align-top leading-tight"
                          style={{
                            backgroundColor: celda.activo ? col.color : celda.texto ? col.color : undefined,
                          }}
                        >
                          {celda.texto ?? ''}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        <section className="mb-6 print:break-before-auto">
          <h2 className="text-sm font-bold uppercase tracking-wide mb-2">Resumen por tanque</h2>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-black/30">
                <th className="text-left py-1">Tanque</th>
                <th className="text-left py-1">Producto</th>
                <th className="text-left py-1">Inicio</th>
                <th className="text-left py-1">Cel. 1</th>
                <th className="text-left py-1">Cel. 2</th>
                <th className="text-left py-1">Resina</th>
                <th className="text-left py-1">Fin</th>
              </tr>
            </thead>
            <tbody>
              {resumen.map((r) => (
                <tr key={`${r.tanqueId}-${r.loteIndex}`} className="border-b border-black/10">
                  <td className="py-1 font-mono">{r.tanqueId}</td>
                  <td className="py-1">{r.producto}</td>
                  <td className="py-1 font-mono">{r.inicio ?? '—'}</td>
                  <td className="py-1 font-mono">{r.celulosa1 ?? '—'}</td>
                  <td className="py-1 font-mono">{r.celulosa2 ?? '—'}</td>
                  <td className="py-1 font-mono">{r.resina ?? '—'}</td>
                  <td className="py-1 font-mono">{r.fin ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {resumen.some((r) => r.instruccion) && (
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wide mb-2">Instrucciones visibles</h2>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-black/30">
                  <th className="text-left py-1">Tanque</th>
                  <th className="text-left py-1">Producto</th>
                  <th className="text-left py-1">Instrucción</th>
                </tr>
              </thead>
              <tbody>
                {resumen
                  .filter((r) => r.instruccion)
                  .map((r) => (
                    <tr key={`inst-${r.tanqueId}`} className="border-b border-black/10">
                      <td className="py-1 font-mono">{r.tanqueId}</td>
                      <td className="py-1">{r.producto}</td>
                      <td className="py-1">{r.instruccion}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </section>
        )}

        <footer className="mt-6 pt-4 border-t border-black/20 text-xs text-black/60 print:hidden">
          Generado por Balanceador de Producción · {new Date().toLocaleString('es-CO')}
        </footer>
      </article>
    </div>
  );
}
