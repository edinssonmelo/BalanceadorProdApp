'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useStore } from '@/lib/store/useStore';
import { PageHeader } from '@/components/PageHeader';
import { PlanTabs } from '@/components/PlanTabs';
import { EmptyState, EstadoBadge, PasoFlujo } from '@/components/ui';
import { offsetToClock, hhmmToMinutes, durationLabel } from '@/lib/domain/time';
import { tareaOperarios } from '@/lib/domain/tarea-helpers';
import type { TareaProgramada } from '@/lib/domain/types';

export function RegistroRealView() {
  const params = useParams();
  const id = params.id as string;
  const jornada = useStore((s) => s.jornadas.find((j) => j.id === id));
  const motivos = useStore((s) => s.motivos);
  const registrarInicioReal = useStore((s) => s.registrarInicioReal);
  const registrarFinReal = useStore((s) => s.registrarFinReal);

  const [finalizando, setFinalizando] = useState<TareaProgramada | null>(null);
  const [extraMin, setExtraMin] = useState(0);
  const [motivoId, setMotivoId] = useState('');
  const [observacion, setObservacion] = useState('');

  if (!jornada || !jornada.resultado) {
    return (
      <div>
        <PageHeader titulo="Registro real" back="/plan" />
        <EmptyState titulo="Plan no encontrado" />
      </div>
    );
  }

  const res = jornada.resultado;
  const base = hhmmToMinutes(jornada.horaInicio);
  const tareas = res.tareas.filter((t) => t.tipo !== 'pasivo').sort((a, b) => a.inicioMin - b.inicioMin);

  const confirmarFin = () => {
    if (!finalizando) return;
    const inicio = finalizando.realInicioMin ?? finalizando.inicioMin;
    const fin = inicio + finalizando.duracionMin + extraMin;
    registrarFinReal(jornada.id, finalizando.id, fin, motivoId || null, observacion || null);
    setFinalizando(null);
  };

  return (
    <div className="space-y-4">
      <PageHeader titulo="Registro real" subtitulo="Marca inicio y fin de cada operación" back={`/plan/${id}`} />
      <PlanTabs id={id} />
      <PasoFlujo pasos={['Crear', 'Revisar', 'Aprobar', 'Ejecutar', 'Cerrar']} actual={3} />

      <div className="space-y-2">
        {tareas.map((t) => {
          const ops = tareaOperarios(t)
            .map((oid) => jornada.operariosSnapshot.find((o) => o.id === oid)?.nombre)
            .filter(Boolean);
          const opLabel = ops.length ? ops.join(' + ') : '—';
          const realTxt =
            t.realInicioMin != null
              ? `${offsetToClock(base, t.realInicioMin)}${t.realFinMin != null ? '–' + offsetToClock(base, t.realFinMin) : '…'}`
              : '—';
          return (
            <div key={t.id} className="card p-3 flex flex-wrap items-center gap-3">
              <span className="font-mono text-xs text-muted-foreground w-14">{offsetToClock(base, t.inicioMin)}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{t.operacionNombre}</p>
                <p className="text-xs text-muted-foreground">
                  {t.tanqueId} · {opLabel} · Real: {realTxt}
                </p>
              </div>
              <EstadoBadge estado={t.estado} />
              {t.estado === 'terminado' || t.estado === 'retrasado' ? (
                <span className="text-emerald-600 text-sm font-semibold">✓</span>
              ) : t.realInicioMin == null ? (
                <button className="btn btn-primary !py-1.5 !px-3 text-xs" onClick={() => registrarInicioReal(jornada.id, t.id, t.inicioMin)}>
                  Iniciar
                </button>
              ) : (
                <button className="btn btn-success !py-1.5 !px-3 text-xs" onClick={() => { setFinalizando(t); setExtraMin(0); setMotivoId(''); setObservacion(''); }}>
                  Finalizar
                </button>
              )}
            </div>
          );
        })}
      </div>

      {finalizando && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setFinalizando(null)}>
          <div className="bg-card border border-border rounded-lg w-full max-w-md p-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold mb-1">Finalizar operación</h3>
            <p className="text-muted-foreground text-sm mb-4">
              {finalizando.tanqueId} · {finalizando.operacionNombre} · estándar {durationLabel(finalizando.duracionMin)}
            </p>
            <label className="field-label">Tiempo real</label>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[0, 5, 10, 15].map((m) => (
                <button key={m} type="button" className={`btn !py-2 text-xs ${extraMin === m ? 'btn-primary' : 'btn-neutral'}`} onClick={() => setExtraMin(m)}>
                  {m === 0 ? 'A tiempo' : `+${m}m`}
                </button>
              ))}
            </div>
            {extraMin > 0 && (
              <>
                <label className="field-label">Motivo de retraso</label>
                <select className="field-input mb-4" value={motivoId} onChange={(e) => setMotivoId(e.target.value)}>
                  <option value="">Seleccionar…</option>
                  {motivos.map((m) => (
                    <option key={m.id} value={m.id}>{m.nombre}</option>
                  ))}
                </select>
              </>
            )}
            <label className="field-label">Observación (opcional)</label>
            <textarea className="field-input mb-4" rows={2} value={observacion} onChange={(e) => setObservacion(e.target.value)} />
            <div className="flex gap-2">
              <button type="button" className="btn btn-neutral flex-1" onClick={() => setFinalizando(null)}>Cancelar</button>
              <button type="button" className="btn btn-success flex-1" onClick={confirmarFin}>Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
