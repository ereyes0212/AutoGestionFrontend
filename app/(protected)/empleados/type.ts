export type Empleado = {
    id?: string;
    nombre: string;
    apellido: string;
    edad: number;
    genero: string;
    correo: string;
    activo?: boolean;
    usuario?: string | null;
    puesto_id: string;
    empresa_id: string;
    jefe_id?: string;
    jefe?:       string;
    puesto?:     string;
    empresa?:    string;
  };
  