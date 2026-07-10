'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const TABS = [
  { seg: '', label: 'Resumen' },
  { seg: 'programacion', label: 'Programación' },
  { seg: 'tanque', label: 'Tanque' },
  { seg: 'operario', label: 'Operario' },
  { seg: 'registro', label: 'Registro' },
];

export function PlanTabs({ id }: { id: string }) {
  const pathname = usePathname();
  const base = `/plan/${id}`;

  return (
    <div className="flex h-9 items-center gap-0.5 rounded-lg bg-muted p-1 mb-3 overflow-x-auto">
      {TABS.map((t) => {
        const href = t.seg ? `${base}/${t.seg}` : base;
        const isActive =
          t.seg === ''
            ? pathname === base || pathname === `${base}/`
            : pathname.endsWith(`/${t.seg}`);
        return (
          <Link
            key={t.seg || 'resumen'}
            href={href}
            className={cn(
              'flex-1 min-w-0 text-center px-2 py-1 rounded-md text-[11px] font-medium transition-all whitespace-nowrap',
              isActive
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
