'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useStore } from '@/lib/store/useStore';
import { PageHeader } from '@/components/PageHeader';
import { PlanTabs } from '@/components/PlanTabs';
import { StatCard, EmptyState, EstadoBadge } from '@/components/ui';
import { calcularIndicadores, calcularIndicadoresOperario, estadoJornadaSemaforo } from '@/lib/domain/engine';
import { durationLabel } from '@/lib/domain/time';

export function IndicadoresView({ planId }: { planId?: string }) {
  const params = useParams();
  const router = useRouter();
  const id = planId ?? (params?.id as string | undefined);
  const jornadas = useStore((s) => s.jornadas);
  const jornadaActivaId = useStore((s) => s.jornadaActivaId);
  const parametros = useStore((s) => s.parametros);
  const cerrarJornada = useStore((s) => s.cerrarJornada);
  const setObservacionFinal = useStore((s) => s.setObservacionFinal);

  const jornada = id
    ? jornadas.find((j) => j.id === id)
    : jornadas.find((j) => j.id === jornadaActivaId) ?? jornadas.find((j) => j.estado === 'aprobada');

  if (!jornada || !jornada.resultado || jornada.estado === 'borrador') {
    return (
      <div>
        <PageHeader titulo="Indicadores del día" back="/" />
        <EmptyState
          titulo="Aún no hay datos"
          mensaje="Los indicadores aparecen cuando el plan está aprobado o cerrado."
          accion={<Link href="/plan" className="btn btn-primary btn-lg">Ir al plan</Link>}
        />
      </div>
    );
  }

  const ind = calcularIndicadores(jornada);
  const porOperario = calcularIndicadoresOperario(jornada);
  const semaforo = estadoJornadaSemaforo(ind.eficienciaOperativaPct || ind.eficienciaPlantaPct || 100, parametros);

  return (
    <div className="space-y-4">
      <PageHeader
        titulo="Indicadores del día"
        subtitulo={`${jornada.turno} · ${jornada.fecha}`}
        back="/"
        right={<EstadoBadge estado={semaforo.nivel} />}
      />
      {planId && <PlanTabs id={jornada.id} />}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Galones planeados" value={ind.galonesPlaneados} />
        <StatCard label="Galones fabricados" value={ind.galonesFabricados} tone="success" />
        <StatCard label="Cumplimiento" value={`${ind.cumplimientoPct}%`} tone={ind.cumplimientoPct >= 95 ? 'success' : ind.cumplimientoPct >= 85 ? 'warning' : 'danger'} />
        <StatCard label="Eficiencia operativa" value={`${ind.eficienciaOperativaPct}%`} tone={ind.eficienciaOperativaPct >= 95 ? 'success' : ind.eficienciaOperativaPct >= 85 ? 'warning' : 'danger'} />
        <StatCard label="Tanques planeados" value={ind.tanquesPlaneados} />
        <StatCard label="Tanques terminados" value={ind.tanquesTerminados} tone="success" />
        <StatCard label="Retraso acumulado" value={durationLabel(ind.retrasoAcumuladoMin)} tone={ind.retrasoAcumuladoMin > 0 ? 'warning' : 'default'} />
        <StatCard label="Estado" value={semaforo.label} />
      </div>

      <section className="card overflow-x-auto">
        <h2 className="text-sm font-semibold p-4 pb-2">Por operario</h2>
        <table className="w-full text-sm min-w-[480px]">
          <thead>
            <tr className="text-left text-muted-foreground border-b border-border font-mono text-[10px] uppercase">
              <th className="px-4 py-2">Operario</th>
              <th className="px-4 py-2">Eficiencia</th>
              <th className="px-4 py-2">Carga</th>
              <th className="px-4 py-2">Tareas</th>
              <th className="px-4 py-2">Retraso</th>
            </tr>
          </thead>
          <tbody>
            {porOperario.map((o) => (
              <tr key={o.operarioId} className="border-b border-border/50">
                <td className="px-4 py-3 font-semibold">{o.nombre}</td>
                <td className="px-4 py-3 font-mono">{o.eficienciaPct}%</td>
                <td className="px-4 py-3 font-mono">{o.cargaPct}%</td>
                <td className="px-4 py-3">{o.tareasCompletadas}</td>
                <td className="px-4 py-3 font-mono">{durationLabel(o.retrasoMin)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card p-4">
        <label className="field-label">Observación final</label>
        <textarea
          className="field-input"
          rows={2}
          value={jornada.observacionFinal ?? ''}
          onChange={(e) => setObservacionFinal(jornada.id, e.target.value)}
          placeholder="Notas de cierre de la jornada…"
        />
      </section>

      <div className="flex flex-wrap gap-2">
        {jornada.estado !== 'cerrada' ? (
          <button
            type="button"
            className="btn btn-success btn-lg flex-1"
            onClick={() => {
              cerrarJornada(jornada.id);
              router.push('/historico');
            }}
          >
            Cerrar jornada
          </button>
        ) : (
          <div className="btn btn-neutral btn-lg flex-1 cursor-default">Jornada cerrada</div>
        )}
        <Link href="/historico" className="btn btn-ghost btn-lg text-center">Ver histórico</Link>
      </div>
    </div>
  );
}
