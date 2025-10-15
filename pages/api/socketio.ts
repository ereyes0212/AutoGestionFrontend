/* eslint-disable @typescript-eslint/no-unsafe-function-type */
// pages/api/socketio.ts
import { prisma } from "@/lib/prisma"; // ajustá si tu ruta es distinta
import jwt from "jsonwebtoken";
import { NextApiRequest, NextApiResponse } from "next";
import { Server as IOServer } from "socket.io";

type NextSocketApiResponse = NextApiResponse & { socket: any & { server: any } };

export default async function handler(req: NextApiRequest, res: NextSocketApiResponse) {
    // Si ya existe la instancia, respondemos ok (idempotente)
    if (res.socket.server.io) {
        return res.status(200).json({ ok: true });
    }

    console.log("Inicializando Socket.IO (pages/api/socketio.ts)...");

    const io = new IOServer(res.socket.server, {
        path: "/api/socketio",              // <- debe coincidir con el cliente y nginx
        cors: { origin: process.env.CORS_ORIGIN ?? "http://localhost:3000", credentials: true },
        transports: ["polling", "websocket"] // polling first, then upgrade
    });

    // Guardamos la instancia para reutilizarla
    res.socket.server.io = io;

    // Autenticación simple vía JWT en handshake.auth.token
    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth?.token as string | undefined;
            if (!token) return next(new Error("AUTH_REQUIRED"));
            const payload = jwt.verify(token, process.env.JWT_SECRET as string) as any;
            (socket as any).user = { id: payload.id, usuario: payload.usuario ?? payload.username };
            return next();
        } catch (err) {
            console.error("Socket auth error:", err);
            return next(new Error("INVALID_TOKEN"));
        }
    });

    io.on("connection", (socket) => {
        const user = (socket as any).user;
        console.log("socket conectado:", user?.id, socket.id);

        // Unimos el socket a su canal de usuario (para notificaciones globales)
        socket.join(`user:${user.id}`);

        socket.on("join_conversation", async (conversacionId: string, ack?: Function) => {
            try {
                const miembro = await prisma.participante.findFirst({
                    where: { conversacionId, usuarioId: user.id },
                });
                if (!miembro) return ack?.({ status: "FORBIDDEN" });
                socket.join(`conversation:${conversacionId}`);
                return ack?.({ status: "OK" });
            } catch (err) {
                console.error("join_conversation error", err);
                return ack?.({ status: "ERROR" });
            }
        });

        socket.on("send_message", async (payload: any, ack?: Function) => {
            try {
                const { conversacionId, contenido, attachments = [] } = payload;
                const participantes = await prisma.participante.findMany({
                    where: { conversacionId },
                    select: { usuarioId: true },
                });
                if (!participantes.find((p) => p.usuarioId === user.id)) {
                    return ack?.({ status: "FORBIDDEN" });
                }

                const estadosData = participantes.map((p) => ({
                    usuarioId: p.usuarioId,
                    entregado: p.usuarioId === user.id,
                    leido: p.usuarioId === user.id,
                }));

                const mensaje = await prisma.mensaje.create({
                    data: {
                        conversacionId,
                        autorId: user.id,
                        contenido,
                        attachments: { create: attachments },
                        estados: { create: estadosData },
                    },
                    include: {
                        autor: { select: { id: true, usuario: true } },
                        attachments: true,
                        estados: true,
                    },
                });

                await prisma.conversacion.update({
                    where: { id: conversacionId },
                    data: { updatedAt: new Date() },
                });

                // 1) Emitir a la sala de la conversación (quienes están "dentro" del chat)
                io.to(`conversation:${conversacionId}`).emit("message", mensaje);

                // 2) Emitir también a cada usuario participante en su sala user:<id>.
                //    Esto permite que sockets globales (ej. SocketNotifier) reciban la notificación,
                //    aunque no estén unidos a la sala conversation:<id>.
                try {
                    for (const p of participantes) {
                        // opcional: evitar notificar al autor (si no quieres que su otra sesión reciba toast)
                        if (p.usuarioId === user.id) continue;
                        io.to(`user:${p.usuarioId}`).emit("message", mensaje);
                        console.debug(`Emitted message to user:${p.usuarioId}`);
                    }
                } catch (emitErr) {
                    console.error("Error emitiendo a users:", emitErr);
                }

                ack?.({ status: "OK", mensaje });
            } catch (err) {
                console.error("send_message error", err);
                ack?.({ status: "ERROR", error: String(err) });
            }
        });

        socket.on("mark_read", async ({ conversacionId, mensajeId }: any, ack?: Function) => {
            try {
                await prisma.mensajeEstado.upsert({
                    where: { mensajeId_usuarioId: { mensajeId, usuarioId: user.id } as any },
                    create: { mensajeId, usuarioId: user.id, leido: true, leidoAt: new Date() },
                    update: { leido: true, leidoAt: new Date() },
                });
                io.to(`conversation:${conversacionId}`).emit("message_read", { mensajeId, usuarioId: user.id });
                ack?.({ status: "OK" });
            } catch (err) {
                console.error("mark_read error", err);
                ack?.({ status: "ERROR" });
            }
        });

        socket.on("disconnect", () => {
            console.log("socket disconnected", user.id, socket.id);
        });
    });

    return res.status(200).json({ ok: true });
}
