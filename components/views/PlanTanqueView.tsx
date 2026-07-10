'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useStore } from '@/lib/store/useStore';
import { PageHeader } from '@/components/PageHeader';
import { PlanTabs } from '@/components/PlanTabs';
import { EmptyState, EstadoBadge, GaugeTanque } from '@/components/ui';
import { TimelineTanque } from '@/components/TimelineTanque';
import { offsetToClock, hhmmToMinutes, durationLabel } from '@/lib/domain/time';
import type { TareaProgramada } from '@/lib/domain/types';

export function PlanTanqueView() {
  const params = useParams();
  const id = params.id as string;
  const jornada = useStore((s) => s.jornadas.find((j) => j.id === id));
  const marcarDisponible = useStore((s) => s.marcarTanqueDisponibleEnJornada);
  const [detalle, setDetalle] = useState<string | null>(null);

  if (!jornada || !jornada.resultado) {
    return (
      <div>
        <PageHeader titulo="Plan por tanque" back="/plan" />
        <EmptyState titulo="Plan no encontrado" />
      </div>
    );
  }

  const res = jornada.resultado;
  const base = hhmmToMinutes(jornada.horaInicio);
  const lotesKeys = Array.from(
    new Set(res.tareas.filter((t) => t.tanqueId !== '—').map((t) => `${t.tanqueId}#${t.loteIndex}`)),
  );

  const detalleLote = detalle
    ? res.tareas.filter((t) => `${t.tanqueId}#${t.loteIndex}` === detalle).sort((a, b) => a.inicioMin - b.inicioMin)
    : [];

  const estadoLote = (lote: TareaProgramada[]): TareaProgramada['estado'] => {
    if (lote.every((t) => t.estado === 'terminado' || t.estado === 'retrasado')) return 'terminado';
    if (lote.some((t) => t.estado === 'retrasado')) return 'retrasado';
    if (lote.some((t) => t.estado === 'proceso')) return 'proceso';
    return 'programado';
  };

  return (
    <div className="space-y-4">
      <PageHeader titulo="Plan por tanque" subtitulo={`${lotesKeys.length} lotes programados`} back={`/plan/${id}`} />
      <PlanTabs id={id} />

      <div className="space-y-3">
        {lotesKeys.map((key) => {
          const [tanqueId, idx] = key.split('#');
          const lote = res.tareas.filter((t) => t.tanqueId === tanqueId && t.loteIndex === parseInt(idx, 10));
          const fin = Math.max(...lote.map((t) => t.finMin));
          const done = lote.filter((t) => t.estado === 'terminado' || t.estado === 'retrasado').length;
          const pct = Math.round((done / lote.length) * 100);
          const st = estadoLote(lote);
          const color = st === 'terminado' ? 'var(--ok)' : st === 'proceso' ? 'var(--warn)' : 'var(--idle)';
          const activa = lote.find((t) => t.estado === 'proceso' || t.estado === 'espera');

          return (
            <div key={key} className="card p-4 cursor-pointer" onClick={() => setDetalle(key)}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-semibold">{tanqueId}</span>
                  <span className="text-muted-foreground text-xs ml-2">Lote #{parseInt(idx, 10) + 1}</span>
                </div>
                <EstadoBadge estado={st} />
              </div>
              <GaugeTanque pct={pct} label={activa?.operacionNombre ?? `${done}/${lote.length} ops`} color={color} />
              <TimelineTanque
                tanqueId={tanqueId}
                loteIndex={parseInt(idx, 10)}
                tareas={res.tareas}
                proceso={jornada.proceso}
                baseInicioMin={base}
                finLote={fin}
              />
              <p className="text-xs font-mono text-muted-foreground mt-1">
                {lote[0].productoNombre} · {offsetToClock(base, lote[0].inicioMin)} → {offsetToClock(base, fin)}
              </p>
            </div>
          );
        })}
      </div>

      {jornada.tanquesBloqueadosIds.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold mb-2">Tanques no disponibles</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {jornada.tanquesBloqueadosIds.map((tId) => (
              <div key={tId} className="card p-3 opacity-60 text-center">
                <p className="font-semibold">{tId}</p>
                <EstadoBadge estado="bloqueado" />
                <button
                  className="btn btn-neutral !py-1.5 !px-3 mt-2 text-xs w-full"
                  onClick={() => marcarDisponible(jornada.id, tId)}
                >
                  Marcar disponible
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {detalle && detalleLote.length > 0 && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setDetalle(null)}>
          <div className="bg-card border border-border rounded-lg w-full max-w-lg p-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold">
                {detalleLote[0].tanqueId} · {detalleLote[0].productoNombre}
              </h3>
              <button className="btn btn-ghost !px-3 !py-1.5" onClick={() => setDetalle(null)}>
                ✕
              </button>
            </div>
            <ul className="space-y-2">
              {detalleLote.map((t) => (
                <li key={t.id} className="flex items-center justify-between rounded-md bg-muted px-3 py-2">
                  <div>
                    <p className="font-semibold text-sm">{t.operacionNombre}</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {offsetToClock(base, t.inicioMin)}–{offsetToClock(base, t.finMin)} · {durationLabel(t.duracionMin)}
                    </p>
                  </div>
                  <EstadoBadge estado={t.estado} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
