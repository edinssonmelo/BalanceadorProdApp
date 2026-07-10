import type { TareaProgramada } from './types';

/** Operarios asignados a una tarea (montaje puede tener 2). */
export function tareaOperarios(t: TareaProgramada): string[] {
  if (t.operarioIds?.length) return t.operarioIds;
  return t.operarioId ? [t.operarioId] : [];
}

export function tareaAsignadaA(t: TareaProgramada, operarioId: string): boolean {
  return tareaOperarios(t).includes(operarioId);
}
