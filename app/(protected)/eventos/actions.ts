'use server';
import { getSession, getSessionPermisos } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Evento } from "./types";

export async function CreateEvento({ titulo, descripcion, fecha, ubicacion, facturaAdjunta, notaEnlace, monto }: {
    titulo: string; descripcion: string; fecha: string; ubicacion: string; facturaAdjunta: string; notaEnlace: string; monto: number;
}) {
    const session = await getSession();
    try {
        const newEvento = await prisma.evento.create({
            data: {
                titulo,
                descripcion,
                fecha: new Date(fecha),
                ubicacion,
                facturaAdjunta,
                notaEnlace,
                monto,
                empleadoId: session?.IdEmpleado!,

            }
        })
        return newEvento;
    }
    catch (error) {
        console.error("Error creating evento:", error);
    }
}

export async function getEventoId(id: string) {
    try {
        const session = await getSession();
        const empleadoId = session?.IdEmpleado;

        const evento = await prisma.evento.findUnique({
            where: { id: id, empleadoId: empleadoId! },
        });
        if (!evento) {
            console.error("Evento no encontrado:", id);
            return null;
        }
        return evento;
    } catch (error) {
        console.error("Error fetching evento by ID:", error);
    }
}

export async function getEventos(): Promise<Evento[]> {
    try {
        const session = await getSession();
        const permisos = await getSessionPermisos();
        if (permisos!.includes("Ver_todos_los_eventos")) {
            const eventos = await prisma.evento.findMany({
            });
            return eventos;

        } else {
            const empleadoId = session?.IdEmpleado;
            const eventos = await prisma.evento.findMany({
                where: { empleadoId: empleadoId! },
            });
            return eventos;
        }
    } catch (error) {
        console.error("Error fetching eventos:", error);
        return [];
    }
}

export async function updateEvento(id: string, data: { titulo?: string; descripcion?: string; fecha?: string; ubicacion?: string; facturaAdjunta?: string; notaEnlace?: string; monto?: number; }) {
    try {
        const updatedEvento = await prisma.evento.update({
            where: { id },
            data: {
                ...data,
                fecha: data.fecha ? new Date(data.fecha) : undefined,
            },
        });
        return updatedEvento;
    } catch (error) {
        console.error("Error updating evento:", error);
    }
}

