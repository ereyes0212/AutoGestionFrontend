export type FacturaArchivo = {
  id: string;
  archivoUrl: string;
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
  totalFacturas: number;
  archivos: FacturaArchivo[];
  createAt: string;
};

export type EventoFacturaFormInput = {
  titulo: string;
  descripcion?: string;
  fechaEvento: string;
  notaId?: string;
  files: {
    fileBase64: string;
    fileName: string;
    fileType: string;
  }[];
};
