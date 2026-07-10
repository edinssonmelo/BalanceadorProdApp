'use client';

import type { ReactNode } from 'react';
import type { EstadoOperacion, EstadoTanque } from '@/lib/domain/types';
import { Badge } from '@/components/ui/badge';
import { Card as ShadCard, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const ESTADO_VARIANT: Record<EstadoOperacion, 'muted' | 'secondary' | 'warning' | 'success' | 'destructive'> = {
  pendiente: 'muted',
  programado: 'secondary',
  proceso: 'warning',
  espera: 'secondary',
  terminado: 'success',
  retrasado: 'destructive',
  bloqueado: 'muted',
};

const ESTADO_LABEL: Record<EstadoOperacion, string> = {
  pendiente: 'Pendiente',
  programado: 'Programado',
  proceso: 'En proceso',
  espera: 'En espera',
  terminado: 'Terminado',
  retrasado: 'Retrasado',
  bloqueado: 'Bloqueado',
};

export function EstadoBadge({ estado }: { estado: EstadoOperacion }) {
  return <Badge variant={ESTADO_VARIANT[estado]}>{ESTADO_LABEL[estado]}</Badge>;
}

const TANQUE_STYLES: Record<EstadoTanque, { bg: string; border: string; text: string; label: string }> = {
  disponible: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', label: 'Disponible' },
  lleno: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', label: 'Lleno' },
  limpieza: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', label: 'En limpieza' },
  fuera_servicio: { bg: 'bg-muted', border: 'border-border', text: 'text-muted-foreground', label: 'Fuera de servicio' },
};

export function tanqueEstilo(estado: EstadoTanque) {
  return TANQUE_STYLES[estado];
}

export function Card({
  children,
  className = '',
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn('card p-4', onClick && 'cursor-pointer hover:border-foreground/20 transition-colors', className)}
    >
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  tone = 'default',
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: 'default' | 'success' | 'warning' | 'danger';
}) {
  const toneCls =
    tone === 'success'
      ? 'text-emerald-600'
      : tone === 'warning'
        ? 'text-amber-600'
        : tone === 'danger'
          ? 'text-red-600'
          : 'text-foreground';
  return (
    <ShadCard>
      <CardContent className="p-3 flex flex-col justify-between min-h-[72px]">
        <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
        <span className={cn('text-xl font-semibold tabular-nums leading-tight mt-1', toneCls)}>{value}</span>
        {sub != null && <span className="text-[11px] text-muted-foreground mt-0.5">{sub}</span>}
      </CardContent>
    </ShadCard>
  );
}

export function ProgressBar({ pct, tone }: { pct: number; tone?: 'success' | 'warning' | 'danger' }) {
  const clamped = Math.max(0, Math.min(100, pct));
  const color =
    tone === 'danger'
      ? 'bg-red-500'
      : tone === 'warning'
        ? 'bg-amber-500'
        : tone === 'success'
          ? 'bg-emerald-500'
          : clamped >= 95
            ? 'bg-emerald-500'
            : clamped >= 85
              ? 'bg-amber-500'
              : 'bg-red-500';
  return (
    <div className="w-full h-1 rounded-full bg-muted overflow-hidden">
      <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${clamped}%` }} />
    </div>
  );
}

const ALERTA_STYLES = {
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  exito: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  advertencia: 'bg-amber-50 border-amber-200 text-amber-800',
  error: 'bg-red-50 border-red-200 text-red-800',
};

export function AlertaItem({
  nivel,
  children,
  titulo,
}: {
  nivel: keyof typeof ALERTA_STYLES;
  children: ReactNode;
  titulo?: string;
}) {
  return (
    <div className={cn('rounded-md border px-3 py-2.5 text-xs', ALERTA_STYLES[nivel])}>
      {titulo && <p className="font-semibold mb-0.5">{titulo}</p>}
      <p className="leading-relaxed opacity-90">{children}</p>
    </div>
  );
}

export function EmptyState({
  titulo,
  mensaje,
  accion,
}: {
  titulo: string;
  mensaje?: string;
  accion?: ReactNode;
}) {
  return (
    <ShadCard>
      <CardContent className="p-8 text-center flex flex-col items-center gap-2">
        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground mb-1">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="4" y="5" width="16" height="15" rx="2" />
            <path d="M8 3v4M16 3v4M4 10h16" />
          </svg>
        </div>
        <h3 className="text-sm font-semibold">{titulo}</h3>
        {mensaje && <p className="max-w-sm text-xs text-muted-foreground leading-relaxed">{mensaje}</p>}
        {accion}
      </CardContent>
    </ShadCard>
  );
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <h2 className="text-sm font-semibold">{children}</h2>
      {right}
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={cn(
        'relative inline-flex h-6 w-10 items-center rounded-full transition-colors',
        checked ? 'bg-emerald-600' : 'bg-muted border border-input',
      )}
      aria-pressed={checked}
      aria-label={label}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-5' : 'translate-x-1',
        )}
      />
    </button>
  );
}

export function GaugeTanque({ pct, label, color }: { pct: number; label: string; color: string }) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div className="w-full h-12 bg-muted rounded-md relative overflow-hidden border border-border">
      <div className="absolute top-1 left-0 right-0 text-center text-[10px] text-muted-foreground z-10 truncate px-2">{label}</div>
      <div
        className="absolute left-0 right-0 bottom-0 transition-all duration-500"
        style={{ height: `${clamped}%`, background: color, opacity: 0.85 }}
      />
    </div>
  );
}

export function PasoFlujo({ pasos, actual }: { pasos: string[]; actual: number }) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1 mb-3">
      {pasos.map((p, i) => (
        <div key={p} className="flex items-center gap-1 shrink-0">
          <span
            className={cn(
              'text-[10px] font-medium px-2 py-0.5 rounded-full border',
              i === actual
                ? 'bg-primary text-primary-foreground border-primary'
                : i < actual
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-muted text-muted-foreground border-transparent',
            )}
          >
            {i + 1}. {p}
          </span>
          {i < pasos.length - 1 && <span className="text-muted-foreground text-[10px]">/</span>}
        </div>
      ))}
    </div>
  );
}
