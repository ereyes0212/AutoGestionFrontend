"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { TipoConversacion, type ChatListItem } from "../type";

import useSocket from "@/hooks/useSocket"; // ajustá la ruta si la tenés en otro lado

// shadcn components
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface Props {
    chats: ChatListItem[];
    currentUserId: string;
}

export default function ChatListClient({ chats: initialChats, currentUserId }: Props) {
    const router = useRouter();

    // state local para poder actualizar unreadCount / lastMessage
    const [chats, setChats] = useState<ChatListItem[]>(initialChats ?? []);
    const chatsRef = useRef<ChatListItem[]>(chats);
    useEffect(() => {
        chatsRef.current = chats;
    }, [chats]);

    // socket (usa el mismo API que en tu ChatConversation: socketRef, connected)
    const { socketRef, connected } = useSocket();
    const socket = socketRef?.current ?? null;

    // Nos unimos a las salas cuando el socket se conecta o cuando cambia la lista inicial
    useEffect(() => {
        if (!socket || !connected) return;

        // join a todas las conversations actualmente en la lista
        const joinAll = () => {
            (chatsRef.current ?? []).forEach((c) => {
                try {
                    socket.emit("join_conversation", c.id, (resp: any) => {
                        // opcional: log/handle resp.status !== 'OK'
                    });
                } catch (e) {
                    // ignore
                }
            });
        };

        joinAll();

        // Cuando se reconecte el socket (por reconnect automático) volver a unir
        const onConnect = () => joinAll();
        socket.on("connect", onConnect);

        return () => {
            socket.off("connect", onConnect);
            // no off join_conversation porque es emit, no listener
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [socket, connected]); // no poner `chats` aquí para evitar resuscripciones infinitas

    // Listeners de incoming events (message, conversation_read)
    useEffect(() => {
        if (!socket || !connected) return;

        const onMessage = (m: any) => {
            try {
                const convId = m.conversacionId ?? m.conversacion?.id ?? null;
                if (!convId) return;

                const lastMessage = {
                    id: m.id,
                    contenido: m.contenido,
                    autorId: m.autor?.id ?? m.autorId ?? null,
                    autorUsuario: m.autor?.usuario ?? m.autorUsuario ?? null,
                    createdAt: m.createdAt ? new Date(m.createdAt).toISOString() : new Date().toISOString(),
                    editedAt: m.editedAt ? new Date(m.editedAt).toISOString() : null,
                };

                setChats((prev) => {
                    // si existe la conversacion la actualizamos
                    const found = prev.find((p) => p.id === convId);
                    if (found) {
                        return prev.map((p) => {
                            if (p.id !== convId) return p;
                            const isFromOther = lastMessage.autorId !== currentUserId;
                            return {
                                ...p,
                                lastMessage,
                                updatedAt: new Date().toISOString(),
                                unreadCount: isFromOther ? ((p.unreadCount ?? 0) + 1) : (p.unreadCount ?? 0),
                            };
                        });
                    }
                    // si no existe, la añadimos arriba (opcional)
                    const nuevo: ChatListItem = {
                        id: convId,
                        nombre: null,
                        tipo: TipoConversacion.PRIVATE,
                        creadorId: null,
                        participantes: [],
                        lastMessage,
                        unreadCount: lastMessage.autorId !== currentUserId ? 1 : 0,
                        updatedAt: new Date().toISOString(),
                        createdAt: new Date().toISOString(),
                    };
                    return [nuevo, ...prev];
                });
            } catch (err) {
                console.error("chatlist onMessage parse error:", err);
            }
        };

        const onConvRead = (payload: any) => {
            try {
                const { conversacionId, usuarioId } = payload ?? {};
                if (!conversacionId) return;

                // Si el que leyó es este usuario, ponemos unreadCount en 0
                if (usuarioId === currentUserId) {
                    setChats((prev) => prev.map((p) => (p.id === conversacionId ? { ...p, unreadCount: 0 } : p)));
                } else {
                    // Si otro usuario (por ejemplo en grupos) marcó como leído y querés ajustar, manejar aquí
                }
            } catch (err) {
                console.error("chatlist onConvRead error:", err);
            }
        };

        socket.on("message", onMessage);
        socket.on("conversation_read", onConvRead);

        return () => {
            socket.off("message", onMessage);
            socket.off("conversation_read", onConvRead);
        };
    }, [socket, connected, currentUserId]);

    // helpers
    function otherParticipantName(item: ChatListItem) {
        if (item.tipo === "GROUP") return item.nombre ?? "Grupo";
        const other = item.participantes.find((p) => p.id !== currentUserId);
        return other ? other.usuario : "Desconocido";
    }

    function initialsFromName(name: string) {
        const parts = name.split(" ").filter(Boolean);
        const initials = (parts[0]?.[0] || "?") + (parts[1]?.[0] || "");
        return initials.toUpperCase();
    }

    function formatTime(dateString: string) {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

        if (diffInHours < 24) {
            return date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
        } else {
            return date.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" });
        }
    }

    // Al abrir una conversación: marcar como leído en el servidor, actualizar UI local y navegar
    const openConversation = async (c: ChatListItem) => {
        try {
            // Llamada al endpoint que marca como leídos en BD
            await fetch("/api/mark-read-conversation", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ conversacionId: c.id }),
            }).catch((e) => {
                console.warn("mark-read failed:", e);
            });

            // feedback instantáneo en UI
            setChats((prev) => prev.map((p) => (p.id === c.id ? { ...p, unreadCount: 0 } : p)));

            // Emitir por socket para sincronizar otras sesiones (si el server escucha 'conversation_read' o procesa la emisión)
            try {
                socket?.emit("conversation_read", { conversacionId: c.id }, (ack: any) => {
                    /* ack opcional */
                });
            } catch { }

            router.push(`/mensajes/${c.id}/mensaje`);
        } catch (err) {
            console.error("Error al abrir conversación:", err);
            router.push(`/mensajes/${c.id}/mensaje`);
        }
    };

    return (
        <div className="w-full  mx-auto p-4">
            <div className="space-y-2">
                {chats.length === 0 ? (
                    // Enhanced empty state with Card
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <div className="text-center">
                                <h3 className="text-lg font-semibold">No hay conversaciones</h3>
                                <p className="text-muted-foreground mt-1">Inicia una nueva conversación</p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    chats.map((c, index) => {
                        const name = otherParticipantName(c);
                        const lastMsg = c.lastMessage;
                        const isGroup = c.tipo === "GROUP";
                        const hasUnread = (c.unreadCount ?? 0) > 0;

                        return (
                            <div key={c.id}>
                                <Card className="transition-colors hover:bg-muted/50">
                                    <CardContent className="p-0">
                                        <Button
                                            variant="ghost"
                                            className="w-full h-auto p-4 justify-start"
                                            onClick={() => openConversation(c)}
                                        >
                                            <div className="flex items-center gap-3 w-full">
                                                <Avatar className="w-12 h-12">
                                                    <AvatarFallback
                                                        className={isGroup ? "bg-purple-500 text-white" : "bg-primary text-primary-foreground"}
                                                    >
                                                        {initialsFromName(name)}
                                                    </AvatarFallback>
                                                </Avatar>

                                                <div className="flex-1 min-w-0 text-left">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <h3 className={`font-medium truncate ${hasUnread ? "font-semibold" : ""}`}>{name}</h3>

                                                        <div className="flex items-center gap-2">
                                                            {lastMsg && lastMsg.createdAt && (
                                                                <span className="text-xs text-muted-foreground">{formatTime(lastMsg.createdAt)}</span>
                                                            )}
                                                            {hasUnread && (
                                                                <Badge variant="default" className="text-xs min-w-[20px] h-5">
                                                                    {c.unreadCount! > 9 ? "9+" : c.unreadCount}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <p className="text-sm text-muted-foreground truncate">
                                                        {lastMsg ? lastMsg.contenido : "Conversación iniciada"}
                                                    </p>
                                                </div>
                                            </div>
                                        </Button>
                                    </CardContent>
                                </Card>

                                {index < chats.length - 1 && <Separator className="my-1" />}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
