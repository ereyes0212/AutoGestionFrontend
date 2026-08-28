export type TipoMovimientoInsumo = "ENTRADA" | "SALIDA";

export type Insumo = {
  id?: string;
  nombre: string;
  descripcion: string;
  /** Unidad de consumo: en esta unidad vive el stock */
  unidadId: string;
  /** Unidad de compra (caja, fardo). null si el insumo no se compra por empaque */
  unidadEmpaqueId: string | null;
  /** Unidades de consumo que trae cada empaque */
  cantidadPorEmpaque: number;
  stockActual: number;
  stockMinimo: number;
  activo?: boolean;
  unidadNombre?: string;
  unidadAbreviatura?: string;
  unidadEmpaqueNombre?: string | null;
  bajoStock?: boolean;
  /** "1 caja = 6 unidades" */
  contenidoLabel?: string | null;
  /** "2 cajas y 3 unidades" */
  equivalenciaStock?: string | null;
};

export type MovimientoInsumo = {
  id: string;
  insumoId: string;
  insumoNombre: string;
  unidadNombre: string;
  unidadEmpaqueNombre: string | null;
  tipo: TipoMovimientoInsumo;
  /** Siempre en unidades de consumo */
  cantidad: number;
  /** Empaques tecleados, cuando el movimiento se registró por empaque */
  cantidadEmpaque: number | null;
  /** "2 cajas (12 unidades)" */
  cantidadLabel: string;
  stockResultante: number;
  fecha: string;
  fechaLabel: string;
  observaciones: string;
  /** Usuario que registró el movimiento */
  registradoPor: string;
  empleadoSolicitanteId: string | null;
  /** Empleado que solicitó el insumo */
  solicitadoPor: string;
  firmado: boolean;
  firmaFechaLabel: string | null;
  /** Enlace público de firma, solo mientras la firma siga pendiente */
  firmaUrl: string | null;
};

export type RegistrarMovimientoInput = {
  insumoId: string;
  tipo: TipoMovimientoInsumo;
  /** Cantidad tecleada: empaques si enEmpaques es true, unidades de consumo si no */
  cantidad: number;
  enEmpaques?: boolean;
  empleadoSolicitanteId?: string;
  observaciones?: string;
};

export type RegistrarMovimientoResultado = {
  success: boolean;
  error?: string;
  movimientoId?: string;
  firmaUrl?: string | null;
  stockResultante?: number;
};

/** Datos que se muestran en la pantalla pública de firma */
export type MovimientoParaFirma = {
  id: string;
  insumoNombre: string;
  unidadNombre: string;
  cantidad: number;
  cantidadLabel: string;
  tipo: TipoMovimientoInsumo;
  fechaLabel: string;
  solicitadoPor: string;
  registradoPor: string;
  observaciones: string;
  estado: "PENDIENTE" | "FIRMADO" | "EXPIRADO" | "NO_ENCONTRADO";
};
