'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useStore } from '@/lib/store/useStore';
import { PageHeader } from '@/components/PageHeader';
import { PlanTabs } from '@/components/PlanTabs';
import { StatCard, EmptyState, EstadoBadge, PasoFlujo } from '@/components/ui';
import { formatFechaLarga, offsetToClock, hhmmToMinutes } from '@/lib/domain/time';
import { calcularIndicadores, estadoJornadaSemaforo } from '@/lib/domain/engine';

export function PlanResumenView() {
  const params = useParams();
  const id = params.id as string;
  const jornadas = useStore((s) => s.jornadas);
  const parametros = useStore((s) => s.parametros);
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
  const ind = calcularIndicadores(jornada);
  const semaforo = estadoJornadaSemaforo(ind.eficienciaOperativaPct || 100, parametros);
  const finClock = res ? offsetToClock(hhmmToMinutes(jornada.horaInicio), res.finEstimadoMin) : jornada.horaFin;
  const pasoActual = jornada.estado === 'borrador' ? 1 : jornada.estado === 'aprobada' ? 3 : 4;

  return (
    <div className="space-y-4">
      <PageHeader
        titulo={`Plan · ${jornada.turno}`}
        subtitulo={<span className="capitalize">{formatFechaLarga(jornada.fecha)}</span>}
        back="/"
        right={<EstadoBadge estado={semaforo.nivel} />}
      />
      <PlanTabs id={jornada.id} />
      <PasoFlujo pasos={['Crear', 'Revisar', 'Aprobar', 'Ejecutar', 'Cerrar']} actual={pasoActual} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Galones planeados" value={res?.galonesPlaneados ?? 0} />
        <StatCard label="Tanques planeados" value={res?.tanquesPlaneados ?? 0} sub={`Meta: ${jornada.metaTanques}`} />
        <StatCard label="Fin estimado" value={finClock} />
        <StatCard label="Carga promedio" value={`${res?.cargaPromedioPct ?? 0}%`} />
      </div>

      <div className="flex flex-wrap gap-2">
        {jornada.estado === 'borrador' && (
          <Link href={`/plan/${jornada.id}/programacion`} className="btn btn-primary flex-1 text-center">
            Revisar programación
          </Link>
        )}
        {jornada.estado !== 'borrador' && (
          <Link href={`/plan/${jornada.id}/registro`} className="btn btn-primary flex-1 text-center">
            Registrar avance
          </Link>
        )}
        <Link href={`/plan/${jornada.id}/tablero`} className="btn btn-ghost flex-1 text-center">
          Tablero
        </Link>
      </div>

      <section>
        <h2 className="text-sm font-semibold mb-2">Vista por operario</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {jornada.operariosSnapshot
            .filter((o) => jornada.operariosIds.includes(o.id))
            .map((o) => (
              <Link
                key={o.id}
                href={`/operario/${jornada.id}/${o.id}`}
                className="card p-3 block hover:border-foreground/20 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{o.nombre}</span>
                  <span className="text-primary text-xs font-medium">Vista operario →</span>
                </div>
                <p className="text-xs text-muted-foreground capitalize mt-1">
                  {o.rol} · Efic. {o.eficiencia}%
                </p>
              </Link>
            ))}
        </div>
      </section>
    </div>
  );
}
