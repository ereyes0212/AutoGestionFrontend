


export type Cliente = {
  id?: string;
  nombre: string;
  correo: string;
  telefono: string;
  genero: string;
  activo: boolean;
};

export type Permiso = {
  id?: string;
  nombre: string;
  descripcion: string;
  activo: boolean;
};

export type Empleado = {
  id?: string;
  nombre: string;
  apellido: string;
  edad: number;
  genero: string;
  correo: string;
  activo?: boolean;
  usuario?: string | null;
  puesto:   string;
  empresa:   string;
  jefe?:     string;
};


export type Rol = {
  id?: string;
  nombre: string;
  descripcion: string;
  activo?: boolean;
  permisos: PermisosRol[];
};

export type PermisosRol = {
  id: string;
  nombre: string;
};

export type Usuario = {
  id?: string;
  usuario: string;
  empleadoNombre: string;
  roleNombre: string;
  activo: boolean;
};

// UsuarioBase: Campos comunes para ambos casos (creación y actualización)
// UsuarioBase: Contiene todos los campos comunes para un usuario
export type UsuarioBase = {
  usuario: string; // Asegúrate de que este campo esté definido como 'usuario' si así lo estás usando
  contrasena?: string; // Es opcional, solo para actualización o si se necesita cambiar
  empleado_id: string;
  role_id: string;
  id?: string; // Solo para actualización
  activo?: boolean; // Solo para actualización
};

// UsuarioCreate: Para la creación de un nuevo usuario
export type UsuarioCreate = Omit<UsuarioBase, "id" | "activo"> & {
  contrasena: string;
};

// UsuarioUpdate: Para actualizar un usuario existente (requiere 'id' y 'activo')
export type UsuarioUpdate = Required<UsuarioBase> & { usuario: string };

export interface ValidationError {
  type: string;  // Usualmente una URL que describe el tipo de error
  title: string;  // Título del error
  status: number;  // Código de estado HTTP (por ejemplo, 400)
  errors: Record<string, string[]>;  // Los errores de validación (campos con sus respectivos mensajes)
  traceId: string;  // ID de rastreo para el seguimiento del error
}

export type Empresa = {
  id?:     string;
  nombre: string;
  activo?: boolean;
}








