'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { useStore } from '@/lib/store/useStore';
import { EstadoBadge, EmptyState } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { offsetToClock, hhmmToMinutes, durationLabel } from '@/lib/domain/time';
import { tareaAsignadaA } from '@/lib/domain/tarea-helpers';
import { cn } from '@/lib/utils';

export function VistaOperarioView() {
  const params = useParams();
  const jornadaId = params.jornadaId as string;
  const operarioId = params.operarioId as string;
  const router = useRouter();
  const jornada = useStore((s) => s.jornadas.find((j) => j.id === jornadaId));
  const registrarInicioReal = useStore((s) => s.registrarInicioReal);
  const registrarFinReal = useStore((s) => s.registrarFinReal);

  const operario = jornada?.operariosSnapshot.find((o) => o.id === operarioId);

  const tareas = useMemo(() => {
    if (!jornada?.resultado) return [];
    return jornada.resultado.tareas
      .filter((t) => tareaAsignadaA(t, operarioId))
      .sort((a, b) => a.inicioMin - b.inicioMin);
  }, [jornada, operarioId]);

  if (!jornada || !operario) {
    return (
      <div className="p-4">
        <EmptyState titulo="No disponible" mensaje="El plan o el operario no existe." />
      </div>
    );
  }

  const base = hhmmToMinutes(jornada.horaInicio);
  const actual = tareas.find((t) => t.estado === 'proceso');
  const pendientes = tareas.filter((t) => t.estado === 'programado' || t.estado === 'pendiente');
  const focoTarea = actual ?? pendientes[0];

  return (
    <div className="min-h-full bg-background p-4 max-w-lg mx-auto">
      <header className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="sm" onClick={() => router.push(`/plan/${jornada.id}/operario`)}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Volver
        </Button>
        <div className="text-right">
          <h1 className="text-lg font-semibold">{operario.nombre}</h1>
          <p className="text-xs text-muted-foreground tabular-nums">
            {jornada.turno} · {jornada.horaInicio}–{jornada.horaFin}
          </p>
        </div>
      </header>

      {focoTarea ? (
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="eyebrow">{actual ? 'Tarea actual' : 'Próxima'}</span>
              <EstadoBadge estado={focoTarea.estado} />
            </div>
            <p className="text-2xl font-semibold tabular-nums tracking-tight">
              {offsetToClock(base, focoTarea.inicioMin)} · {focoTarea.tanqueId}
            </p>
            <p className="text-base font-medium mt-1">{focoTarea.operacionNombre}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {focoTarea.productoNombre} · {durationLabel(focoTarea.duracionMin)}
            </p>
            {focoTarea.productoInstruccion && (
              <div className="mt-3 p-2.5 rounded-md bg-muted text-xs">{focoTarea.productoInstruccion}</div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-4">
              <Button disabled={focoTarea.estado === 'proceso'} onClick={() => registrarInicioReal(jornada.id, focoTarea.id, focoTarea.inicioMin)}>
                Iniciar
              </Button>
              <Button variant="success" disabled={focoTarea.estado !== 'proceso'} onClick={() => registrarFinReal(jornada.id, focoTarea.id, focoTarea.finMin)}>
                Finalizar
              </Button>
              <Button
                variant="destructive"
                onClick={() => registrarFinReal(jornada.id, focoTarea.id, focoTarea.finMin + 10, 'proceso_largo', 'Novedad')}
              >
                Novedad
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-4">
          <CardContent className="p-6 text-center text-sm font-medium text-emerald-600">Todas las tareas completadas</CardContent>
        </Card>
      )}

      <section>
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Lista del día</h2>
        <ul className="space-y-1.5">
          {tareas.map((t) => (
            <li
              key={t.id}
              className={cn(
                'flex items-center justify-between rounded-md border px-3 py-2.5 text-sm',
                t.id === focoTarea?.id ? 'border-primary bg-muted' : 'border-border bg-card',
              )}
            >
              <div>
                <p className="font-medium tabular-nums">
                  {offsetToClock(base, t.inicioMin)} · {t.tanqueId}
                </p>
                <p className="text-xs text-muted-foreground">{t.operacionNombre}</p>
              </div>
              <EstadoBadge estado={t.estado} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
