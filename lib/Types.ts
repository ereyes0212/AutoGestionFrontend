


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



// UsuarioBase: Campos comunes para ambos casos (creación y actualización)
// UsuarioBase: Contiene todos los campos comunes para un usuario


// UsuarioCreate: Para la creación de un nuevo usuario


export interface ValidationError {
  type: string;  // Usualmente una URL que describe el tipo de error
  title: string;  // Título del error
  status: number;  // Código de estado HTTP (por ejemplo, 400)
  errors: Record<string, string[]>;  // Los errores de validación (campos con sus respectivos mensajes)
  traceId: string;  // ID de rastreo para el seguimiento del error
}









