import { Empleado } from "../empleados/type";

export type EstadoTarea = "PENDIENTE" | "EN_PROGRESO" | "COMPLETADA" | "CANCELADA";
export type PrioridadTarea = "BAJA" | "MEDIA" | "ALTA" | "URGENTE";

/* ---------- Tipos principales (modelo DB) ---------- */
/** Tarea (modelo según schema.prisma) */
export type Tarea = {
    id: string;
    titulo: string;
    fechaInicio: Date;
    fechaFin: Date | null;   // 👈 sin `?`
    todoDia: boolean;
    estado: EstadoTarea;
    prioridad: PrioridadTarea;
    createdAt: Date;
    updatedAt: Date;
    asignaciones?: TareaEmpleado[];
};

/** Registro intermedio TareaEmpleado */
export type TareaEmpleado = {
    tareaId: string;
    empleadoId: string;
    asignadoEn: Date;
    rol?: string | null;
    tarea?: Tarea;             // include opcional
    empleado?: Empleado;    // include opcional
};

