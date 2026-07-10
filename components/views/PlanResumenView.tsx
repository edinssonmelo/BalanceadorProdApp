'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useStore } from '@/lib/store/useStore';
import { PageHeader } from '@/components/PageHeader';
import { PlanTabs } from '@/components/PlanTabs';
import { StatCard, EmptyState, EstadoBadge, PasoFlujo } from '@/components/ui';
import { formatFechaLarga, offsetToClock, hhmmToMinutes } from '@/lib/domain/time';

export function PlanResumenView() {
  const params = useParams();
  const id = params.id as string;
  const jornadas = useStore((s) => s.jornadas);
  const jornada = jornadas.find((j) => j.id === id);

  if (!jornada) {
    return (
      <div>
        <PageHeader titulo="Plan del día" back="/" />
        <EmptyState
          titulo="No hay plan activo"
          mensaje="Crea un plan para ver la programación."
          accion={
            <Link href="/plan/nueva" className="btn btn-primary btn-lg">
              Crear plan del día
            </Link>
          }
        />
      </div>
    );
  }

  const res = jornada.resultado;
  const finClock = res ? offsetToClock(hhmmToMinutes(jornada.horaInicio), res.finEstimadoMin) : jornada.horaFin;
  const pasoActual =
    jornada.estado === 'borrador' ? 1 : jornada.estado === 'aprobada' ? 2 : jornada.estado === 'cerrada' ? 4 : 3;
  const retrasos = (jornada.cortesControl ?? []).filter((c) => c.estado === 'atrasado').length;
  const tanquesReales = jornada.tanquesReales ?? res?.tanquesPlaneados ?? 0;
  const cumplimiento =
    res && res.tanquesPlaneados > 0 ? Math.round((tanquesReales / res.tanquesPlaneados) * 100) : 0;

  return (
    <div className="space-y-4">
      <PageHeader
        titulo={`Plan · ${jornada.turno}`}
        subtitulo={<span className="capitalize">{formatFechaLarga(jornada.fecha)}</span>}
        back="/"
        right={<EstadoBadge estado={jornada.estado === 'cerrada' ? 'terminado' : 'programado'} />}
      />
      <PlanTabs id={jornada.id} />
      <PasoFlujo pasos={['Crear', 'Revisar', 'Hoja', 'Control', 'Cerrar']} actual={pasoActual} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Galones planeados" value={res?.galonesPlaneados ?? 0} />
        <StatCard label="Tanques planeados" value={res?.tanquesPlaneados ?? 0} sub={`Meta: ${jornada.metaTanques}`} />
        <StatCard label="Fin estimado" value={finClock} />
        <StatCard label="Retrasos marcados" value={retrasos} tone={retrasos > 0 ? 'warning' : 'default'} />
      </div>

      {jornada.estado === 'cerrada' && (
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Tanques reales" value={tanquesReales} />
          <StatCard label="Cumplimiento" value={`${cumplimiento}%`} tone={cumplimiento >= 90 ? 'success' : 'warning'} />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {jornada.estado === 'borrador' && (
          <Link href={`/plan/${jornada.id}/programacion`} className="btn btn-primary flex-1 text-center">
            Revisar programación
          </Link>
        )}
        {res && (
          <Link href={`/plan/${jornada.id}/hoja`} className="btn btn-success flex-1 text-center">
            Hoja de producción
          </Link>
        )}
        <Link href={`/plan/${jornada.id}/control`} className="btn btn-ghost flex-1 text-center">
          Control del día
        </Link>
      </div>
    </div>
  );
}
