'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store/useStore';
import { PageHeader } from '@/components/PageHeader';

const SECCIONES = [
  { id: 'operarios', label: 'Operarios', href: '/operarios' },
  { id: 'tanques', label: 'Tanques', href: '/tanques' },
  { id: 'proceso', label: 'Proceso estándar' },
  { id: 'pausas', label: 'Pausas' },
  { id: 'motivos', label: 'Motivos de retraso' },
  { id: 'parametros', label: 'Parámetros' },
] as const;

export function ConfiguracionView() {
  const proceso = useStore((s) => s.proceso);
  const actualizarOperacion = useStore((s) => s.actualizarOperacion);
  const motivos = useStore((s) => s.motivos);
  const agregarMotivo = useStore((s) => s.agregarMotivo);
  const eliminarMotivo = useStore((s) => s.eliminarMotivo);
  const parametros = useStore((s) => s.parametros);
  const actualizarParametros = useStore((s) => s.actualizarParametros);
  const agregarPausa = useStore((s) => s.agregarPausa);
  const eliminarPausa = useStore((s) => s.eliminarPausa);
  const actualizarPausa = useStore((s) => s.actualizarPausa);

  const [seccion, setSeccion] = useState<(typeof SECCIONES)[number]['id']>('proceso');
  const [nuevoMotivo, setNuevoMotivo] = useState('');

  return (
    <div className="space-y-4">
      <PageHeader titulo="Configuración" subtitulo="Parametriza el sistema sin desarrollo" back="/" />

      <div className="flex gap-1 overflow-x-auto pb-1 bg-muted border border-border rounded-lg p-1">
        {SECCIONES.map((s) =>
          'href' in s && s.href ? (
            <Link
              key={s.id}
              href={s.href}
              className="shrink-0 px-3 py-2 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              {s.label}
            </Link>
          ) : (
            <button
              key={s.id}
              type="button"
              onClick={() => setSeccion(s.id)}
              className={`shrink-0 px-3 py-2 rounded-md text-xs font-medium ${
                seccion === s.id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              {s.label}
            </button>
          ),
        )}
      </div>

      {seccion === 'proceso' && (
        <section className="card overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border font-mono text-[10px] uppercase">
                <th className="px-3 py-3">#</th>
                <th className="px-3 py-3">Operación</th>
                <th className="px-3 py-3">Tipo</th>
                <th className="px-3 py-3">Duración (min)</th>
              </tr>
            </thead>
            <tbody>
              {[...proceso]
                .sort((a, b) => a.orden - b.orden)
                .map((op) => (
                  <tr key={op.id} className="border-b border-border/50">
                    <td className="px-3 py-3 font-semibold">{op.orden}</td>
                    <td className="px-3 py-3">{op.nombre}</td>
                    <td className="px-3 py-3 capitalize text-muted-foreground">{op.tipo}</td>
                    <td className="px-3 py-3">
                      <input
                        type="number"
                        min={1}
                        disabled={op.tipo === 'pasivo'}
                        className="field-input !py-2 !px-2 w-24 disabled:opacity-50"
                        value={op.duracionMin}
                        onChange={(e) => actualizarOperacion(op.id, { duracionMin: parseInt(e.target.value) || 0 })}
                      />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          <p className="px-3 py-2 text-xs text-muted-foreground">Las esperas pasivas de 30 min son obligatorias.</p>
        </section>
      )}

      {seccion === 'pausas' && (
        <section className="card p-4 space-y-3">
          <p className="text-sm text-muted-foreground">Las pausas bloquean al operario, no al tanque en espera pasiva.</p>
          {(parametros.pausas ?? []).map((p) => (
            <div key={p.id} className="grid grid-cols-2 md:grid-cols-4 gap-2 items-end border-b border-border/50 pb-3">
              <div>
                <label className="field-label">Nombre</label>
                <input className="field-input" value={p.nombre} onChange={(e) => actualizarPausa(p.id, { nombre: e.target.value })} />
              </div>
              <div>
                <label className="field-label">Inicio</label>
                <input type="time" className="field-input" value={p.inicio} onChange={(e) => actualizarPausa(p.id, { inicio: e.target.value })} />
              </div>
              <div>
                <label className="field-label">Duración (min)</label>
                <input type="number" className="field-input" value={p.duracionMin} onChange={(e) => actualizarPausa(p.id, { duracionMin: parseInt(e.target.value) || 0 })} />
              </div>
              <button type="button" className="btn btn-neutral text-xs" onClick={() => eliminarPausa(p.id)}>Eliminar</button>
            </div>
          ))}
          <button
            type="button"
            className="btn btn-ghost text-sm"
            onClick={() => agregarPausa({ nombre: 'Nueva pausa', inicio: '12:00', duracionMin: 10 })}
          >
            + Agregar pausa
          </button>
        </section>
      )}

      {seccion === 'motivos' && (
        <section className="card p-4">
          <div className="flex gap-2 mb-4">
            <input className="field-input flex-1" placeholder="Nuevo motivo" value={nuevoMotivo} onChange={(e) => setNuevoMotivo(e.target.value)} />
            <button type="button" className="btn btn-primary" onClick={() => { if (nuevoMotivo.trim()) { agregarMotivo(nuevoMotivo.trim()); setNuevoMotivo(''); } }}>
              Agregar
            </button>
          </div>
          <ul className="divide-y divide-border">
            {motivos.map((m) => (
              <li key={m.id} className="flex items-center justify-between py-2">
                <span>{m.nombre}</span>
                <button type="button" className="btn btn-neutral !py-1 !px-2 text-xs" onClick={() => eliminarMotivo(m.id)}>Eliminar</button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {seccion === 'parametros' && (
        <section className="card p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { key: 'umbralCargaBaja' as const, label: 'Umbral carga baja (%)' },
            { key: 'semaforoVerde' as const, label: 'Semáforo verde desde (%)' },
            { key: 'semaforoAmarillo' as const, label: 'Semáforo amarillo desde (%)' },
            { key: 'umbralSobrecarga' as const, label: 'Umbral sobrecarga (%)' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="field-label">{label}</label>
              <input
                type="number"
                className="field-input"
                value={parametros[key]}
                onChange={(e) => actualizarParametros({ [key]: parseInt(e.target.value) || 0 })}
              />
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
