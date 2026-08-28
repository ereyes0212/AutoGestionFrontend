import { TipoMovimientoInsumo } from "../types";

export type TipoReporteInsumo = "GENERAL" | "FECHA" | "PRODUCTO";

export type ReporteFiltrosInsumo = {
  tipo: TipoReporteInsumo;
  insumoId?: string;
  desde?: string;
  hasta?: string;
};

/** Fila de movimiento tal como se muestra e imprime en el reporte */
export type ReporteMovimiento = {
  id: string;
  fechaLabel: string;
  insumoNombre: string;
  unidadNombre: string;
  tipo: TipoMovimientoInsumo;
  /** Siempre en unidades de consumo */
  cantidad: number;
  /** Empaques tecleados, cuando el movimiento se registró por empaque */
  cantidadEmpaque: number | null;
  /** "2 cajas (12 unidades)" */
  cantidadLabel: string;
  stockResultante: number;
  solicitadoPor: string;
  registradoPor: string;
  observaciones: string;
  firmado: boolean;
  firmaFechaLabel: string | null;
};

/** Resumen de existencias y movimientos por insumo */
export type ReporteDetalleInsumo = {
  insumoId: string;
  nombre: string;
  unidadNombre: string;
  /** "1 caja = 6 unidades" */
  contenidoLabel: string | null;
  /** "2 cajas y 3 unidades" */
  equivalenciaStock: string | null;
  stockActual: number;
  stockMinimo: number;
  bajoStock: boolean;
  activo: boolean;
  entradas: number;
  salidas: number;
};

export type ReporteInsumos = {
  tipo: TipoReporteInsumo;
  titulo: string;
  periodoLabel: string;
  insumoNombre: string | null;
  generadoEl: string;
  generadoPor: string;
  resumen: {
    totalInsumos: number;
    insumosBajoStock: number;
    totalMovimientos: number;
    totalEntradas: number;
    totalSalidas: number;
    salidasSinFirma: number;
  };
  detalle: ReporteDetalleInsumo[];
  movimientos: ReporteMovimiento[];
};

export type ReporteResultado =
  | { success: true; data: ReporteInsumos }
  | { success: false; error: string };
