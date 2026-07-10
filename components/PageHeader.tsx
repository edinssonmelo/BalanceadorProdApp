'use client';

import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PageHeader({
  titulo,
  subtitulo,
  back,
  right,
}: {
  titulo: string;
  subtitulo?: ReactNode;
  back?: boolean | string;
  right?: ReactNode;
}) {
  const router = useRouter();
  return (
    <header className="flex items-start gap-2 mb-4">
      {back != null && back !== false && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0 mt-0.5"
          aria-label="Volver"
          onClick={() => (typeof back === 'string' ? router.push(back) : router.back())}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}
      <div className="flex-1 min-w-0">
        <h1 className="page-title">{titulo}</h1>
        {subtitulo && <p className="text-xs text-muted-foreground mt-0.5">{subtitulo}</p>}
      </div>
      {right}
    </header>
  );
}
