"use server";

import { prisma } from "@/lib/prisma";
import { EstadoTarea, PrioridadTarea } from "./types";

// ✅ Crear nueva tarea con empleados asignados
export async function createTarea({
    titulo,
    fechaInicio,
    fechaFin,
    prioridad,
    empleados,
}: {
    titulo: string;
    fechaInicio: Date;
    fechaFin?: Date | null;
    prioridad: PrioridadTarea;
    empleados: string[]; // IDs de empleados asignados
}) {
    return await prisma.tarea.create({
        data: {
            titulo,
            fechaInicio,
            fechaFin,
            prioridad,
            asignaciones: {
                create: empleados.map((empId) => ({
                    empleadoId: empId,
                })),
            },
        },
        include: {
            asignaciones: {
                include: { empleado: true },
            },
        },
    });
}

// ✅ Obtener todas las tareas de un empleado
export async function getTareasByEmpleado(empleadoId: string) {
    return await prisma.tarea.findMany({
        where: {
            asignaciones: {
                some: { empleadoId },
            },
        },
        include: {
            asignaciones: {
                include: { empleado: true },
            },
        },
        orderBy: { fechaInicio: "asc" },
    });
}

export async function completeTarea(id: string) {
    return await prisma.tarea.update({
        where: { id },
        data: { estado: "COMPLETADA" },
    });
}

// ✅ Actualizar una tarea (incluye reasignar empleados)
export async function updateTarea({
    id,
    titulo,
    fechaInicio,
    fechaFin,
    prioridad,
    empleados,
}: {
    id: string;
    titulo?: string;
    fechaInicio?: Date;
    fechaFin?: Date | null;
    prioridad?: PrioridadTarea;
    empleados?: string[]; // si se manda, reasignamos
}) {
    return await prisma.tarea.update({
        where: { id },
        data: {
            ...(titulo && { titulo }),
            ...(fechaInicio && { fechaInicio }),
            ...(typeof fechaFin !== "undefined" && { fechaFin }),
            ...(prioridad && { prioridad }),

            ...(empleados && {
                asignaciones: {
                    deleteMany: {}, // borra todos los anteriores
                    create: empleados.map((empId) => ({
                        empleadoId: empId,
                    })),
                },
            }),
        },
        include: {
            asignaciones: {
                include: { empleado: true },
            },
        },
    });
}

// ✅ Cambiar estado de una tarea
export async function changeEstadoTarea(id: string, estado: EstadoTarea) {
    return await prisma.tarea.update({
        where: { id },
        data: { estado },
    });
}
