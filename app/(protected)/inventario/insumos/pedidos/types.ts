export type EstadoPedidoInsumo = "PENDIENTE" | "RECIBIDO" | "CANCELADO";

export type PedidoDetalle = {
  id: string;
  insumoId: string;
  insumoNombre: string;
  unidadNombre: string;
  unidadEmpaqueNombre: string | null;
  cantidadPorEmpaque: number;
  /** Solicitado, en unidades de consumo */
  cantidad: number;
  /** Empaques solicitados, cuando se pidió por caja */
  cantidadEmpaque: number | null;
  /** "2 cajas (12 unidades)" */
  cantidadLabel: string;
  /** Recibido, en unidades de consumo */
  cantidadRecibida: number | null;
  cantidadRecibidaLabel: string | null;
  observacion: string;
  /** Existencias de la ciudad del pedido al momento de consultar */
  stockActual: number;
  stockMinimo: number;

  /** Pedido anterior de este insumo en la misma ciudad */
  pedidoAnteriorNumero: number | null;
  pedidoAnteriorFechaLabel: string | null;
  /** Días que duró la compra anterior: de su llegada a este pedido */
  diasDesdePedidoAnterior: number | null;
};

export type PedidoInsumo = {
  id: string;
  numero: number;
  ciudadId: string;
  ciudadNombre: string;
  estado: EstadoPedidoInsumo;
  solicitadoPor: string;
  fechaSolicitud: string;
  fechaSolicitudLabel: string;
  recibidoPor: string | null;
  fechaRecepcionLabel: string | null;
  observaciones: string;
  motivoCancelacion: string;
  totalLineas: number;
  detalles: PedidoDetalle[];
};

export type CrearPedidoDetalleInput = {
  insumoId: string;
  /** Cantidad tecleada: empaques si enEmpaques es true */
  cantidad: number;
  enEmpaques: boolean;
  observacion?: string;
};

export type CrearPedidoInput = {
  ciudadId: string;
  observaciones?: string;
  detalles: CrearPedidoDetalleInput[];
};

export type RecibirPedidoInput = {
  pedidoId: string;
  /** Cantidad realmente recibida, en la misma unidad en que se pidió la línea */
  recepciones: { detalleId: string; cantidad: number }[];
};

export type PedidoResultado = {
  success: boolean;
  error?: string;
  pedidoId?: string;
  numero?: number;
};

/** Insumo por debajo del mínimo, para proponerlo en un pedido nuevo */
export type SugerenciaPedido = {
  insumoId: string;
  nombre: string;
  unidadNombre: string;
  unidadEmpaqueNombre: string | null;
  cantidadPorEmpaque: number;
  stockActual: number;
  stockMinimo: number;
  /** Cuánto falta para llegar al mínimo, en unidades de consumo */
  faltante: number;
};
