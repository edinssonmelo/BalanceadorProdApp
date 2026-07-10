'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store/useStore';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/ui';
import { calcularIndicadores } from '@/lib/domain/engine';
import { formatFechaLarga } from '@/lib/domain/time';

function pctColor(pct: number) {
  if (pct >= 95) return 'text-emerald-600';
  if (pct >= 85) return 'text-amber-600';
  return 'text-red-600';
}

export function HistoricoView() {
  const jornadas = useStore((s) => s.jornadas);
  const eliminarJornada = useStore((s) => s.eliminarJornada);

  const [filtroFecha, setFiltroFecha] = useState('');
  const [filtroTurno, setFiltroTurno] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  const filas = useMemo(() => {
    return jornadas
      .filter((j) => (filtroFecha ? j.fecha === filtroFecha : true))
      .filter((j) => (filtroTurno ? j.turno === filtroTurno : true))
      .filter((j) => (filtroEstado ? j.estado === filtroEstado : true))
      .map((j) => ({ jornada: j, ind: calcularIndicadores(j) }));
  }, [jornadas, filtroFecha, filtroTurno, filtroEstado]);

  const turnos = Array.from(new Set(jornadas.map((j) => j.turno)));

  return (
    <div className="space-y-4">
      <PageHeader titulo="Histórico" subtitulo="Jornadas cerradas y anteriores" back="/" />

      <section className="card p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className="field-label">Fecha</label>
          <input type="date" className="field-input" value={filtroFecha} onChange={(e) => setFiltroFecha(e.target.value)} />
        </div>
        <div>
          <label className="field-label">Turno</label>
          <select className="field-input" value={filtroTurno} onChange={(e) => setFiltroTurno(e.target.value)}>
            <option value="">Todos</option>
            {turnos.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label">Estado</label>
          <select className="field-input" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
            <option value="">Todos</option>
            <option value="borrador">Borrador</option>
            <option value="aprobada">Aprobada</option>
            <option value="cerrada">Cerrada</option>
          </select>
        </div>
        <div className="flex items-end">
          <button type="button" className="btn btn-neutral w-full" onClick={() => { setFiltroFecha(''); setFiltroTurno(''); setFiltroEstado(''); }}>
            Limpiar
          </button>
        </div>
      </section>

      {filas.length === 0 ? (
        <EmptyState titulo="Sin jornadas" mensaje="No hay jornadas que coincidan con los filtros." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border font-mono text-[10px] uppercase">
                <th className="px-3 py-3">Fecha</th>
                <th className="px-3 py-3">Turno</th>
                <th className="px-3 py-3">Gal. plan</th>
                <th className="px-3 py-3">Gal. real</th>
                <th className="px-3 py-3">Cumpl.</th>
                <th className="px-3 py-3">Efic.</th>
                <th className="px-3 py-3">Estado</th>
                <th className="px-3 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filas.map(({ jornada, ind }) => (
                <tr key={jornada.id} className="border-b border-border/50 hover:bg-muted/50">
                  <td className="px-3 py-3 font-medium capitalize">{formatFechaLarga(jornada.fecha)}</td>
                  <td className="px-3 py-3 text-muted-foreground">{jornada.turno}</td>
                  <td className="px-3 py-3 font-mono">{ind.galonesPlaneados}</td>
                  <td className="px-3 py-3 font-mono">{ind.galonesFabricados}</td>
                  <td className={`px-3 py-3 font-bold font-mono ${pctColor(ind.cumplimientoPct)}`}>{ind.cumplimientoPct}%</td>
                  <td className={`px-3 py-3 font-bold font-mono ${pctColor(ind.eficienciaOperativaPct)}`}>{ind.eficienciaOperativaPct}%</td>
                  <td className="px-3 py-3 capitalize text-muted-foreground">{jornada.estado}</td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <Link href={`/plan/${jornada.id}/indicadores`} className="btn btn-ghost !py-1 !px-2 text-xs mr-1">Detalle</Link>
                    <button type="button" className="btn btn-neutral !py-1 !px-2 text-xs" onClick={() => { if (confirm('¿Eliminar?')) eliminarJornada(jornada.id); }}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
