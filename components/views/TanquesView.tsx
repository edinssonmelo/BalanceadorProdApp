'use client';

import { useStore } from '@/lib/store/useStore';
import { PageHeader } from '@/components/PageHeader';
import { tanqueEstilo } from '@/components/ui';
import type { EstadoTanque } from '@/lib/domain/types';

const ESTADOS: { valor: EstadoTanque; label: string }[] = [
  { valor: 'disponible', label: 'Disponible' },
  { valor: 'lleno', label: 'Lleno' },
  { valor: 'limpieza', label: 'En limpieza' },
  { valor: 'fuera_servicio', label: 'Fuera de servicio' },
];

export function TanquesView() {
  const tanques = useStore((s) => s.tanques);
  const setEstadoTanque = useStore((s) => s.setEstadoTanque);

  return (
    <div className="space-y-4">
      <PageHeader titulo="Estado de tanques" subtitulo="Define qué tanques se pueden usar" back="/configuracion" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {tanques.map((t) => {
          const st = tanqueEstilo(t.estado);
          return (
            <div key={t.id} className={`rounded-lg border p-3 ${st.bg} ${st.border}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-base">{t.nombre}</span>
                <span className={`text-xs font-mono font-semibold uppercase ${st.text}`}>{st.label}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {ESTADOS.map((e) => (
                  <button
                    key={e.valor}
                    type="button"
                    onClick={() => setEstadoTanque(t.id, e.valor)}
                    className={`btn !py-2 text-xs ${t.estado === e.valor ? 'btn-primary' : 'btn-neutral'}`}
                  >
                    {e.label}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
