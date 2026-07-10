'use client';

import { useParams } from 'next/navigation';
import { useStore } from '@/lib/store/useStore';
import { PageHeader } from '@/components/PageHeader';
import { PlanTabs } from '@/components/PlanTabs';
import { EmptyState } from '@/components/ui';
import {
  baseInicioJornada,
  filasHorariasDesdeTareas,
  resumenPorTanque,
} from '@/lib/domain/hoja';

export function HojaProduccionView() {
  const params = useParams();
  const id = params.id as string;
  const jornada = useStore((s) => s.jornadas.find((j) => j.id === id));
  const aprobarJornada = useStore((s) => s.aprobarJornada);

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
  const filas = filasHorariasDesdeTareas(res.tareas, base);
  const resumen = resumenPorTanque(res.tareas, base);
  const operarios = jornada.operariosSnapshot
    .filter((o) => jornada.operariosIds.includes(o.id))
    .map((o) => o.nombre)
    .join(', ');

  const usarPlan = () => {
    if (jornada.estado === 'borrador') aprobarJornada(jornada.id);
  };

  return (
    <div className="space-y-4 print:space-y-2">
      <div className="print:hidden">
        <PageHeader titulo="Hoja de producción" subtitulo="Imprimible para piso" back={`/plan/${id}/programacion`} />
        <PlanTabs id={id} />
        <div className="flex gap-2 mb-4">
          <button type="button" className="btn btn-primary" onClick={() => { usarPlan(); window.print(); }}>
            Imprimir hoja
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
            <h1 className="text-lg font-bold">Plan del día — Producción</h1>
            <p className="text-sm">
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

        <section className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-wide mb-2">Programación por hora</h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-black/30">
                <th className="text-left py-1 pr-4 w-20 font-semibold">Hora</th>
                <th className="text-left py-1 font-semibold">Actividades programadas</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f) => (
                <tr key={f.horaOffsetMin} className="border-b border-black/10 align-top">
                  <td className="py-1.5 pr-4 font-mono whitespace-nowrap">{f.horaLabel}</td>
                  <td className="py-1.5">{f.actividades.join(' · ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="mb-6">
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

        <footer className="mt-6 pt-4 border-t border-black/20 text-xs text-black/60">
          Generado por Balanceador de Producción · {new Date().toLocaleString('es-CO')}
        </footer>
      </article>
    </div>
  );
}
