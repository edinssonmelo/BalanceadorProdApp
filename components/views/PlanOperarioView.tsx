'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useStore } from '@/lib/store/useStore';
import { PageHeader } from '@/components/PageHeader';
import { PlanTabs } from '@/components/PlanTabs';
import { EmptyState, EstadoBadge, ProgressBar } from '@/components/ui';
import { offsetToClock, hhmmToMinutes, durationLabel } from '@/lib/domain/time';

export function PlanOperarioView() {
  const params = useParams();
  const id = params.id as string;
  const jornada = useStore((s) => s.jornadas.find((j) => j.id === id));

  if (!jornada || !jornada.resultado) {
    return (
      <div>
        <PageHeader titulo="Plan por operario" back="/plan" />
        <EmptyState titulo="Plan no encontrado" />
      </div>
    );
  }

  const res = jornada.resultado;
  const base = hhmmToMinutes(jornada.horaInicio);
  const operarios = jornada.operariosSnapshot.filter((o) => jornada.operariosIds.includes(o.id));

  return (
    <div className="space-y-4">
      <PageHeader titulo="Plan por operario" back={`/plan/${id}`} />
      <PlanTabs id={id} />

      <div className="space-y-4">
        {operarios.map((o) => {
          const carga = res.cargas.find((c) => c.operarioId === o.id);
          const tareas = res.tareas.filter((t) => t.operarioId === o.id).sort((a, b) => a.inicioMin - b.inicioMin);
          const tone = carga?.estadoCarga === 'sobrecarga' ? 'danger' : carga?.estadoCarga === 'baja' ? 'warning' : 'success';
          return (
            <section key={o.id} className="card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-md bg-muted flex items-center justify-center font-semibold">
                    {o.nombre[0]}
                  </div>
                  <div>
                    <h2 className="font-semibold">{o.nombre}</h2>
                    <p className="text-xs text-muted-foreground capitalize">
                      {o.rol} · Eficiencia {o.eficiencia}%
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono font-semibold text-base">{carga?.cargaPct ?? 0}%</span>
                  <p className="text-xs text-muted-foreground">carga</p>
                </div>
                <Link href={`/operario/${jornada.id}/${o.id}`} className="btn btn-ghost !py-2 text-xs">
                  Vista operario →
                </Link>
              </div>
              <ProgressBar pct={carga?.cargaPct ?? 0} tone={tone} />
              <p className="text-xs text-muted-foreground mt-1 font-mono">
                {durationLabel(carga?.minutosAsignados ?? 0)} de {durationLabel(carga?.minutosDisponibles ?? 0)}
              </p>
              <div className="mt-3 space-y-1.5">
                {tareas.map((t) => (
                  <div key={t.id} className="flex items-center gap-3 bg-muted rounded-md px-3 py-2 text-sm">
                    <span className="font-mono text-xs text-muted-foreground w-12">{offsetToClock(base, t.inicioMin)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{t.operacionNombre}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.tanqueId} · {t.productoNombre}
                        {t.productoInstruccion && ` · ${t.productoInstruccion}`}
                      </p>
                    </div>
                    <EstadoBadge estado={t.estado} />
                  </div>
                ))}
                {tareas.length === 0 && <p className="text-sm text-muted-foreground">Sin tareas asignadas.</p>}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
