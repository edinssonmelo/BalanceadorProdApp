'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store/useStore';
import { PageHeader } from '@/components/PageHeader';
import { AlertaItem, tanqueEstilo, PasoFlujo } from '@/components/ui';
import { TURNOS, PRODUCTOS_INICIALES } from '@/lib/domain/defaults';
import { todayISO } from '@/lib/domain/time';
import type { EstadoTanque, Prioridad, ProductoPlan } from '@/lib/domain/types';

const ESTADOS_TANQUE: EstadoTanque[] = ['disponible', 'lleno', 'limpieza', 'fuera_servicio'];

export function CrearPlanView() {
  const router = useRouter();
  const operarios = useStore((s) => s.operarios);
  const tanques = useStore((s) => s.tanques);
  const setEstadoTanque = useStore((s) => s.setEstadoTanque);
  const crearJornada = useStore((s) => s.crearJornada);

  const [fecha, setFecha] = useState(todayISO());
  const [turno, setTurno] = useState<string>(TURNOS[0]);
  const [horaInicio, setHoraInicio] = useState('07:30');
  const [horaFin, setHoraFin] = useState('12:00');
  const [prioridad, setPrioridad] = useState<Prioridad>('media');
  const [metaTanques, setMetaTanques] = useState(5);
  const [galonesPorTanque, setGalonesPorTanque] = useState(200);
  const [productos, setProductos] = useState<ProductoPlan[]>([...PRODUCTOS_INICIALES]);

  const [selOperarios, setSelOperarios] = useState<string[]>(
    operarios.filter((o) => o.activo).slice(0, 2).map((o) => o.id),
  );

  const tanquesDisponibles = tanques.filter((t) => t.estado === 'disponible');
  const tanquesBloqueados = tanques.filter((t) => t.estado !== 'disponible');

  const errores = useMemo(() => {
    const e: string[] = [];
    if (selOperarios.length === 0) e.push('Selecciona al menos un operario.');
    if (tanquesDisponibles.length === 0) e.push('Debe haber al menos un tanque disponible.');
    if (horaFin <= horaInicio) e.push('La hora fin debe ser mayor a la hora inicio.');
    if (metaTanques <= 0) e.push('La meta debe ser mayor a cero.');
    if (galonesPorTanque <= 0) e.push('Los galones por tanque deben ser mayores a cero.');
    if (productos.every((p) => !p.nombre.trim())) e.push('Indica al menos un producto.');
    return e;
  }, [selOperarios, tanquesDisponibles, horaFin, horaInicio, metaTanques, galonesPorTanque, productos]);

  const toggleOperario = (id: string) =>
    setSelOperarios((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const cicloEstado = (id: string, actual: EstadoTanque) => {
    const idx = ESTADOS_TANQUE.indexOf(actual);
    setEstadoTanque(id, ESTADOS_TANQUE[(idx + 1) % ESTADOS_TANQUE.length]);
  };

  const actualizarProducto = (i: number, patch: Partial<ProductoPlan>) => {
    setProductos((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  };

  const agregarProducto = () => setProductos((prev) => [...prev, { nombre: '', instruccionVisible: '' }]);

  const calcular = () => {
    if (errores.length > 0) return;
    const id = crearJornada({
      fecha,
      turno,
      horaInicio,
      horaFin,
      operariosIds: selOperarios,
      tanquesIds: tanquesDisponibles.map((t) => t.id),
      tanquesBloqueadosIds: tanquesBloqueados.map((t) => t.id),
      metaTanques,
      galonesPorTanque,
      productos: productos.filter((p) => p.nombre.trim()),
      prioridad,
    });
    router.push(`/plan/${id}/programacion`);
  };

  return (
    <div className="space-y-4">
      <PageHeader titulo="Crear plan del día" back="/" subtitulo="Configura la producción del día" />
      <PasoFlujo pasos={['Datos', 'Recursos', 'Meta', 'Calcular']} actual={0} />

      <section className="card p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="field-label">Fecha</label>
          <input type="date" className="field-input" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </div>
        <div>
          <label className="field-label">Turno</label>
          <select className="field-input" value={turno} onChange={(e) => setTurno(e.target.value)}>
            {TURNOS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label">Hora inicio</label>
          <input type="time" className="field-input" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} />
        </div>
        <div>
          <label className="field-label">Hora fin</label>
          <input type="time" className="field-input" value={horaFin} onChange={(e) => setHoraFin(e.target.value)} />
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold">Operarios disponibles</h2>
          <span className="text-xs text-muted-foreground">{selOperarios.length} seleccionado(s)</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {operarios.map((o) => {
            const sel = selOperarios.includes(o.id);
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => toggleOperario(o.id)}
                className={`text-left rounded-lg border p-3 transition-all flex items-center gap-3 ${
                  sel ? 'border-primary bg-primary/5' : 'border-border bg-muted/50 hover:border-foreground/20'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-md flex items-center justify-center font-semibold text-sm ${
                    sel ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {o.nombre[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">{o.nombre}</p>
                  <p className="text-xs font-mono text-muted-foreground capitalize">
                    {o.rol} · Ef. {o.eficiencia}% · Máx {o.cargaMaxima}%
                  </p>
                </div>
                <div
                  className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                    sel ? 'bg-primary border-primary' : 'border-border'
                  }`}
                >
                  {sel && (
                    <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M4 12l5 5L20 6" />
                    </svg>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold mb-2">
          Estado inicial de tanques <span className="text-xs font-normal text-muted-foreground">(toca para cambiar)</span>
        </h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {tanques.map((t) => {
            const st = tanqueEstilo(t.estado);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => cicloEstado(t.id, t.estado)}
                className={`rounded-lg border p-2.5 text-center transition-all ${st.bg} ${st.border}`}
              >
                <p className="font-semibold text-sm">{t.nombre}</p>
                <p className={`text-[10px] font-mono font-semibold uppercase mt-1 ${st.text}`}>{st.label}</p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="card p-4 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="field-label">Meta (tanques)</label>
            <div className="flex items-center bg-muted border border-border rounded-md overflow-hidden">
              <button type="button" className="px-3 py-2.5 text-muted-foreground hover:text-foreground" onClick={() => setMetaTanques((m) => Math.max(1, m - 1))}>−</button>
              <input
                type="number"
                className="flex-1 text-center bg-transparent font-mono font-semibold outline-none min-w-0"
                value={metaTanques}
                onChange={(e) => setMetaTanques(parseInt(e.target.value) || 0)}
              />
              <button type="button" className="px-3 py-2.5 text-muted-foreground hover:text-foreground" onClick={() => setMetaTanques((m) => m + 1)}>+</button>
            </div>
          </div>
          <div>
            <label className="field-label">Galones / tanque</label>
            <input type="number" className="field-input" value={galonesPorTanque} onChange={(e) => setGalonesPorTanque(parseInt(e.target.value) || 0)} />
          </div>
          <div>
            <label className="field-label">Prioridad</label>
            <select className="field-input" value={prioridad} onChange={(e) => setPrioridad(e.target.value as Prioridad)}>
              <option value="alta">Alta</option>
              <option value="media">Media</option>
              <option value="baja">Baja</option>
            </select>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="field-label !mb-0">Productos / referencias</label>
            <button type="button" className="text-xs text-primary font-semibold" onClick={agregarProducto}>
              + Agregar
            </button>
          </div>
          <div className="space-y-3">
            {productos.map((p, i) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <input
                  className="field-input"
                  placeholder="Nombre del color"
                  value={p.nombre}
                  onChange={(e) => actualizarProducto(i, { nombre: e.target.value })}
                />
                <input
                  className="field-input"
                  placeholder="Instrucción visible para operario"
                  value={p.instruccionVisible}
                  onChange={(e) => actualizarProducto(i, { instruccionVisible: e.target.value })}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {errores.length > 0 && (
        <div className="space-y-2">
          {errores.map((e) => (
            <AlertaItem key={e} nivel="advertencia">
              {e}
            </AlertaItem>
          ))}
        </div>
      )}

      <button className="btn btn-primary btn-lg w-full" disabled={errores.length > 0} onClick={calcular}>
        Calcular programación automática
      </button>
    </div>
  );
}
