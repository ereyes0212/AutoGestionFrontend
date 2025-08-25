"use server";


import { getSession, getSessionPermisos } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Nota } from "./types";

// Crear una nueva nota
export async function createNota({
    creadorEmpleadoId,
    titulo,
    descripcion
}: {
    creadorEmpleadoId: string;
    titulo: string;
    descripcion: string;
}) {
    const permisos = await getSessionPermisos();

    const esJefe = permisos!.includes("cambiar_estado_notas");

    const nuevaNota = await prisma.nota.create({
        data: {
            titulo,
            estado: "PENDIENTE",
            creadorEmpleadoId,
            descripcion,
            asignadoEmpleadoId: esJefe ? null : creadorEmpleadoId,
            aprobadorEmpleadoId: esJefe ? creadorEmpleadoId : null,
        },
    });

    return nuevaNota;
}

// Redactor toma nota
export async function tomarNota(id: string) {
    console.log("entro al tomar nota :", id);
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
export async function updateNota(
    id: string,
    data: { titulo?: string; descripcion?: string | null }
): Promise<Nota> {
    try {
        const updatePayload: Record<string, any> = {};
        if (data.titulo !== undefined) updatePayload.titulo = data.titulo;
        if (data.descripcion !== undefined) updatePayload.descripcion = data.descripcion ?? undefined;

        const nota = await prisma.nota.update({
            where: { id },
            data: updatePayload,
            include: { creador: true, asignado: true, aprobador: true },
        });

        // Mapear nombres legibles y devolver el objeto con la forma que usas en front
        return {
            ...nota,
            empleadoCreador: (nota as any).creador?.nombre ?? "No asignado",
            empleadoAsignado: (nota as any).asignado?.nombre ?? "No asignado",
            empleadoAprobador: (nota as any).aprobador?.nombre ?? "No asignado",
        } as Nota;
    } catch (error) {
        console.error("Error al actualizar nota:", error);
        throw new Error("No se pudo actualizar la nota");
    }
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
