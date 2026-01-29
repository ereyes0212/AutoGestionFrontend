export interface Company {
  id: string;
  nombre: string;
}

export interface Employee {
  id: string;
  numeroIdentificacion: string;

  nombre: string;
  apellido: string;
  correo: string;

  fechaNacimiento: Date;
  fechaIngreso: Date;

  departamentoDomicilio: string;
  ciudadDomicilio: string;
  colonia: string;
  telefono: string;
  profesion: string;

  vacaciones: number;
  genero: string;
  activo: boolean;

  usuario_id: string;
  usuario: string;

  puesto_id: string;
  puesto: string;

  jefe_id: string | null;
  jefe: string;

  firma: string | null;

  createAt: Date;
  updateAt: Date;
}
