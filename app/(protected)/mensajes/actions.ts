// app/actions/chat.ts

'use server';
import { prisma } from "@/lib/prisma";
import { ChatListItem } from "./type";

/**
 * Devuelve la lista de conversaciones (chats) en las que participa userId.
 * - incluye participantes (usuario mínimo)
 * - incluye el último mensaje (si existe)
 * - unreadCount: mensajes no leídos para este usuario (excluye mensajes que él mismo envió)
 */
export async function getChatsForUser(userId: string): Promise<ChatListItem[]> {
    if (!userId) return [];

    // 1) traer conversaciones donde participa el user
    const convs = await prisma.conversacion.findMany({
        where: {
            participantes: { some: { usuarioId: userId } }
        },
        include: {
            participantes: {
                include: {
                    usuario: {
                        select: {
                            id: true,
                            usuario: true,
                            // si tenés campos extras como nombreCompleto/avatar, agrégalos:
                            // nombreCompleto: true,
                            // avatarUrl: true,
                        }
                    }
                }
            },
            // traer solo el último mensaje
            mensajes: {
                orderBy: { createdAt: "desc" },
                take: 1,
                include: {
                    autor: {
                        select: { id: true, usuario: true }
                    }
                }
            }
        },
        orderBy: { updatedAt: "desc" }
    });

    // 2) por cada conversación calcular unreadCount (se excluyen mensajes del propio usuario)
    const results = await Promise.all(convs.map(async (c) => {
        // contar mensajes en la conversacion que:
        // - no sean enviados por el mismo user
        // - y que NO tengan un MensajeEstado indicando que este usuario ya los leyó
        const unreadCount = await prisma.mensaje.count({
            where: {
                conversacionId: c.id,
                autorId: { not: userId },
                NOT: {
                    estados: {
                        some: {
                            usuarioId: userId,
                            leido: true
                        }
                    }
                }
            }
        });

        const lastMessage = (c.mensajes && c.mensajes[0]) ? c.mensajes[0] : null;

        // transformar participantes a formato mínimo de usuario
        const participantesMin = c.participantes.map(p => ({
            id: p.usuario.id,
            usuario: p.usuario.usuario,
            // opcionales si existen:
            // nombreCompleto: (p.usuario as any).nombreCompleto ?? undefined,
            // avatarUrl: (p.usuario as any).avatarUrl ?? undefined
        }));

        return {
            id: c.id,
            nombre: c.nombre ?? null,
            tipo: c.tipo,
            creadorId: c.creadorId ?? null,
            participantes: participantesMin,
            lastMessage: lastMessage ? {
                id: lastMessage.id,
                contenido: lastMessage.contenido,
                autorId: lastMessage.autorId,
                autorUsuario: lastMessage.autor?.usuario ?? null,
                createdAt: lastMessage.createdAt.toISOString(),
                editedAt: lastMessage.editedAt?.toISOString() ?? null
            } : null,
            unreadCount,
            updatedAt: c.updatedAt?.toISOString() ?? null,
            createdAt: c.createdAt.toISOString()
        } as ChatListItem;
    }));

    return results;
}

export async function createGroupConversation(nombre: string, userIds: string[], creatorId: string) {
    if (!nombre.trim()) throw new Error("El nombre del grupo es requerido");
    if (userIds.length < 2) throw new Error("Debes seleccionar al menos 2 usuarios para un grupo");

    const filteredUserIds = userIds.filter(id => id !== creatorId);

    const conversacion = await prisma.conversacion.create({
        data: {
            nombre,
            tipo: "GROUP",
            creadorId: creatorId,
            participantes: {
                create: [
                    { usuarioId: creatorId, rol: "admin" },
                    ...filteredUserIds.map((id) => ({ usuarioId: id, rol: "member" })),
                ],
            },
        },
        include: {
            participantes: { include: { usuario: true } },
        },
    });

    return conversacion;
}

export async function createPrivateConversation(userId1: string, userId2: string) {
    if (!userId1 || !userId2) throw new Error("Se requieren ambos usuarios");

    // ✅ Buscar si ya existe una conversación privada entre ambos
    const existing = await prisma.conversacion.findFirst({
        where: {
            tipo: "PRIVATE",
            participantes: {
                every: {
                    usuarioId: { in: [userId1, userId2] },
                },
            },
        },
        include: { participantes: true },
    });

    if (existing) {
        return { status: "EXISTS", conversacion: existing };
    }

    // ✅ Crear nueva conversación privada
    const conversacion = await prisma.conversacion.create({
        data: {
            tipo: "PRIVATE",
            participantes: {
                create: [
                    { usuarioId: userId1, rol: "member" },
                    { usuarioId: userId2, rol: "member" },
                ],
            },
        },
        include: {
            participantes: { include: { usuario: true } },
        },
    });

    return { status: "CREATED", conversacion };
}

export async function traerMensajes(conversacionId: string, userId: string) {
    try {
        const conversacion = await prisma.conversacion.findUnique({
            where: { id: conversacionId },
            include: {
                participantes: true, // para validar membresía
                mensajes: {
                    orderBy: { createdAt: "asc" },
                    include: {
                        autor: { select: { id: true, usuario: true } },
                        estados: true,
                        attachments: true,
                    },
                },
            },
        });

        if (!conversacion) {
            return { status: "NOT_FOUND", mensajes: [] };
        }

        const esMiembro = conversacion.participantes.some(
            (p) => p.usuarioId === userId
        );

        if (!esMiembro) {
            return { status: "FORBIDDEN", mensajes: [] };
        }

        return { status: "OK", mensajes: conversacion.mensajes, conversacion };
    } catch (error) {
        console.error("Error al traer mensajes:", error);
        return { status: "ERROR", mensajes: [] };
    }
}


export async function sendMessage(
    conversacionId: string,
    autorId: string,
    contenido: string,
    attachments: { url: string; tipo?: string; nombre?: string; tamaño?: number }[] = []
) {
    if (!contenido.trim()) throw new Error("El mensaje no puede estar vacío");

    const mensaje = await prisma.mensaje.create({
        data: {
            conversacionId,
            autorId,
            contenido,
            attachments: {
                create: attachments,
            },
        },
        include: {
            autor: { select: { id: true, usuario: true } },
            attachments: true,
            estados: true,
        },
    });

    return mensaje;
}

export async function updateGroupName(conversacionId: string, nuevoNombre: string) {
    if (!nuevoNombre.trim()) throw new Error("El nombre del grupo es obligatorio");

    const updated = await prisma.conversacion.update({
        where: { id: conversacionId },
        data: { nombre: nuevoNombre },
    });

    return updated;
}

/**
 * Agrega usuarios a un grupo existente
 */
export async function addUsersToGroup(conversacionId: string, userIds: string[]) {
    if (userIds.length === 0) return;

    // Evitar duplicados
    const existingIds = await prisma.participante.findMany({
        where: { conversacionId, usuarioId: { in: userIds } },
        select: { usuarioId: true },
    });

    const filteredIds = userIds.filter(id => !existingIds.some(e => e.usuarioId === id));

    if (filteredIds.length === 0) return;

    await prisma.participante.createMany({
        data: filteredIds.map(id => ({
            conversacionId,
            usuarioId: id,
            rol: "member",
        })),
    });
}

/**
 * Expulsa usuarios de un grupo
 */
export async function removeUsersFromGroup(conversacionId: string, userIds: string[]) {
    if (userIds.length === 0) return;

    // Evitar expulsar al creador
    const conversacion = await prisma.conversacion.findUnique({
        where: { id: conversacionId },
        select: { creadorId: true },
    });

    if (!conversacion) throw new Error("Grupo no encontrado");

    const filteredIds = userIds.filter(id => id !== conversacion.creadorId);
    if (filteredIds.length === 0) return;

    await prisma.participante.deleteMany({
        where: {
            conversacionId,
            usuarioId: { in: filteredIds },
        },
    });
}

export async function traerUtlimosMensajes(conversacionId: string, currentUserId: string) {
    const mensajes = await prisma.mensaje.findMany({
        where: { conversacionId },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
            autor: { select: { id: true, usuario: true } },
        },
    });

    return { mensajes: mensajes.reverse() }; // invertimos para que queden del más antiguo al más reciente
}