export type Nota = {
  id?: string;
  creadorEmpleadoId: string;
  asignadoEmpleadoId?: string | null;
  aprobadorEmpleadoId?: string | null;
  descripcion: string;
  esPrioridad?: boolean;
  esUltimaHora?: boolean;
  estado: 'PENDIENTE' | 'APROBADA' | 'FINALIZADA' | 'RECHAZADA';
  tipoRevision?: 'PUBLICAR_SIN_REVISION' | 'REVISA_EDITOR' | 'REVISA_JEFE' | null;
  titulo: string;
  fuente: string | null;
  fellback?: string | null;
  createAt?: Date;
  updateAt?: Date;

  // Nuevas propiedades solo de tipo string
  empleadoCreador?: string;
  empleadoAsignado?: string | null;
  empleadoAprobador?: string | null;
};
