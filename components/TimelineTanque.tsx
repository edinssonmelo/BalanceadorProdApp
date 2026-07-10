'use client';

import type { TareaProgramada, OperacionEstandar } from '@/lib/domain/types';
import { offsetToClock, durationLabel } from '@/lib/domain/time';

const OP_COLORS: Record<string, string> = {
  pesaje: '#a1a1aa',
  montaje: '#52525b',
  celulosa1: '#3b82f6',
  espera1: '#e4e4e7',
  celulosa2: '#3b82f6',
  espera2: '#e4e4e7',
  resina: '#f59e0b',
  finalizacion: '#10b981',
};

interface TimelineTanqueProps {
  tanqueId: string;
  loteIndex: number;
  tareas: TareaProgramada[];
  proceso: OperacionEstandar[];
  baseInicioMin: number;
  finLote: number;
}

export function TimelineTanque({ tanqueId, loteIndex, tareas, proceso, baseInicioMin, finLote }: TimelineTanqueProps) {
  const lote = tareas
    .filter((t) => t.tanqueId === tanqueId && t.loteIndex === loteIndex)
    .sort((a, b) => a.inicioMin - b.inicioMin);

  if (!lote.length) return null;
  const total = Math.max(finLote, 1);

  return (
    <div className="card p-3 mb-3">
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-sm">
          {tanqueId} · Lote {loteIndex + 1}
        </span>
        <span className="text-xs text-muted-foreground font-mono">{lote[0].productoNombre}</span>
      </div>
      <div className="relative h-7 rounded-md overflow-hidden border border-border bg-muted">
        {lote.map((t) => {
          const left = (t.inicioMin / total) * 100;
          const width = Math.max(((t.finMin - t.inicioMin) / total) * 100, 1.5);
          const color = OP_COLORS[t.operacionId] ?? '#5b6570';
          return (
            <div
              key={t.id}
              title={`${t.operacionNombre}: ${offsetToClock(baseInicioMin, t.inicioMin)} (${durationLabel(t.duracionMin)})`}
              className="absolute top-0 bottom-0 border-r border-background/40"
              style={{ left: `${left}%`, width: `${width}%`, background: color }}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
        {proceso
          .filter((p) => lote.some((t) => t.operacionId === p.id))
          .map((p) => (
            <span key={p.id} className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
              <span className="w-2 h-2 rounded-sm" style={{ background: OP_COLORS[p.id] }} />
              {p.nombre}
            </span>
          ))}
      </div>
    </div>
  );
}

export function TimelineResumen({
  tareas,
  proceso,
  baseInicioMin,
}: {
  tareas: TareaProgramada[];
  proceso: OperacionEstandar[];
  baseInicioMin: number;
}) {
  const lotes = Array.from(new Set(tareas.filter((t) => t.tanqueId !== '—').map((t) => `${t.tanqueId}#${t.loteIndex}`)));

  return (
    <section className="space-y-1">
      <h2 className="text-sm font-semibold mb-2">Línea de tiempo por tanque</h2>
      {lotes.map((key) => {
        const [tanqueId, idx] = key.split('#');
        const lote = tareas.filter((t) => t.tanqueId === tanqueId && t.loteIndex === parseInt(idx, 10));
        const fin = Math.max(...lote.map((t) => t.finMin));
        return (
          <TimelineTanque
            key={key}
            tanqueId={tanqueId}
            loteIndex={parseInt(idx, 10)}
            tareas={tareas}
            proceso={proceso}
            baseInicioMin={baseInicioMin}
            finLote={fin}
          />
        );
      })}
    </section>
  );
}
