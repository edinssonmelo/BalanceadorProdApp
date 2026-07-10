'use client';

import Link from 'next/link';
import { useStore } from '@/lib/store/useStore';
import { Card, StatCard, EmptyState } from '@/components/ui';
import { formatFechaLarga, todayISO } from '@/lib/domain/time';
import { calcularIndicadores } from '@/lib/domain/engine';

export function InicioView() {
  const jornadas = useStore((s) => s.jornadas);
  const jornadaActivaId = useStore((s) => s.jornadaActivaId);

  const activa = jornadas.find((j) => j.id === jornadaActivaId) ?? jornadas[0];
  const ind = activa ? calcularIndicadores(activa) : null;
  const retrasos = (activa?.cortesControl ?? []).filter((c) => c.estado === 'atrasado').length;

  return (
    <div className="space-y-4">
      <div>
        <p className="eyebrow">{formatFechaLarga(todayISO())}</p>
        <h1 className="text-lg font-semibold mt-0.5">Panel de planta</h1>
      </div>

      {activa ? (
        <Card className="!p-5">
          <div className="mb-4">
            <p className="eyebrow">Plan del día · {activa.estado === 'borrador' ? 'en revisión' : activa.estado}</p>
            <p className="font-semibold capitalize mt-1">
              {formatFechaLarga(activa.fecha)} · {activa.turno}
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Galones planeados" value={ind?.galonesPlaneados ?? 0} />
            <StatCard label="Tanques planeados" value={ind?.tanquesPlaneados ?? 0} />
            <StatCard
              label="Cumplimiento"
              value={`${ind?.cumplimientoPct ?? 0}%`}
              tone={(ind?.cumplimientoPct ?? 0) >= 95 ? 'success' : (ind?.cumplimientoPct ?? 0) >= 85 ? 'warning' : 'default'}
            />
            <StatCard label="Retrasos marcados" value={retrasos} tone={retrasos > 0 ? 'warning' : 'default'} />
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <Link href={`/plan/${activa.id}`} className="btn btn-primary btn-lg flex-1 text-center">
              Ver plan del día
            </Link>
            {activa.resultado && (
              <Link href={`/plan/${activa.id}/hoja`} className="btn btn-success btn-lg flex-1 text-center">
                Hoja imprimible
              </Link>
            )}
            <Link href={`/plan/${activa.id}/control`} className="btn btn-ghost btn-lg flex-1 text-center">
              Control
            </Link>
          </div>
        </Card>
      ) : (
        <EmptyState
          titulo="No hay plan activo"
          mensaje="Crea el plan del día: selecciona operarios, estado de tanques y meta de producción."
          accion={
            <Link href="/plan/nueva" className="btn btn-primary btn-lg">
              Crear plan del día
            </Link>
          }
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link href="/historico" className="card p-3 hover:border-foreground/20 transition-colors block">
          <p className="eyebrow">Histórico</p>
          <p className="font-semibold mt-1">{jornadas.filter((j) => j.estado === 'cerrada').length} cierres</p>
          <p className="text-xs text-muted-foreground mt-1">Consultar jornadas anteriores</p>
        </Link>
        <Link href="/configuracion" className="card p-3 hover:border-foreground/20 transition-colors block">
          <p className="eyebrow">Configuración</p>
          <p className="font-semibold mt-1">Proceso y pausas</p>
          <p className="text-xs text-muted-foreground mt-1">Parámetros del planificador</p>
        </Link>
      </div>

      <Link href="/plan/nueva" className="btn btn-primary btn-lg w-full text-center">
        Crear plan del día
      </Link>
    </div>
  );
}
