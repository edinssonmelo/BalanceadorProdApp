'use client';

import Link from 'next/link';
import { useStore } from '@/lib/store/useStore';
import { Card, StatCard, EstadoBadge, EmptyState } from '@/components/ui';
import { formatFechaLarga, todayISO } from '@/lib/domain/time';
import { calcularIndicadores, estadoJornadaSemaforo } from '@/lib/domain/engine';

export function InicioView() {
  const jornadas = useStore((s) => s.jornadas);
  const jornadaActivaId = useStore((s) => s.jornadaActivaId);
  const parametros = useStore((s) => s.parametros);

  const activa = jornadas.find((j) => j.id === jornadaActivaId) ?? jornadas[0];
  const ind = activa ? calcularIndicadores(activa) : null;
  const semaforo = ind
    ? estadoJornadaSemaforo(ind.eficienciaOperativaPct || ind.eficienciaPlantaPct || 100, parametros)
    : null;

  return (
    <div className="space-y-4">
      <div>
        <p className="eyebrow">{formatFechaLarga(todayISO())}</p>
        <h1 className="text-lg font-semibold mt-0.5">Panel de planta</h1>
      </div>

      {activa ? (
        <Card className="!p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="eyebrow">Plan del día · {activa.estado === 'borrador' ? 'en revisión' : activa.estado}</p>
              <p className="font-semibold capitalize mt-1">
                {formatFechaLarga(activa.fecha)} · {activa.turno}
              </p>
            </div>
            {semaforo && <EstadoBadge estado={semaforo.nivel} />}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Galones planeados" value={ind?.galonesPlaneados ?? 0} />
            <StatCard label="Galones reales" value={ind?.galonesFabricados ?? 0} tone="success" />
            <StatCard
              label="Cumplimiento"
              value={`${ind?.cumplimientoPct ?? 0}%`}
              tone={(ind?.cumplimientoPct ?? 0) >= 95 ? 'success' : (ind?.cumplimientoPct ?? 0) >= 85 ? 'warning' : 'danger'}
            />
            <StatCard
              label="Eficiencia operativa"
              value={`${ind?.eficienciaOperativaPct ?? 0}%`}
              tone={(ind?.eficienciaOperativaPct ?? 0) >= 95 ? 'success' : (ind?.eficienciaOperativaPct ?? 0) >= 85 ? 'warning' : 'danger'}
            />
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <Link href={`/plan/${activa.id}`} className="btn btn-primary btn-lg flex-1 text-center">
              Ver plan del día
            </Link>
            <Link href={`/plan/${activa.id}/tablero`} className="btn btn-ghost btn-lg flex-1 text-center">
              Tablero
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link href="/tablero" className="card p-3 hover:border-foreground/20 transition-colors block">
          <p className="eyebrow">Tablero</p>
          <p className="font-semibold mt-1">Avance en vivo</p>
          <p className="text-xs text-muted-foreground mt-1">Planeado vs. real</p>
        </Link>
        <Link href="/indicadores" className="card p-3 hover:border-foreground/20 transition-colors block">
          <p className="eyebrow">Indicadores</p>
          <p className="font-semibold mt-1">Eficiencia</p>
          <p className="text-xs text-muted-foreground mt-1">Planta y operario</p>
        </Link>
        <Link href="/historico" className="card p-3 hover:border-foreground/20 transition-colors block">
          <p className="eyebrow">Histórico</p>
          <p className="font-semibold mt-1">{jornadas.filter((j) => j.estado === 'cerrada').length} cierres</p>
          <p className="text-xs text-muted-foreground mt-1">Consultar jornadas</p>
        </Link>
      </div>

      <Link href="/plan/nueva" className="btn btn-primary btn-lg w-full text-center">
        Crear plan del día
      </Link>
    </div>
  );
}
