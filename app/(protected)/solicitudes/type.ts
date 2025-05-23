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
  
  export type SolicitudPermiso = {
    id: string;
    empleadoId: string;
    nombreEmpleado: string;
    puestoId: string;
    puesto: string;
    fechaSolicitud: string;
    fechaInicio: string;
    fechaFin: string;
    diasSolicitados: number;
    aprobado: boolean | null;
    descripcion: string;
    aprobaciones: Aprobacion[];
  };

  export type SolicitudAprobacion = {
    id:              string;
    idSolicitud:     string;
    nivel:           number;
    aprobado:        null;
    comentario:      null;
    fechaAprobacion: null;
    empleadoId:      string;
    nombreEmpleado:  string;
    puestoId:        string;
    puesto:          string;
    fechaSolicitud:  string;
    fechaInicio:     string;
    fechaFin:        string;
    diasSolicitados: number;
    descripcion:     string;
}

  