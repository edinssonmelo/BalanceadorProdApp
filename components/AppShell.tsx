'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import {
  BarChart3,
  CalendarDays,
  Gauge,
  History,
  Home,
  Settings,
  Factory,
} from 'lucide-react';
import { useStore } from '@/lib/store/useStore';
import { formatFechaLarga, todayISO } from '@/lib/domain/time';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/', label: 'Inicio', Icon: Home, match: (p: string) => p === '/' },
  { href: '/plan', label: 'Plan', Icon: CalendarDays, match: (p: string) => p.startsWith('/plan') },
  { href: '/tablero', label: 'Tablero', Icon: BarChart3, match: (p: string) => p.includes('tablero') },
  { href: '/indicadores', label: 'KPIs', Icon: Gauge, match: (p: string) => p.includes('indicadores') },
  { href: '/historico', label: 'Histórico', Icon: History, match: (p: string) => p === '/historico' },
];

function estadoBadge(estado?: string) {
  if (!estado) return { label: 'Sin plan', variant: 'muted' as const };
  if (estado === 'borrador') return { label: 'En revisión', variant: 'warning' as const };
  if (estado === 'aprobada') return { label: 'Activo', variant: 'success' as const };
  return { label: 'Cerrado', variant: 'muted' as const };
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const jornadaActivaId = useStore((s) => s.jornadaActivaId);
  const jornadas = useStore((s) => s.jornadas);
  const activa = jornadas.find((j) => j.id === jornadaActivaId);
  const [hora, setHora] = useState('');

  const fullscreen = pathname.startsWith('/operario/');

  useEffect(() => {
    const tick = () =>
      setHora(new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }));
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);

  if (fullscreen) {
    return <div className="min-h-full bg-background">{children}</div>;
  }

  const estado = estadoBadge(activa?.estado);
  const configActive =
    pathname.startsWith('/configuracion') || pathname.startsWith('/operarios') || pathname.startsWith('/tanques');

  return (
    <div className="min-h-full flex flex-col bg-background">
      <header className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3 px-4 h-12">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground shrink-0">
              <Factory className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-none truncate">Balanceador</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Producción</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant={estado.variant} className="hidden sm:inline-flex">
              {estado.label}
            </Badge>
            <div className="text-right">
              <p className="text-xs font-medium tabular-nums leading-none">{hora}</p>
              <p className="text-[10px] text-muted-foreground capitalize mt-0.5 hidden sm:block">
                {formatFechaLarga(todayISO()).split(',')[0]}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 pb-[4.25rem] max-w-4xl w-full mx-auto px-4 py-4">{children}</main>

      <nav className="fixed bottom-0 inset-x-0 z-40 border-t bg-card/95 backdrop-blur-sm pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-4xl mx-auto flex items-stretch h-14 px-1">
          {NAV.map(({ href, label, Icon, match }) => {
            const active = match(pathname);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors',
                  active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className={cn('h-4 w-4', active && 'stroke-[2.5]')} strokeWidth={active ? 2.5 : 2} />
                {label}
              </Link>
            );
          })}
          <Link
            href="/configuracion"
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors',
              configActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Settings className={cn('h-4 w-4', configActive && 'stroke-[2.5]')} strokeWidth={configActive ? 2.5 : 2} />
            Config
          </Link>
        </div>
      </nav>
    </div>
  );
}
