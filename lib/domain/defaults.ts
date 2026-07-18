import type {
  Operario,
  Tanque,
  OperacionEstandar,
  MotivoRetraso,
  PausaOperario,
  ProductoPlan,
} from './types';

let seq = 0;
export const genId = (prefix = 'id'): string => {
  seq += 1;
  return `${prefix}_${Date.now().toString(36)}_${seq.toString(36)}`;
};

/** Eficiencia 100% = tiempos estándar del proceso (como Excel de planta).
 *  Bajarla alarga cada tarea de ese operario y rompe el arranque simétrico. */
export const OPERARIOS_INICIALES: Operario[] = [
  { id: 'op_juan', nombre: 'Juan', rol: 'operario', eficiencia: 100, cargaMaxima: 95, activo: true },
  { id: 'op_camilo', nombre: 'Camilo', rol: 'auxiliar', eficiencia: 100, cargaMaxima: 90, activo: true },
  { id: 'op_pedro', nombre: 'Pedro', rol: 'operario', eficiencia: 100, cargaMaxima: 90, activo: true },
];

export const TANQUES_INICIALES: Tanque[] = [
  { id: 'T1', nombre: 'Tanque 1', estado: 'disponible', activo: true },
  { id: 'T2', nombre: 'Tanque 2', estado: 'disponible', activo: true },
  { id: 'T3', nombre: 'Tanque 3', estado: 'disponible', activo: true },
  { id: 'T4', nombre: 'Tanque 4', estado: 'disponible', activo: true },
  { id: 'T5', nombre: 'Tanque 5', estado: 'disponible', activo: true },
  { id: 'T6', nombre: 'Tanque 6', estado: 'disponible', activo: true },
];

export const PROCESO_INICIAL: OperacionEstandar[] = [
  { id: 'pesaje', orden: 1, nombre: 'Pesaje', tipo: 'manual', requiereOperario: true, requiereTanque: false, duracionMin: 5 },
  { id: 'montaje', orden: 2, nombre: 'Montaje del tanque', tipo: 'manual', requiereOperario: true, requiereTanque: true, duracionMin: 20, operariosRequeridos: 2 },
  { id: 'celulosa1', orden: 3, nombre: 'Primera celulosa', tipo: 'manual', requiereOperario: true, requiereTanque: true, duracionMin: 5 },
  { id: 'celulosa2', orden: 4, nombre: 'Segunda celulosa', tipo: 'manual', requiereOperario: true, requiereTanque: true, duracionMin: 5 },
  { id: 'espera2', orden: 5, nombre: 'Revólver (espera 30 min)', tipo: 'pasivo', requiereOperario: false, requiereTanque: true, duracionMin: 30 },
  { id: 'resina', orden: 6, nombre: 'Resina', tipo: 'manual', requiereOperario: true, requiereTanque: true, duracionMin: 5 },
  { id: 'finalizacion', orden: 7, nombre: 'Finalización', tipo: 'cierre', requiereOperario: true, requiereTanque: true, duracionMin: 5 },
];

export const MOTIVOS_INICIALES: MotivoRetraso[] = [
  { id: 'falta_insumo', nombre: 'Falta de insumo' },
  { id: 'tanque_no_disp', nombre: 'Tanque no disponible' },
  { id: 'error_prog', nombre: 'Error de programación' },
  { id: 'operario_ocupado', nombre: 'Operario ocupado' },
  { id: 'proceso_largo', nombre: 'Proceso tardó más' },
  { id: 'espera_empaque', nombre: 'Espera por empaque' },
  { id: 'novedad_personal', nombre: 'Novedad personal' },
  { id: 'otro', nombre: 'Otro' },
];

export const PRODUCTOS_INICIALES: ProductoPlan[] = [
  { nombre: 'Vinilo Azul', instruccionVisible: 'Agregar 2.5 kg azul, 1 kg dispersión' },
  { nombre: 'Vinilo Blanco', instruccionVisible: 'Agregar 3 kg blanco, 0.5 kg negro' },
];

export const PAUSAS_INICIALES: PausaOperario[] = [
  { id: 'desayuno', nombre: 'Desayuno', inicio: '10:05', duracionMin: 15 },
  { id: 'media_tarde', nombre: 'Media tarde', inicio: '15:00', duracionMin: 10 },
];

export const TURNOS = ['Mañana', 'Tarde', 'Noche'] as const;

export const PARAMETROS_INICIALES = {
  umbralSobrecarga: 100,
  umbralCargaBaja: 60,
  semaforoVerde: 95,
  semaforoAmarillo: 85,
  pausas: PAUSAS_INICIALES,
};

export type Parametros = typeof PARAMETROS_INICIALES;

/** Normaliza productos legacy (string[]) a ProductoPlan[] */
export function normalizarProductos(
  productos: ProductoPlan[] | string[] | undefined,
): ProductoPlan[] {
  if (!productos?.length) return [...PRODUCTOS_INICIALES];
  return productos.map((p) =>
    typeof p === 'string' ? { nombre: p, instruccionVisible: '' } : p,
  );
}
