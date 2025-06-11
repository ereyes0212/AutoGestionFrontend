export type Aprobacion = {
  id: string;
  nivel: number;
  aprobado: boolean | null;
  comentario: string | null;
  fechaAprobacion: string | null;
  empleadoId: string | null;
  nombreEmpleado: string | null;
  puestoId: string | null;
  fechaSolicitud: string | null;
  fechaInicio: string | null;
  fechaFin: string | null;
  diasSolicitados: number;
  descripcion: string | null;
};

export interface SolicitudPermiso {
  id: string;
  empleadoId: string;
  nombreEmpleado: string;
  puestoId: string;
  puesto: string;
  fechaSolicitud: string;
  fechaInicio: string;
  fechaFin: string;
  fechaPresentacion?: string;
  diasSolicitados: number;
  aprobado: boolean | null;
  descripcion: string;
  aprobaciones: Aprobacion[];
  diasGozados?: number;
  diasRestantes?: number;
  periodo?: string;
}

export type SolicitudAprobacion = {
  id: string;
  idSolicitud: string;
  nivel: number;
  aprobado: string;
  comentario: null | string;
  fechaAprobacion: string;
  empleadoId: string;
  nombreEmpleado: string;
  puestoId: string;
  puesto: string;
  fechaSolicitud: string;
  fechaInicio: string;
  fechaFin: string;
  diasSolicitados: number;
  descripcion: string;
}

export type SolicitudCreateInput = {
  id?: string;           // opcional: si el frontend no lo proporciona, se genera con randomUUID()
  fechaInicio: string;   // ISO string ("2025-06-10"), se convertirá a Date en el servidor
  fechaFin: string;      // ISO string
  descripcion: string;
}

