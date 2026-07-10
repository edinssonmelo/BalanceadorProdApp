/** Colores corporativos Kolorflex (extraídos del logo: K azul, F rojo). */
export const KOLORFLEX = {
  kBlue: '#001088',
  fRed: '#F03038',
  kBlueLight: '#D6E3F8',
  kBlueSoft: '#E8EEF8',
  fRedLight: '#FAD4D6',
  fRedSoft: '#FCE8EA',
  fRedMuted: '#F5B8BC',
  textDark: '#1A1A1A',
  white: '#FFFFFF',
} as const;

/** Paleta por tanque: alterna tonos K (azul) y F (rojo). */
export const COLORES_TANQUE_KOLORFLEX: Record<string, string> = {
  T1: KOLORFLEX.kBlueLight,
  T2: KOLORFLEX.fRedLight,
  T3: KOLORFLEX.kBlueSoft,
  T4: KOLORFLEX.fRedSoft,
  T5: '#C5D4EF',
  T6: KOLORFLEX.fRedMuted,
};

export function colorTanque(tanqueId: string): string {
  return COLORES_TANQUE_KOLORFLEX[tanqueId] ?? '#EEEEEE';
}
