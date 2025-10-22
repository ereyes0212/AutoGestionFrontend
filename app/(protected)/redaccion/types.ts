export type Nota = {
  id?: string;
  creadorEmpleadoId: string;
  asignadoEmpleadoId?: string | null;
  aprobadorEmpleadoId?: string | null;
  descripcion: string;
  esPrioridad?: boolean;
  estado: 'PENDIENTE' | 'APROBADA' | 'FINALIZADA' | 'RECHAZADA';
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
