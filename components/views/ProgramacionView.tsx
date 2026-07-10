'use client';

import { useParams, useRouter } from 'next/navigation';
import { useStore } from '@/lib/store/useStore';
import { PageHeader } from '@/components/PageHeader';
import { PlanTabs } from '@/components/PlanTabs';
import { StatCard, AlertaItem, EmptyState, ProgressBar, PasoFlujo } from '@/components/ui';
import { TimelineResumen } from '@/components/TimelineTanque';
import { offsetToClock, hhmmToMinutes } from '@/lib/domain/time';
import { compararOperarios } from '@/lib/domain/engine';

export function ProgramacionView() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const jornada = useStore((s) => s.jornadas.find((j) => j.id === id));
  const parametros = useStore((s) => s.parametros);
  const aprobarJornada = useStore((s) => s.aprobarJornada);
  const eliminarJornada = useStore((s) => s.eliminarJornada);
  const recalcularJornada = useStore((s) => s.recalcularJornada);

  if (!jornada || !jornada.resultado) {
    return (
      <div>
        <PageHeader titulo="Programación" back="/plan" />
        <EmptyState titulo="Plan no encontrado" />
      </div>
    );
  }

  const res = jornada.resultado;
  const base = hhmmToMinutes(jornada.horaInicio);
  const finClock = offsetToClock(base, res.finEstimadoMin);
  const numOps = jornada.operariosIds.length;
  const comp2 = compararOperarios(jornada, parametros, 2);
  const comp3 = compararOperarios(jornada, parametros, 3);
  const planDesactualizado =
    Math.abs(res.finEstimadoMin - comp2.finMin) > 5 || res.tanquesPlaneados !== comp2.tanques;

  const aprobar = () => {
    aprobarJornada(jornada.id);
    router.push(`/plan/${jornada.id}/registro`);
  };

  const descartar = () => {
    if (confirm('¿Descartar este plan?')) {
      eliminarJornada(jornada.id);
      router.push('/plan/nueva');
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        titulo="Programación generada"
        subtitulo={`${jornada.turno} · ${jornada.horaInicio}–${jornada.horaFin}`}
        back={`/plan/${id}`}
        right={
          <div className="flex gap-2">
            <button
              type="button"
              className="btn btn-ghost !py-2 !px-3 text-xs"
              onClick={() => recalcularJornada(jornada.id)}
            >
              Recalcular
            </button>
            <button type="button" className="btn btn-ghost !py-2 !px-3 text-xs" onClick={descartar}>
              Descartar
            </button>
          </div>
        }
      />
      <PlanTabs id={id} />
      <PasoFlujo pasos={['Crear', 'Revisar', 'Aprobar', 'Ejecutar', 'Cerrar']} actual={1} />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          label="Lotes programados"
          value={res.tanquesPlaneados}
          sub={`Meta: ${jornada.metaTanques} lotes`}
        />
        <StatCard label="Hora fin estimada" value={finClock} />
        <StatCard label="Operarios" value={numOps} />
        <StatCard label="Galones planeados" value={res.galonesPlaneados} />
        <StatCard
          label="Carga promedio"
          value={`${res.cargaPromedioPct}%`}
          tone={res.cargaPromedioPct > 90 ? 'warning' : 'default'}
        />
        <StatCard
          label="Meta"
          value={res.metaAlcanzable ? 'Alcanzable' : 'En riesgo'}
          tone={res.metaAlcanzable ? 'success' : 'warning'}
        />
      </div>

      {planDesactualizado && (
        <AlertaItem nivel="advertencia" titulo="Plan desactualizado">
          La comparación rápida no coincide con esta programación guardada. Pulsa <strong>Recalcular</strong> o
          crea un plan nuevo para aplicar el motor actual ({comp2.tanques} lotes · fin{' '}
          {offsetToClock(base, comp2.finMin)} con {Math.min(2, numOps)} operarios).
        </AlertaItem>
      )}

      {res.cuelloDeBotella && (
        <AlertaItem nivel="info" titulo="Cuello de botella">
          {res.cuelloDeBotella} concentra el mayor tiempo del plan.
        </AlertaItem>
      )}

      {res.alertas.map((a) => (
        <AlertaItem key={a.id} nivel={a.nivel}>
          {a.mensaje}
        </AlertaItem>
      ))}

      <section className="card p-4">
        <h2 className="text-sm font-semibold mb-2">Comparación rápida de operarios</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-muted rounded-md p-3 border border-border">
            <p className="eyebrow mb-1">Con 2 operarios</p>
            <p className="font-mono font-semibold">{comp2.tanques} tanques · fin {offsetToClock(base, comp2.finMin)}</p>
            <p className="text-xs text-muted-foreground">{comp2.galones} gal</p>
          </div>
          <div className="bg-muted rounded-md p-3 border border-border">
            <p className="eyebrow mb-1">Con 3 operarios</p>
            <p className="font-mono font-semibold">{comp3.tanques} tanques · fin {offsetToClock(base, comp3.finMin)}</p>
            <p className="text-xs text-muted-foreground">{comp3.galones} gal</p>
          </div>
        </div>
        {comp3.tanques > comp2.tanques && (
          <p className="text-xs text-emerald-600 mt-2">+1 operario permite {comp3.tanques - comp2.tanques} tanque(s) más.</p>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold mb-2">Carga por operario</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {res.cargas.map((c) => {
            const op = jornada.operariosSnapshot.find((o) => o.id === c.operarioId);
            const tone = c.estadoCarga === 'sobrecarga' ? 'danger' : c.estadoCarga === 'baja' ? 'warning' : 'success';
            return (
              <div key={c.operarioId} className="card p-4">
                <div className="flex justify-between mb-1">
                  <span className="font-semibold">{op?.nombre}</span>
                  <span className="font-mono font-bold text-sm">{c.cargaPct}%</span>
                </div>
                <ProgressBar pct={c.cargaPct} tone={tone} />
              </div>
            );
          })}
        </div>
      </section>

      <TimelineResumen tareas={res.tareas} proceso={jornada.proceso} baseInicioMin={base} />

      <section>
        <h2 className="text-sm font-semibold mb-2">Tanques físicos usados</h2>
        <p className="text-sm text-muted-foreground font-mono">{res.tanquesUsados.join(', ') || '—'}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {jornada.tanquesIds.length} tanque(s) disponible(s) al crear el plan. Cada lote puede reutilizar un tanque
          cuando termina el ciclo anterior.
        </p>
      </section>

      <button className="btn btn-success btn-lg w-full" onClick={aprobar}>
        Aprobar plan del día
      </button>
    </div>
  );
}
