export type Usuario = {
    id?: string;
    usuario: string;
    contrasena: string;
    rol?: string;
    rol_id: string;
    empleado?: string;
    empleado_id: string;
    activo: boolean;
}

export type UsuarioCreate = Omit<Usuario, "id" | "activo"> & {
    contrasena: string;
};

// UsuarioUpdate: Para actualizar un usuario existente (requiere 'id' y 'activo')
export type UsuarioUpdate = Required<Usuario> & { usuario: string };  