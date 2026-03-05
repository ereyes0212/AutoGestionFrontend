export type FacturaArchivo = {
  id: string;
  archivoUrl: string;
  archivoKey: string;
  archivoNombre: string;
  archivoTipo: string;
};

export type EventoFactura = {
  id: string;
  empleadoId: string;
  empleadoNombre: string;
  notaId?: string | null;
  notaTitulo?: string | null;
  titulo: string;
  descripcion?: string | null;
  fechaEvento: string;
  fechaEventoLabel: string;
  totalFacturas: number;
  archivos: FacturaArchivo[];
  createAt: string;
};

export type FacturaFilePayload = {
  fileBase64: string;
  fileName: string;
  fileType: string;
};

export type EventoFacturaFormInput = {
  titulo: string;
  descripcion?: string;
  fechaEvento: string;
  notaId?: string;
  files: FacturaFilePayload[];
  replacements?: {
    archivoId: string;
    file: FacturaFilePayload;
  }[];
  deleteArchivoIds?: string[];
};
