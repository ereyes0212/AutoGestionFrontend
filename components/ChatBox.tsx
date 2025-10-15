"use client";

import { traerMensajes } from "@/app/(protected)/mensajes/actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import useSocket from "@/hooks/useSocket";
import { ChevronsDown, ChevronsUp, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type MiniMensaje = {
    id?: string;
    contenido: string;
    createdAt?: string;
    autor?: { id?: string; usuario?: string };
    _fromInitial?: boolean;
};

export default function ChatBox({
    conversacionId,
    nombre,
    tipo,
    onClose,
    initialLastMessage,
    currentUserId,
}: {
    conversacionId: string;
    nombre?: string | null;
    tipo?: string;
    onClose: () => void;
    initialLastMessage?: MiniMensaje | null;
    currentUserId: string;
}) {
    const { socketRef } = useSocket();
    const socket = socketRef?.current;

    const [minimized, setMinimized] = useState(false);
    const [messages, setMessages] = useState<MiniMensaje[]>(
        initialLastMessage ? [{ ...initialLastMessage, _fromInitial: true }] : []
    );
    const [texto, setTexto] = useState("");
    const bottomRef = useRef<HTMLDivElement | null>(null);
    const [sending, setSending] = useState(false);

    // 1️⃣ Traer últimos 20 mensajes al montar el chat
    useEffect(() => {
        if (!conversacionId || !currentUserId) return;

        traerMensajes(conversacionId, currentUserId)
            .then(({ mensajes }) => {
                const formatted = mensajes.map((m: any) => ({
                    id: m.id,
                    contenido: m.contenido,
                    createdAt: m.createdAt ? new Date(m.createdAt).toISOString() : undefined,
                    autor: m.autor ? { id: m.autor.id, usuario: m.autor.usuario } : undefined,
                }));
                setMessages(formatted.slice(-20)); // últimos 20
            })
            .catch((err) => console.error("Error cargando historial:", err));
    }, [conversacionId, currentUserId]);

    // 2️⃣ Scroll automático al final
    useEffect(() => {
        if (bottomRef.current) {
            setTimeout(() => {
                try {
                    bottomRef.current!.scrollIntoView({ behavior: "smooth", block: "end" });
                } catch { }
            }, 30);
        }
    }, [messages, minimized]);

    // 3️⃣ Escuchar mensajes del socket
    useEffect(() => {
        if (!socket) return;

        const handler = (m: any) => {
            const convId = m.conversacionId ?? m.conversacion?.id ?? null;
            if (!convId || convId !== conversacionId) return;
            if (m.autor?.id === currentUserId) return;

            setMessages((prev) => {
                if (prev.some((p) => p.id === m.id)) return prev;
                return [
                    ...prev,
                    {
                        id: m.id,
                        contenido: m.contenido,
                        createdAt: m.createdAt ? new Date(m.createdAt).toISOString() : new Date().toISOString(),
                        autor: m.autor ?? undefined,
                    },
                ];
            });
        };

        socket.on("message", handler);
        return () => {
            socket.off("message", handler);
        };
    }, [socket, conversacionId, currentUserId]);

    // 4️⃣ Enviar mensaje con optimist update
    const handleSend = () => {
        if (!texto.trim() || !socket) return;

        setSending(true);
        const contenido = texto.trim();
        const tempId = `temp-${Math.random().toString(36).slice(2, 9)}`;

        // Optimistic update
        const optimistic: MiniMensaje = {
            id: tempId,
            contenido,
            createdAt: new Date().toISOString(),
            autor: { id: currentUserId, usuario: "Tú" },
        };
        setMessages((prev) => [...prev, optimistic]);
        setTexto("");

        // Emitir mensaje al socket
        socket.emit("send_message", { conversacionId, contenido, attachments: [] }, (res: any) => {
            if (res?.status === "OK" && res.mensaje) {
                setMessages((prev) =>
                    prev.map((x) =>
                        x.id === tempId
                            ? {
                                id: res.mensaje.id,
                                contenido: res.mensaje.contenido,
                                createdAt: res.mensaje.createdAt
                                    ? new Date(res.mensaje.createdAt).toISOString()
                                    : new Date().toISOString(),
                                autor: res.mensaje.autor,
                            }
                            : x
                    )
                );
            } else {
                console.error("Error enviando mensaje:", res?.error);
                // Remover mensaje optimista si falla
                setMessages((prev) => prev.filter((x) => x.id !== tempId));
            }
            setSending(false);
        });
    };

    const chatName =
        nombre ??
        (tipo === "PRIVATE"
            ? messages.find((m) => m.autor?.id !== currentUserId)?.autor?.usuario ?? "Chat"
            : "Chat");

    return (
        <div className="w-[340px] max-w-[95vw] bg-background shadow-lg rounded-t-xl border overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-3 py-2 border-b">
                <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="w-9 h-9">
                        <AvatarFallback>{(chatName ?? "G").charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{chatName}</div>
                        <div className="text-xs text-muted-foreground">{tipo ?? ""}</div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setMinimized((m) => !m)}>
                        {minimized ? <ChevronsUp className="w-4 h-4" /> : <ChevronsDown className="w-4 h-4" />}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        Cerrar
                    </Button>
                </div>
            </div>

            {!minimized && (
                <>
                    <div className="p-3 flex-1 overflow-auto" style={{ maxHeight: "280px" }}>
                        <div className="space-y-3">
                            {messages.map((m, i) => {
                                const isMe = m.autor?.id === currentUserId;
                                return (
                                    <div
                                        key={m.id ?? `${i}-${m.createdAt}`}
                                        className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                                    >
                                        <div
                                            className={`px-3 py-2 rounded-xl ${isMe ? "bg-primary text-primary-foreground" : "bg-muted"
                                                }`}
                                            style={{ maxWidth: "75%" }}
                                        >
                                            <div className="text-sm">{m.contenido}</div>
                                            <div className="text-xs text-muted-foreground mt-1 text-right">
                                                {m.createdAt
                                                    ? new Date(m.createdAt).toLocaleTimeString([], {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })
                                                    : ""}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={bottomRef} />
                        </div>
                    </div>

                    <Separator />

                    <div className="p-3">
                        <div className="flex gap-2">
                            <Input
                                placeholder="Escribe un mensaje..."
                                value={texto}
                                onChange={(e) => setTexto(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                            />
                            <Button size="icon" onClick={handleSend} disabled={sending}>
                                <Send className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
