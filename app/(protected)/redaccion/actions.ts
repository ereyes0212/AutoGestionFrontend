"use server";


import broadcaster from "@/app/api/notes/broadcaster";
import { getSession, getSessionPermisos } from "@/auth";
import { prisma } from "@/lib/prisma";
import webpush from '@/lib/webpush';
import { Nota } from "./types";
// Crear una nueva nota
export async function createNota({
    creadorEmpleadoId,
    titulo,
    descripcion,
}: {
    creadorEmpleadoId: string;
    titulo: string;
    descripcion: string;
}) {
    const permisos = await getSessionPermisos();

    const esJefe = permisos!.includes("cambiar_estado_notas");

    // crea la nota
    const nuevaNota = await prisma.nota.create({
        data: {
            titulo,
            estado: "PENDIENTE",
            creadorEmpleadoId,
            descripcion,
            asignadoEmpleadoId: esJefe ? null : creadorEmpleadoId,
            aprobadorEmpleadoId: esJefe ? creadorEmpleadoId : null,
            // si tu schema define createAt con default now() no hace falta setearlo
        },
    });

    // obtener la nota completa con relaciones para enviar al cliente (mismo formato que getNotas)
    const notaFull = await prisma.nota.findUnique({
        where: { id: nuevaNota.id },
        include: { creador: true, asignado: true, aprobador: true },
    });
    const notaFormateada = notaFull
        ? {
            ...notaFull,
            empleadoCreador: notaFull.creador?.nombre ?? "No asignado",
            empleadoAsignado: notaFull.asignado?.nombre ?? "No asignado",
            empleadoAprobador: notaFull.aprobador?.nombre ?? "No asignado",
        }
        : {
            ...nuevaNota,
            empleadoCreador: "No asignado",
            empleadoAsignado: "No asignado",
            empleadoAprobador: "No asignado",
        };


    // buscar jefes (tu query adaptada)
    const jefes = await prisma.empleados.findMany({
        where: {
            Usuarios: {
                rol: {
                    permisos: {
                        some: {
                            permiso: {
                                nombre: "cambiar_estado_notas",
                            },
                        },
                    },
                },
            },
        },
        select: { id: true },
    });

    const jefeIds = jefes.map((j) => j.id);

    const subs = await prisma.pushSubscription.findMany({
        where: { empleadoId: { in: jefeIds }, revoked: false },
    });

    const payload = {
        title: "Nueva Nota creada",
        body: "Se creó una nueva nota: " + titulo,
        url: `/redaccion/${nuevaNota.id}/edit`,
        icon: "/icons/notification.png",
    };

    // enviar notificaciones push (manejar errores 410/404)
    for (const s of subs) {
        try {
            await webpush.sendNotification(s.subscription as any, JSON.stringify(payload));
        } catch (err: any) {
            if (err?.statusCode === 410 || err?.statusCode === 404) {
                await prisma.pushSubscription.delete({ where: { id: s.id } });
            } else {
                console.error("web-push error", err);
            }
        }
    }

    // BROADCAST SSE: notifica a clientes conectados en tiempo real
    try {
        broadcaster.broadcast({ type: "nota_creada", nota: notaFormateada });
    } catch (err) {
        // no queremos romper la respuesta principal por un fallo en broadcast
        console.error("Error broadcasting nota_creada:", err);
    }

    return notaFormateada;
}

// Redactor toma nota
export async function tomarNota(id: string) {
    const session = await getSession();
    const nota = await prisma.nota.findUnique({ where: { id } });

    if (!nota) throw new Error("Nota no encontrada");
    if (nota.estado !== "PENDIENTE") throw new Error("La nota ya no está disponible");

    // --- Actualizamos y traemos relaciones
    const notaActualizada = await prisma.nota.update({
        where: { id },
        data: {
            asignadoEmpleadoId: session?.IdEmpleado,
            estado: "APROBADA", // ✅ Cambia el estado automáticamente
        },
        include: {
            creador: true,
            asignado: true,
            aprobador: true,
        },
    });

    // --- Extendemos con nombres legibles
    const notaExtendida = {
        ...notaActualizada,
        empleadoCreador: notaActualizada.creador?.nombre ?? "No asignado",
        empleadoAsignado: notaActualizada.asignado?.nombre ?? "No asignado",
        empleadoAprobador: notaActualizada.aprobador?.nombre ?? "No asignado",
    };

    // --- Broadcast en tiempo real
    try {
        broadcaster.broadcast({ type: "nota_tomada", nota: notaExtendida });
    } catch (err) {
        console.error("Error broadcasting nota_tomada:", err);
    }

    return notaExtendida;
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
export async function aprobarNota(
    id: string,
    estado: 'APROBADA' | 'RECHAZADA' | 'PENDIENTE' | 'FINALIZADA',
    fellback: string | null
) {
    const permisos = await getSessionPermisos();
    const session = await getSession();

    if (!permisos!.includes("cambiar_estado_notas")) {
        throw new Error("No autorizado para aprobar notas");
    }

    // --- Actualizar nota y traer con relaciones
    const notaActualizada = await prisma.nota.update({
        where: { id },
        data: {
            estado,
            aprobadorEmpleadoId: session?.IdEmpleado,
            fellback,
        },
        include: {
            creador: true,
            asignado: true,
            aprobador: true,
        },
    });

    // --- Formato extendido (igual que en getNotas y createNota)
    const notaExtendida = {
        ...notaActualizada,
        empleadoCreador: notaActualizada.creador?.nombre ?? "No asignado",
        empleadoAsignado: notaActualizada.asignado?.nombre ?? "No asignado",
        empleadoAprobador: notaActualizada.aprobador?.nombre ?? "No asignado",
    };

    // --- Notificación solo si hay asignado
    const asignadoId = notaActualizada.asignadoEmpleadoId;
    if (asignadoId) {
        const subs = await prisma.pushSubscription.findMany({
            where: {
                empleadoId: asignadoId,
                revoked: false,
            },
        });

        const payload = {
            title: 'Estado de Nota Actualizado',
            body: `${notaActualizada.titulo} ha cambiado a ${estado}`,
            url: `/notas/${notaActualizada.id}`,
            icon: '/icons/notification.png',
        };

        for (const s of subs) {
            try {
                await webpush.sendNotification(s.subscription as any, JSON.stringify(payload));
            } catch (err: any) {
                if (err.statusCode === 410 || err.statusCode === 404) {
                    await prisma.pushSubscription.delete({ where: { id: s.id } });
                } else {
                    console.error("web-push error", err);
                }
            }
        }
    }

    // --- Broadcast en tiempo real (SSE)
    try {
        broadcaster.broadcast({ type: "nota_actualizada", nota: notaExtendida });
    } catch (err) {
        console.error("Error broadcasting nota_actualizada:", err);
    }

    return notaExtendida;
}



export type ActionResult =
    | { ok: true; result: Nota }
    | { ok: false; error: string; code?: string; status?: number };

export async function finalizarNota(id: string): Promise<ActionResult> {
    try {
        if (!id) return { ok: false, error: "Falta id de nota", code: "MISSING_ID", status: 400 };

        const session = await getSession();
        if (!session) return { ok: false, error: "No autenticado", code: "NO_SESSION", status: 401 };

        const nota = await prisma.nota.findUnique({ where: { id } });
        if (!nota) return { ok: false, error: "Nota no encontrada", code: "NOT_FOUND", status: 404 };

        if (nota.estado !== "APROBADA")
            return { ok: false, error: "La nota aún no está aprobada", code: "NOT_APPROVED", status: 409 };

        if (nota.asignadoEmpleadoId !== session.IdEmpleado)
            return { ok: false, error: "No puedes finalizar una nota que no está asignada a ti", code: "NOT_OWNER", status: 403 };

        const updated = await prisma.nota.update({
            where: { id },
            data: { estado: "FINALIZADA" },
        });

        return { ok: true, result: updated };
    } catch (err) {
        // error inesperado: loguear y devolver mensaje genérico
        console.error("[finalizarNotaAction] unexpected:", err);
        return { ok: false, error: "Error interno", code: "INTERNAL", status: 500 };
    }
}

export async function getNotasFinalizadasHoy(): Promise<Nota[]> {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // 00:00:00 servidor
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    const notas = await prisma.nota.findMany({
        include: { creador: true, asignado: true, aprobador: true },
        where: {
            estado: "FINALIZADA",
            createAt: {
                gte: start,
                lt: end,
            },
        },
        orderBy: { createAt: "desc" },
    });
    return notas.map((n) => ({
        ...n,
        empleadoCreador: n.creador?.nombre ?? "No asignado",
        empleadoAsignado: n.asignado?.nombre ?? "No asignado",
        empleadoAprobador: n.aprobador?.nombre ?? "No asignado",
    }));
}

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
                const m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
                if (m) {
                    const y = Number(m[1]);
                    const mo = Number(m[2]) - 1;
                    const day = Number(m[3]);
                    return new Date(y, mo, day, 0, 0, 0, 0);
                } else {
                    const d = new Date(v);
                    if (isNaN(d.getTime())) throw new Error("Fecha inválida: " + v);
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
                    return new Date(y, mo, day, 23, 59, 59, 999);
                } else {
                    const d = new Date(v);
                    if (isNaN(d.getTime())) throw new Error("Fecha inválida: " + v);
                    d.setHours(23, 59, 59, 999);
                    return d;
                }
            }
            throw new Error("Tipo de fecha no soportado");
        };

        // ===== Ajuste sencillo para servidor adelantado +6h: sólo para el caso "hoy"
        const SHIFT_MS = 6 * 60 * 60 * 1000; // 6 horas en ms

        if (!desde && !hasta) {
            // 1) Tomamos "ahora" en servidor, lo desplazamos -6h para obtener la hora local real
            const now = new Date();
            const shifted = new Date(now.getTime() - SHIFT_MS);

            // 2) Calculamos inicio y fin del día en esa hora local (shifted)
            const startShifted = new Date(shifted);
            startShifted.setHours(0, 0, 0, 0);

            const endShifted = new Date(shifted);
            endShifted.setHours(23, 59, 59, 999);

            // 3) Convertimos esos límites de vuelta al timeline del servidor sumando +6h
            const startForQuery = new Date(startShifted.getTime() + SHIFT_MS);
            const endForQuery = new Date(endShifted.getTime() + SHIFT_MS);

            where.createAt = { gte: startForQuery, lte: endForQuery };
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



type SimpleRow = {
    titulo: string;
    createAtAdjusted: string; // ISO
};

export async function getNotasAgrupadasHoySimple(): Promise<{
    meta: {
        nowServer: string;
        queryStartIso: string;
        queryEndIso: string;
        startLocalIso: string;
        endLocalIso: string;
        threshold14LocalIso: string;
        totalRaw: number;
        totalAfterFilter: number;
    };
    manana: SimpleRow[];
    tarde: SimpleRow[];
}> {
    const SHIFT_MS = 6 * 60 * 60 * 1000; // 6 horas

    const now = new Date();
    const shifted = new Date(now.getTime() - SHIFT_MS);

    const startShifted = new Date(shifted);
    startShifted.setHours(0, 0, 0, 0);

    const endShifted = new Date(shifted);
    endShifted.setHours(23, 59, 59, 999);

    const startForQuery = new Date(startShifted.getTime() + SHIFT_MS);
    const endForQuery = new Date(endShifted.getTime() + SHIFT_MS);

    // margen +/- SHIFT_MS para no perder notas en la frontera
    const queryStart = new Date(startForQuery.getTime() - SHIFT_MS); // === startShifted
    const queryEnd = new Date(endForQuery.getTime() + SHIFT_MS);

    // Traemos solo lo necesario para reducir carga
    const notasRaw = await prisma.nota.findMany({
        where: {
            createAt: { gte: queryStart, lte: queryEnd },
            estado: "FINALIZADA",
        },
        orderBy: { createAt: "asc" },
        select: {
            titulo: true,
            createAt: true,
        },
    });

    // Ajustamos createAt (-6h), filtramos por día local y construimos rows simples
    const notasAjustadas = notasRaw
        .map((n) => {
            const original = n.createAt ? new Date(n.createAt) : null;
            const createAtAdjusted = original ? new Date(original.getTime() - SHIFT_MS) : null;
            return {
                titulo: n.titulo ?? "Sin título",
                createAtAdjusted, // Date | null
            };
        })
        .filter((r) => r.createAtAdjusted !== null)
        .filter((r) => {
            const dt = r.createAtAdjusted as Date;
            return dt >= startShifted && dt <= endShifted;
        }) as { titulo: string; createAtAdjusted: Date }[];

    // umbral 14:00 (hora local ajustada)
    const threshold14 = new Date(startShifted);
    threshold14.setHours(14, 0, 0, 0);

    const manana: SimpleRow[] = [];
    const tarde: SimpleRow[] = [];

    for (const r of notasAjustadas) {
        const iso = (r.createAtAdjusted as Date).toISOString();
        const row: SimpleRow = { titulo: r.titulo, createAtAdjusted: iso };
        if ((r.createAtAdjusted as Date) < threshold14) {
            manana.push(row);
        } else {
            tarde.push(row);
        }
    }

    return {
        meta: {
            nowServer: now.toISOString(),
            queryStartIso: queryStart.toISOString(),
            queryEndIso: queryEnd.toISOString(),
            startLocalIso: startShifted.toISOString(),
            endLocalIso: endShifted.toISOString(),
            threshold14LocalIso: threshold14.toISOString(),
            totalRaw: notasRaw.length,
            totalAfterFilter: notasAjustadas.length,
        },
        manana,
        tarde,
    };
}