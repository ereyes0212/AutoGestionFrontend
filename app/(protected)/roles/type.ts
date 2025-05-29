
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



