"use server";


import { getSession, getSessionPermisos } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Nota } from "./types";

// Crear una nueva nota
export async function createNota({
    creadorEmpleadoId,
    titulo,
}: {
    creadorEmpleadoId: string;
    titulo: string;
}) {
    const permisos = await getSessionPermisos();

    const esJefe = permisos!.includes("cambiar_estado_notas");

    const nuevaNota = await prisma.nota.create({
        data: {
            titulo,
            estado: "PENDIENTE",
            creadorEmpleadoId,
            asignadoEmpleadoId: esJefe ? null : creadorEmpleadoId,
            aprobadorEmpleadoId: esJefe ? creadorEmpleadoId : null,
        },
    });

    return nuevaNota;
}

// Redactor toma nota
export async function tomarNota(id: string) {
    const session = await getSession();
    const nota = await prisma.nota.findUnique({ where: { id } });

    if (!nota) throw new Error("Nota no encontrada");
    if (nota.estado !== "PENDIENTE") throw new Error("La nota ya no está disponible");

    return prisma.nota.update({
        where: { id },
        data: {
            asignadoEmpleadoId: session?.IdEmpleado,
            estado: "APROBADA" // ✅ Cambia el estado automáticamente
        },
    });
}


// Aprobar nota (jefe)
export async function aprobarNota(id: string, estado: 'APROBADA' | 'RECHAZADA' | 'PENDIENTE' | 'FINALIZADA', fellback: string | null) {
    const permisos = await getSessionPermisos();
    const session = await getSession();

    if (!permisos!.includes("cambiar_estado_notas")) {
        throw new Error("No autorizado para aprobar notas");
    }

    return prisma.nota.update({
        where: { id },
        data: {
            estado: estado,
            aprobadorEmpleadoId: session?.IdEmpleado,
            fellback,
        },
    });
}

// Finalizar nota (redactor asignado)
export async function finalizarNota(id: string) {
    const session = await getSession();
    const nota = await prisma.nota.findUnique({ where: { id } });

    if (!nota) throw new Error("Nota no encontrada");
    if (nota.estado !== "APROBADA") throw new Error("La nota aún no está aprobada");
    if (nota.asignadoEmpleadoId !== session?.IdEmpleado) {
        throw new Error("No puedes finalizar una nota que no está asignada a ti");
    }

    return prisma.nota.update({
        where: { id },
        data: { estado: "FINALIZADA" },
    });
}

// Obtener todas las notas
export async function getNotas(): Promise<Nota[]> {
    try {
        const notas = await prisma.nota.findMany({
            orderBy: { createAt: "desc" },
            include: { creador: true, asignado: true, aprobador: true },
        });

        return notas.map((n) => ({
            ...n,
            empleadoCreador: n.creador?.nombre ?? "No asignado",
            empleadoAsignado: n.asignado?.nombre ?? "No asignado",
            empleadoAprobador: n.aprobador?.nombre ?? "No asignado",
        }));
    } catch (error) {
        console.error("Error al obtener notas:", error);
        throw new Error("No se pudieron obtener las notas");
    }
}

// Obtener nota por ID
export async function getNotaById(id: string): Promise<Nota | null> {
    try {
        const nota = await prisma.nota.findUnique({
            where: { id },
            include: { creador: true, asignado: true, aprobador: true },
        });

        if (!nota) return null;

        return {
            ...nota,
            empleadoCreador: nota.creador?.nombre ?? "No asignado",
            empleadoAsignado: nota.asignado?.nombre ?? "No asignado",
            empleadoAprobador: nota.aprobador?.nombre ?? "No asignado",
        };
    } catch (error) {
        console.error("Error al obtener nota por id:", error);
        throw new Error("No se pudo obtener la nota");
    }
}

// Eliminar una nota
export async function deleteNota(id: string): Promise<boolean> {
    try {
        await prisma.nota.delete({ where: { id } });
        return true;
    } catch (error) {
        console.error("Error al eliminar nota:", error);
        return false;
    }
}
