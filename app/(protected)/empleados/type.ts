export type Empleado = {
    id?: string;
    nombre: string;
    apellido: string;
    correo: string;
    fechaNacimiento: Date;
    vacaciones?: number;
    genero: string;
    activo?: boolean;
    usuario?: string | null;
    puesto_id: string;
    jefe_id?: string;
    jefe?:       string;
    puesto?:     string;
    empresas?:   Empresa[];
}

export type Empresa = {
    id:     string;
    nombre: string;
}
  