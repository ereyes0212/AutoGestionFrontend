"use server";
import { getSession } from "@/auth";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import { Nota } from "./types";

// Obtener todas las notas
export async function getNotas(): Promise<Nota[]> {
    try {
        const notas = await prisma.nota.findMany({
            orderBy: { createAt: "desc" },
            include: {
                creador: true,
                asignado: true,
                aprobador: true,
            },
        });

        // Mapear los nombres a las propiedades string
        return notas.map((n) => ({
            ...n,
            empleadoCreador: n.creador?.nombre ?? "No asignado",
            empleadoAsignado: n.asignado?.nombre ?? "No asignado",
            empleadoAprobador: n.aprobador?.nombre ?? "No asignado",
        }));
    } catch (error) {
        console.error("Error al obtener las notas:", error);
        return [];
    }
}

// Obtener una nota por ID
export async function getNotaById(id: string): Promise<Nota | null> {
    try {
        return await prisma.nota.findUnique({
            where: { id },
            include: { creador: true, asignado: true, aprobador: true },
        });
    } catch (error) {
        console.error("Error al obtener la nota por ID:", error);
        return null;
    }
}

// Crear una nueva nota
export async function postNota({ nota }: { nota: Nota }): Promise<Nota | null> {
    const data = await getSession();
    try {
        const created = await prisma.nota.create({
            data: {
                id: randomUUID(),
                creador: { connect: { id: data?.IdEmpleado! } },
                asignado: nota.asignadoEmpleadoId ? { connect: { id: nota.asignadoEmpleadoId } } : undefined,
                aprobador: nota.aprobadorEmpleadoId ? { connect: { id: nota.aprobadorEmpleadoId } } : undefined,
                estado: nota.estado,
                titulo: nota.titulo,
                fellback: nota.fellback ?? null,
            },
            include: { creador: true, asignado: true, aprobador: true },
        });
        return created;
    } catch (error) {
        console.error("Error al crear la nota:", error);
        return null;
    }
}

// Actualizar nota completa
export async function putNota({ nota }: { nota: Nota }): Promise<Nota | null> {
    try {
        const updated = await prisma.nota.update({
            where: { id: nota.id! },
            data: {
                creador: { connect: { id: nota.creadorEmpleadoId } },
                asignado: nota.asignadoEmpleadoId ? { connect: { id: nota.asignadoEmpleadoId } } : { disconnect: true },
                aprobador: nota.aprobadorEmpleadoId ? { connect: { id: nota.aprobadorEmpleadoId } } : { disconnect: true },
                estado: nota.estado,
                titulo: nota.titulo,
                fellback: nota.fellback ?? null,
            },
            include: { creador: true, asignado: true, aprobador: true },
        });
        return updated;
    } catch (error) {
        console.error("Error al actualizar la nota:", error);
        return null;
    }
}

// Cambiar solo estado y fellback
export async function updateEstadoNota({
    id,
    estado,
    fellback,
}: {
    id: string;
    estado: Nota["estado"];
    fellback?: string | null;
}): Promise<Nota | null> {
    try {
        const updated = await prisma.nota.update({
            where: { id },
            data: {
                estado,
                fellback: fellback ?? null,
            },
            include: { creador: true, asignado: true, aprobador: true },
        });
        return updated;
    } catch (error) {
        console.error("Error al actualizar estado/fellback de la nota:", error);
        return null;
    }
}
