export type Activo = {
    id?: string;
    codigoBarra: string;
    nombre: string;
    descripcion?: string;
    categoriaId: string;
    empleadoAsignadoId?: string;
    fechaAsignacion?: Date;
    fechaRegistro?: Date;
    estadoActualId?: string;
    activo?: boolean;
    // Relaciones
    categoria?: {
        id: string;
        nombre: string;
    };
    empleadoAsignado?: {
        id: string;
        nombre: string;
        apellido: string;
    };
    estadoActual?: {
        id: string;
        nombre: string;
    };
}

export interface ActivoCheckForm {
    activoId: string;
    estadoId: string;
    observaciones: string;
}

export interface EstadoActivo {
    id: string;
    nombre: string;
    descripcion: string;
} 