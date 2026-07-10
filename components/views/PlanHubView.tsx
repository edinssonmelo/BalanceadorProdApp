'use client';

import Link from 'next/link';
import { useStore } from '@/lib/store/useStore';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/ui';
import { formatFechaLarga } from '@/lib/domain/time';

export function PlanHubView() {
  const jornadas = useStore((s) => s.jornadas);
  const jornadaActivaId = useStore((s) => s.jornadaActivaId);
  const activa = jornadas.find((j) => j.id === jornadaActivaId) ?? jornadas[0];

  if (!activa) {
    return (
      <div>
        <PageHeader titulo="Plan del día" back="/" />
        <EmptyState
          titulo="Sin plan activo"
          mensaje="Crea el plan del día para programar automáticamente la producción."
          accion={
            <Link href="/plan/nueva" className="btn btn-primary btn-lg">
              Crear plan del día
            </Link>
          }
        />
      </div>
    );
  }

  if (activa.estado === 'borrador') {
    return (
      <div>
        <PageHeader titulo="Plan del día" back="/" subtitulo="En revisión — aprueba para ejecutar" />
        <div className="card p-5 space-y-4">
          <p className="capitalize font-semibold">{formatFechaLarga(activa.fecha)} · {activa.turno}</p>
          <p className="text-sm text-muted-foreground">La programación está lista. Revísala y aprueba para comenzar el registro real.</p>
          <Link href={`/plan/${activa.id}/programacion`} className="btn btn-primary btn-lg w-full text-center">
            Revisar programación
          </Link>
        </div>
      </div>
    );
  }

  // Redirect handled by linking directly
  return (
    <div>
      <PageHeader titulo="Plan del día" back="/" />
      <Link href={`/plan/${activa.id}`} className="btn btn-primary btn-lg w-full text-center">
        Ver plan activo
      </Link>
    </div>
  );
}
