'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store/useStore';
import { PageHeader } from '@/components/PageHeader';
import { Toggle } from '@/components/ui';
import type { Operario, OperarioRol } from '@/lib/domain/types';

const VACIO: Omit<Operario, 'id'> = {
  nombre: '',
  rol: 'operario',
  eficiencia: 100,
  cargaMaxima: 90,
  activo: true,
};

export function OperariosView() {
  const operarios = useStore((s) => s.operarios);
  const crearOperario = useStore((s) => s.crearOperario);
  const actualizarOperario = useStore((s) => s.actualizarOperario);
  const toggleOperario = useStore((s) => s.toggleOperario);
  const eliminarOperario = useStore((s) => s.eliminarOperario);
  const [nuevo, setNuevo] = useState<Omit<Operario, 'id'>>(VACIO);

  return (
    <div className="space-y-4">
      <PageHeader titulo="Operarios" subtitulo="Eficiencia y carga máxima" back="/configuracion" />

      <section className="card p-4">
        <h2 className="text-sm font-semibold mb-3">Agregar operario</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
          <div className="col-span-2 md:col-span-1">
            <label className="field-label">Nombre</label>
            <input className="field-input" value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} />
          </div>
          <div>
            <label className="field-label">Rol</label>
            <select className="field-input" value={nuevo.rol} onChange={(e) => setNuevo({ ...nuevo, rol: e.target.value as OperarioRol })}>
              <option value="operario">Operario</option>
              <option value="auxiliar">Auxiliar</option>
            </select>
          </div>
          <div>
            <label className="field-label">Eficiencia %</label>
            <input type="number" className="field-input" value={nuevo.eficiencia} onChange={(e) => setNuevo({ ...nuevo, eficiencia: parseInt(e.target.value) || 0 })} />
          </div>
          <div>
            <label className="field-label">Carga máx. %</label>
            <input type="number" className="field-input" value={nuevo.cargaMaxima} onChange={(e) => setNuevo({ ...nuevo, cargaMaxima: parseInt(e.target.value) || 0 })} />
          </div>
          <button type="button" className="btn btn-primary" onClick={() => { if (nuevo.nombre.trim()) { crearOperario(nuevo); setNuevo(VACIO); } }}>
            Agregar
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {operarios.map((o) => (
          <div key={o.id} className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <input
                className="text-base font-semibold bg-transparent border-b border-transparent focus:border-border focus:outline-none"
                value={o.nombre}
                onChange={(e) => actualizarOperario(o.id, { nombre: e.target.value })}
              />
              <Toggle checked={o.activo} onChange={() => toggleOperario(o.id)} label="Activo" />
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <label className="field-label !text-[10px]">Rol</label>
                <select className="field-input !py-2 !px-2 text-xs" value={o.rol} onChange={(e) => actualizarOperario(o.id, { rol: e.target.value as OperarioRol })}>
                  <option value="operario">Operario</option>
                  <option value="auxiliar">Auxiliar</option>
                </select>
              </div>
              <div>
                <label className="field-label !text-[10px]">Efic. %</label>
                <input type="number" className="field-input !py-2 !px-2 text-xs" value={o.eficiencia} onChange={(e) => actualizarOperario(o.id, { eficiencia: parseInt(e.target.value) || 0 })} />
              </div>
              <div>
                <label className="field-label !text-[10px]">Carga %</label>
                <input type="number" className="field-input !py-2 !px-2 text-xs" value={o.cargaMaxima} onChange={(e) => actualizarOperario(o.id, { cargaMaxima: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
            <button type="button" className="btn btn-neutral !py-1.5 text-xs mt-3 w-full" onClick={() => { if (confirm(`¿Eliminar a ${o.nombre}?`)) eliminarOperario(o.id); }}>
              Eliminar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
