'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useStore } from '@/lib/store/useStore';
import { PageHeader } from '@/components/PageHeader';
import { PlanTabs } from '@/components/PlanTabs';
import { EmptyState, AlertaItem } from '@/components/ui';
import { baseInicioJornada, filasHorariasEnCurso } from '@/lib/domain/hoja';
import { hhmmToMinutes, offsetToClock } from '@/lib/domain/time';
import type { EstadoCorteControl } from '@/lib/domain/types';

export function ControlDiaView() {
  const params = useParams();
  const id = params.id as string;
  const jornada = useStore((s) => s.jornadas.find((j) => j.id === id));
  const marcarCorteControl = useStore((s) => s.marcarCorteControl);
  const setTanquesReales = useStore((s) => s.setTanquesReales);
  const setObservacionFinal = useStore((s) => s.setObservacionFinal);
  const cerrarJornada = useStore((s) => s.cerrarJornada);

  const [obs, setObs] = useState(jornada?.observacionFinal ?? '');

  const ahoraMin = useMemo(() => {
    const now = new Date();
    const mins = now.getHours() * 60 + now.getMinutes();
    if (!jornada) return 0;
    const base = hhmmToMinutes(jornada.horaInicio);
    return Math.max(0, mins - base);
  }, [jornada]);

  if (!jornada?.resultado) {
    return (
      <div>
        <PageHeader titulo="Control del día" back="/plan" />
        <EmptyState titulo="Plan no encontrado" />
      </div>
    );
  }

  const base = baseInicioJornada(jornada);
  const filas = filasHorariasEnCurso(jornada.resultado.tareas, base);
  const cortes = jornada.cortesControl ?? [];

  const estadoCorte = (min: number): EstadoCorteControl =>
    cortes.find((c) => c.horaOffsetMin === min)?.estado ?? 'pendiente';

  const marcar = (min: number, estado: EstadoCorteControl) => {
    marcarCorteControl(jornada.id, min, estado);
  };

  const retrasos = cortes.filter((c) => c.estado === 'atrasado').length;
  const tanquesReales = jornada.tanquesReales ?? jornada.resultado.tanquesPlaneados;
  const cumplimiento =
    jornada.resultado.tanquesPlaneados > 0
      ? Math.round((tanquesReales / jornada.resultado.tanquesPlaneados) * 100)
      : 0;

  const filaActual = [...filas].reverse().find((f) => f.horaOffsetMin <= ahoraMin);

  return (
    <div className="space-y-4">
      <PageHeader
        titulo="Control del día"
        subtitulo="Supervisor — revisión por hora"
        back={`/plan/${id}`}
      />
      <PlanTabs id={id} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card p-3">
          <p className="text-xs text-muted-foreground">Hora actual</p>
          <p className="font-mono font-bold">{offsetToClock(base, ahoraMin)}</p>
        </div>
        <div className="card p-3">
          <p className="text-xs text-muted-foreground">Tanques planeados</p>
          <p className="font-mono font-bold">{jornada.resultado.tanquesPlaneados}</p>
        </div>
        <div className="card p-3">
          <p className="text-xs text-muted-foreground">Retrasos marcados</p>
          <p className="font-mono font-bold">{retrasos}</p>
        </div>
        <div className="card p-3">
          <p className="text-xs text-muted-foreground">Cumplimiento</p>
          <p className="font-mono font-bold">{cumplimiento}%</p>
        </div>
      </div>

      {filaActual && (
        <AlertaItem nivel="info" titulo="Ahora debería estar pasando">
          {filaActual.actividades.join(' · ')}
        </AlertaItem>
      )}

      <section className="card p-4">
        <h2 className="text-sm font-semibold mb-3">Cortes por hora</h2>
        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
          {filas.map((f) => {
            const est = estadoCorte(f.horaOffsetMin);
            return (
              <div
                key={f.horaOffsetMin}
                className={`flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-md border ${
                  est === 'ok'
                    ? 'border-emerald-200 bg-emerald-50'
                    : est === 'atrasado'
                      ? 'border-red-200 bg-red-50'
                      : 'border-border bg-muted/30'
                }`}
              >
                <span className="font-mono font-semibold text-sm w-16 shrink-0">{f.horaLabel}</span>
                <p className="flex-1 text-sm text-muted-foreground">{f.actividades.join(' · ')}</p>
                <div className="flex gap-1 shrink-0">
                  <button
                    type="button"
                    className="btn btn-ghost !py-1 !px-2 text-xs"
                    onClick={() => marcar(f.horaOffsetMin, 'ok')}
                  >
                    OK
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost !py-1 !px-2 text-xs text-red-600"
                    onClick={() => marcar(f.horaOffsetMin, 'atrasado')}
                  >
                    Atrasado
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="card p-4 space-y-3">
        <h2 className="text-sm font-semibold">Cierre del día</h2>
        <div>
          <label className="field-label">Tanques realmente fabricados</label>
          <input
            type="number"
            className="field-input max-w-xs"
            value={tanquesReales}
            min={0}
            onChange={(e) => setTanquesReales(jornada.id, parseInt(e.target.value, 10) || 0)}
          />
        </div>
        <div>
          <label className="field-label">Observación final</label>
          <textarea
            className="field-input min-h-[80px]"
            value={obs}
            onChange={(e) => setObs(e.target.value)}
            onBlur={() => setObservacionFinal(jornada.id, obs)}
          />
        </div>
        {jornada.estado !== 'cerrada' && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setObservacionFinal(jornada.id, obs);
              cerrarJornada(jornada.id);
            }}
          >
            Cerrar plan del día
          </button>
        )}
      </section>
    </div>
  );
}
