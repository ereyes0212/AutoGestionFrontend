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
// Acepta string (ej. "2025-08-29" o ISO con time) o Date
export async function getNotas(desde?: string | Date, hasta?: string | Date): Promise<Nota[]> {
    try {
        const where: any = {};

        const parseStartOfDay = (v: string | Date) => {
            if (v instanceof Date) {
                const d = new Date(v);
                d.setHours(0, 0, 0, 0);
                return d;
            }
            if (typeof v === "string") {
                // si viene en formato YYYY-MM-DD (sin time) lo parseamos como fecha local
                const m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
                if (m) {
                    const y = Number(m[1]);
                    const mo = Number(m[2]) - 1;
                    const day = Number(m[3]);
                    return new Date(y, mo, day, 0, 0, 0, 0); // local midnight
                } else {
                    // si viene con time (ISO), lo usamos y normalizamos al inicio del día local
                    const d = new Date(v);
                    if (isNaN(d.getTime())) throw new Error('Fecha inválida: ' + v);
                    d.setHours(0, 0, 0, 0);
                    return d;
                }
            }
            throw new Error("Tipo de fecha no soportado");
        };

        const parseEndOfDay = (v: string | Date) => {
            if (v instanceof Date) {
                const d = new Date(v);
                d.setHours(23, 59, 59, 999);
                return d;
            }
            if (typeof v === "string") {
                const m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
                if (m) {
                    const y = Number(m[1]);
                    const mo = Number(m[2]) - 1;
                    const day = Number(m[3]);
                    return new Date(y, mo, day, 23, 59, 59, 999); // local end of day
                } else {
                    const d = new Date(v);
                    if (isNaN(d.getTime())) throw new Error('Fecha inválida: ' + v);
                    d.setHours(23, 59, 59, 999);
                    return d;
                }
            }
            throw new Error("Tipo de fecha no soportado");
        };

        // Si no vienen ni 'desde' ni 'hasta', por defecto filtramos SOLO el día de hoy
        if (!desde && !hasta) {
            const hoyInicio = new Date();
            hoyInicio.setHours(0, 0, 0, 0);
            const hoyFin = new Date();
            hoyFin.setHours(23, 59, 59, 999);
            where.createAt = { gte: hoyInicio, lte: hoyFin };
        } else {
            if (desde) {
                const d = parseStartOfDay(desde);
                where.createAt = { ...(where.createAt ?? {}), gte: d };
            }

            if (hasta) {
                const h = parseEndOfDay(hasta);
                where.createAt = { ...(where.createAt ?? {}), lte: h };
            }
        }

        const notas = await prisma.nota.findMany({
            where,
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
        const sesion = await getSession();
        const permisos = await getSessionPermisos();

        const nota = await prisma.nota.findUnique({
            where: { id },
            include: { creador: true, asignado: true, aprobador: true },
        });

        if (!nota) return null;

        const esJefe = permisos!.includes("cambiar_estado_notas");
        const esCreador = sesion?.IdEmpleado === nota.creadorEmpleadoId;
        const esAsignado = sesion?.IdEmpleado === nota.asignadoEmpleadoId;

        // 🔒 Validaciones
        if (nota.asignadoEmpleadoId !== null) {
            if (!esCreador && !esAsignado && !esJefe) {
                return null; // No autorizado
            }
        }
        // Si asignadoEmpleadoId es null → cualquiera puede acceder

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
