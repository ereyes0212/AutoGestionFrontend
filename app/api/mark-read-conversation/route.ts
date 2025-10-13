// app/api/mark-read-conversation/route.ts
"use server";

import { getSession } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Server as IOServer } from "socket.io";

// Helper para emitir por Socket.IO
function emitSocket(io: IOServer | undefined, conversacionId: string, usuarioId: string) {
    if (!io) return;
    io.to(`conversation:${conversacionId}`).emit("conversation_read", { conversacionId, usuarioId });
    io.to(`user:${usuarioId}`).emit("conversation_read", { conversacionId, usuarioId });
}

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session?.IdUser) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

        const { conversacionId } = await req.json();
        if (!conversacionId) return NextResponse.json({ error: "conversacionId required" }, { status: 400 });

        const usuarioId = session.IdUser;

        // Verificar que el usuario es participante
        const participante = await prisma.participante.findUnique({
            where: { conversacionId_usuarioId: { conversacionId, usuarioId } },
        });
        if (!participante) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        // Traer mensajes de la conversacion que NO sean del propio usuario
        const mensajes = await prisma.mensaje.findMany({
            where: { conversacionId, autorId: { not: usuarioId } },
            select: { id: true },
        });
        const mensajeIds = mensajes.map(m => m.id);

        // Si no hay mensajes de otros usuarios, solo actualizamos lastReadAt
        if (mensajeIds.length === 0) {
            await prisma.participante.update({
                where: { conversacionId_usuarioId: { conversacionId, usuarioId } },
                data: { lastReadAt: new Date() },
            });

            try {
                const io: IOServer | undefined = (globalThis as any).io;
                emitSocket(io, conversacionId, usuarioId);
            } catch { }

            return NextResponse.json({ ok: true, updated: 0 });
        }

        // 1) Marcar como leídos los MensajeEstado existentes para este usuario
        const updateResult = await prisma.mensajeEstado.updateMany({
            where: {
                mensajeId: { in: mensajeIds },
                usuarioId,
                leido: false,
            },
            data: {
                leido: true,
                leidoAt: new Date(),
                entregado: true,
                entregadoAt: new Date(),
            },
        });

        // 2) Crear MensajeEstado faltantes
        const existingEstados = await prisma.mensajeEstado.findMany({
            where: { mensajeId: { in: mensajeIds }, usuarioId },
            select: { mensajeId: true },
        });
        const existingSet = new Set(existingEstados.map(e => e.mensajeId));
        const missingIds = mensajeIds.filter(id => !existingSet.has(id));

        if (missingIds.length > 0) {
            const createData = missingIds.map(mid => ({
                mensajeId: mid,
                usuarioId,
                entregado: true,
                leido: true,
                entregadoAt: new Date(),
                leidoAt: new Date(),
            }));
            await prisma.mensajeEstado.createMany({ data: createData, skipDuplicates: true });
        }

        // 3) Actualizar participante.lastReadAt
        await prisma.participante.update({
            where: { conversacionId_usuarioId: { conversacionId, usuarioId } },
            data: { lastReadAt: new Date() },
        });

        // 4) Emitir evento via Socket.IO
        try {
            const io: IOServer | undefined = (globalThis as any).io;
            emitSocket(io, conversacionId, usuarioId);
        } catch (e) {
            console.warn("conversation_read emit failed:", e);
        }

        return NextResponse.json({ ok: true, updated: updateResult.count + missingIds.length });
    } catch (err) {
        console.error("mark-read-conversation error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
