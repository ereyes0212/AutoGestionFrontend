export type Nota = {
  id?: string;
  creadorEmpleadoId: string;
  asignadoEmpleadoId?: string | null;
  aprobadorEmpleadoId?: string | null;
  estado: 'PENDIENTE' | 'APROBADA' | 'FINALIZADA' | 'RECHAZADA' | 'REVISION';
  titulo: string;
  fellback?: string | null;
  createAt?: Date;
  updateAt?: Date;

  // Nuevas propiedades solo de tipo string
  empleadoCreador?: string;
  empleadoAsignado?: string | null;
  empleadoAprobador?: string | null;
};
