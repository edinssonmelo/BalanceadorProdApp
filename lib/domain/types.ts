// Modelo de dominio del Balanceador de Producción en Planta (MVP)

export type OperarioRol = 'operario' | 'auxiliar';

export interface Operario {
  id: string;
  nombre: string;
  rol: OperarioRol;
  eficiencia: number;
  cargaMaxima: number;
  activo: boolean;
}

export type EstadoTanque = 'disponible' | 'lleno' | 'limpieza' | 'fuera_servicio';

export interface Tanque {
  id: string;
  nombre: string;
  estado: EstadoTanque;
  activo: boolean;
}

export type TipoTiempo = 'manual' | 'pasivo' | 'cierre';

export interface OperacionEstandar {
  id: string;
  orden: number;
  nombre: string;
  tipo: TipoTiempo;
  requiereOperario: boolean;
  requiereTanque: boolean;
  duracionMin: number;
  /** Personas simultáneas requeridas (montaje = 2). Default 1. */
  operariosRequeridos?: number;
}

export interface MotivoRetraso {
  id: string;
  nombre: string;
}

export interface ProductoPlan {
  nombre: string;
  instruccionVisible: string;
}

export interface PausaOperario {
  id: string;
  nombre: string;
  inicio: string; // HH:mm absoluto del día
  duracionMin: number;
}

export type Prioridad = 'alta' | 'media' | 'baja';

export type EstadoOperacion =
  | 'pendiente'
  | 'programado'
  | 'proceso'
  | 'espera'
  | 'terminado'
  | 'retrasado'
  | 'bloqueado';

export interface TareaProgramada {
  id: string;
  tanqueId: string;
  operacionId: string;
  operacionNombre: string;
  tipo: TipoTiempo;
  /** Primer operario (compatibilidad). */
  operarioId: string | null;
  /** Todos los operarios asignados (montaje = 2). */
  operarioIds?: string[];
  loteIndex: number;
  productoNombre: string;
  productoInstruccion?: string;
  inicioMin: number;
  finMin: number;
  duracionMin: number;
  estado: EstadoOperacion;
  realInicioMin?: number | null;
  realFinMin?: number | null;
  motivoRetrasoId?: string | null;
  observacion?: string | null;
}

export interface CargaOperario {
  operarioId: string;
  minutosDisponibles: number;
  minutosAsignados: number;
  cargaPct: number;
  estadoCarga: 'adecuada' | 'baja' | 'sobrecarga';
}

export type NivelAlerta = 'info' | 'exito' | 'advertencia' | 'error';

export interface Alerta {
  id: string;
  nivel: NivelAlerta;
  mensaje: string;
}

export interface ResultadoProgramacion {
  tareas: TareaProgramada[];
  cargas: CargaOperario[];
  alertas: Alerta[];
  galonesPlaneados: number;
  tanquesPlaneados: number;
  finEstimadoMin: number;
  cargaPromedioPct: number;
  metaAlcanzable: boolean;
  /** Tanques físicos usados en el plan */
  tanquesUsados: string[];
  /** Operación que más limita el throughput */
  cuelloDeBotella?: string;
}

export type EstadoJornada = 'borrador' | 'aprobada' | 'cerrada';

export type EstadoCorteControl = 'pendiente' | 'ok' | 'atrasado';

export interface CorteControl {
  horaOffsetMin: number;
  estado: EstadoCorteControl;
  observacion?: string;
}

export interface Jornada {
  id: string;
  fecha: string;
  turno: string;
  horaInicio: string;
  horaFin: string;
  operariosIds: string[];
  tanquesIds: string[];
  tanquesBloqueadosIds: string[];
  metaTanques: number;
  galonesPorTanque: number;
  productos: ProductoPlan[];
  prioridad: Prioridad;
  estado: EstadoJornada;
  proceso: OperacionEstandar[];
  operariosSnapshot: Operario[];
  resultado: ResultadoProgramacion | null;
  observacionFinal?: string;
  /** Cortes horarios marcados por el supervisor (OK / Atrasado). */
  cortesControl?: CorteControl[];
  /** Tanques realmente fabricados al cierre (ingreso manual). */
  tanquesReales?: number;
  creadaEn: string;
  /** Reloj de simulación demo (minutos desde inicio de jornada) */
  simClockMin?: number;
}
