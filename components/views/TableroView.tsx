'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useStore } from '@/lib/store/useStore';
import { PageHeader } from '@/components/PageHeader';
import { PlanTabs } from '@/components/PlanTabs';
import { StatCard, EmptyState } from '@/components/ui';
import { calcularIndicadores, calcularCortes } from '@/lib/domain/engine';
import { offsetToClock, hhmmToMinutes } from '@/lib/domain/time';

function semaforoColor(pct: number) {
  if (pct >= 95) return 'text-emerald-600';
  if (pct >= 85) return 'text-amber-600';
  return 'text-red-600';
}

export function TableroView({ planId }: { planId?: string }) {
  const params = useParams();
  const id = planId ?? (params?.id as string | undefined);
  const jornadaActivaId = useStore((s) => s.jornadaActivaId);
  const jornadas = useStore((s) => s.jornadas);
  const avanzarSimulacion = useStore((s) => s.avanzarSimulacion);
  const simularJornadaCompleta = useStore((s) => s.simularJornadaCompleta);

  const jornada = id
    ? jornadas.find((j) => j.id === id)
    : jornadas.find((j) => j.id === jornadaActivaId) ?? jornadas.find((j) => j.estado === 'aprobada');

  if (!jornada || !jornada.resultado || jornada.estado === 'borrador') {
    return (
      <div>
        <PageHeader titulo="Tablero de avance" back="/" />
        <EmptyState
          titulo="Sin plan activo"
          mensaje={jornada?.estado === 'borrador' ? 'Aprueba el plan para comenzar a registrar avance.' : 'Crea y aprueba un plan para ver el tablero.'}
          accion={<Link href="/plan" className="btn btn-primary btn-lg">Ir al plan</Link>}
        />
      </div>
    );
  }

  const ind = calcularIndicadores(jornada);
  const cortes = calcularCortes(jornada);
  const base = hhmmToMinutes(jornada.horaInicio);
  const res = jornada.resultado;
  const enProceso = new Set(
    res.tareas.filter((t) => t.estado === 'proceso' || t.estado === 'espera').map((t) => `${t.tanqueId}#${t.loteIndex}`),
  ).size;
  return (
    <div className="space-y-4">
      <PageHeader
        titulo="Tablero de avance"
        subtitulo={`${jornada.turno} · Reloj ${offsetToClock(base, jornada.simClockMin ?? 0)} · ${jornada.fecha}`}
        back={planId ? `/plan/${planId}` : '/'}
      />
      {planId && <PlanTabs id={jornada.id} />}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard label="Galones planeados" value={ind.galonesPlaneados} />
        <StatCard label="Galones fabricados" value={ind.galonesFabricados} tone="success" />
        <StatCard label="Eficiencia operativa" value={`${ind.eficienciaOperativaPct}%`} tone={ind.eficienciaOperativaPct >= 95 ? 'success' : ind.eficienciaOperativaPct >= 85 ? 'warning' : 'danger'} />
        <StatCard label="Min. estándar al corte" value={ind.stdCompletadoMin} sub={`/${ind.stdPlaneadoAlCorteMin} plan`} />
        <StatCard label="Tanques terminados" value={`${ind.tanquesTerminados}/${ind.tanquesPlaneados}`} />
        <StatCard label="En proceso" value={enProceso} />
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-primary" onClick={() => avanzarSimulacion(jornada.id, 30)}>
          Avanzar 30 min (demo)
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => simularJornadaCompleta(jornada.id)}>
          Simular jornada completa
        </button>
        <Link href={`/plan/${jornada.id}/registro`} className="btn btn-ghost">
          Registrar avance real
        </Link>
      </div>

      <section className="card overflow-x-auto">
        <div className="px-4 pt-4">
          <h2 className="text-sm font-semibold">Cortes de avance</h2>
          <p className="text-xs text-muted-foreground mt-1">Incluye eficiencia por minutos estándar (no solo tanques terminados)</p>
        </div>
        <table className="w-full text-sm mt-2 min-w-[640px]">
          <thead>
            <tr className="text-left text-muted-foreground border-b border-border font-mono text-[10px] uppercase">
              <th className="px-4 py-3">Hora</th>
              <th className="px-4 py-3">Gal. plan</th>
              <th className="px-4 py-3">Gal. real</th>
              <th className="px-4 py-3">Min. std plan</th>
              <th className="px-4 py-3">Min. std real</th>
              <th className="px-4 py-3">Efic. operativa</th>
            </tr>
          </thead>
          <tbody>
            {cortes.map((c) => (
              <tr key={c.horaOffsetMin} className="border-b border-border/50">
                <td className="px-4 py-3 font-mono font-semibold">{offsetToClock(base, c.horaOffsetMin)}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.planeadoAcum} gal</td>
                <td className="px-4 py-3 text-muted-foreground">{c.realAcum} gal</td>
                <td className="px-4 py-3 font-mono text-muted-foreground">{c.stdPlaneadoAcum}</td>
                <td className="px-4 py-3 font-mono text-muted-foreground">{c.stdRealAcum}</td>
                <td className={`px-4 py-3 font-bold font-mono ${semaforoColor(c.eficienciaOperativaPct)}`}>{c.eficienciaOperativaPct}%</td>
              </tr>
            ))}
            {cortes.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-4 text-muted-foreground">Avanza el reloj o registra tareas para ver cortes.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
