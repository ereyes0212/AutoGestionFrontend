"use client";
import { sendMessage, traerMensajes } from "@/app/(protected)/mensajes/actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import useSocket from "@/hooks/useSocket";
import { Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";

// Actions

type MiniMensaje = {
    id?: string;
    contenido: string;
    createdAt?: string;
    autor?: { id?: string; usuario?: string };
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
    const { socketRef, connected } = useSocket();
    const socket = socketRef?.current;
    const [open, setOpen] = useState(true);
    const [messages, setMessages] = useState<MiniMensaje[]>(initialLastMessage ? [initialLastMessage] : []);
    const [texto, setTexto] = useState("");
    const bottomRef = useRef<HTMLDivElement | null>(null);
    const [sending, setSending] = useState(false);

    // Cargar mensajes históricos usando action
    useEffect(() => {
        if (!conversacionId || !currentUserId) return;

        traerMensajes(conversacionId, currentUserId).then(({ mensajes }) => {
            const formatted = mensajes.map((m: any) => ({
                id: m.id,
                contenido: m.contenido,
                createdAt: m.createdAt ? new Date(m.createdAt).toISOString() : undefined,
                autor: m.autor ? { id: m.autor.id, usuario: m.autor.usuario } : undefined,
            }));
            setMessages(formatted.slice(-20));
        });
    }, [conversacionId, currentUserId]);

    useEffect(() => {
        if (bottomRef.current) {
            setTimeout(() => {
                try { bottomRef.current!.scrollIntoView({ behavior: "smooth", block: "end" }); } catch { }
            }, 30);
        }
    }, [messages]);

    useEffect(() => {
        if (!socket) return;

        const handler = (m: any) => {
            try {
                const convId = m.conversacionId ?? m.conversacion?.id ?? null;
                if (!convId || convId !== conversacionId) return;
                setMessages((prev) => {
                    if (m.id && prev.some((p) => p.id === m.id)) return prev;
                    const nm: MiniMensaje = {
                        id: m.id,
                        contenido: m.contenido,
                        createdAt: m.createdAt ? new Date(m.createdAt).toISOString() : new Date().toISOString(),
                        autor: m.autor ?? undefined,
                    };
                    return [...prev, nm];
                });
            } catch (err) {
                console.error("ChatBox handler error", err);
            }
        };

        socket.on("message", handler);
        return () => {
            try { socket.off("message", handler); } catch { }
        };
    }, [socket, conversacionId]);

    const handleSend = async () => {
        if (!texto || !texto.trim()) return;

        setSending(true);
        const contenido = texto.trim();

        // local optimistic message
        const tempId = `temp-${Math.random().toString(36).slice(2, 9)}`;
        const optimistic: MiniMensaje = {
            id: tempId,
            contenido,
            createdAt: new Date().toISOString(),
            autor: { id: undefined, usuario: "Tú" },
        };
        setMessages((prev) => [...prev, optimistic]);
        setTexto("");

        try {
            // Usar action directamente
            const mensaje = await sendMessage(conversacionId, currentUserId, contenido, []);
            setMessages((prev) =>
                prev.map((x) =>
                    x.id === tempId
                        ? { id: mensaje.id, contenido: mensaje.contenido, createdAt: mensaje.createdAt?.toISOString(), autor: mensaje.autor }
                        : x
                )
            );

            // Emitir por socket si está conectado
            if (socket && connected) {
                socket.emit("send_message", { conversacionId, contenido, attachments: [] });
            }
        } catch (err) {
            console.error("Error enviando mensaje:", err);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="w-[340px] max-w-[95vw] bg-background shadow-lg rounded-t-xl border overflow-hidden flex flex-col">
            {/* header */}
            <div className="flex items-center justify-between px-3 py-2 border-b">
                <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="w-9 h-9">
                        <AvatarFallback>{(nombre ?? "G").charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{nombre ?? (tipo === "GROUP" ? "Grupo" : "Chat")}</div>
                        <div className="text-xs text-muted-foreground"> {tipo ?? ""} </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => { setOpen(false); onClose(); }}>
                        Cerrar
                    </Button>
                </div>
            </div>

            {/* messages */}
            <div className="p-3 flex-1 overflow-auto" style={{ maxHeight: "280px" }}>
                <div className="space-y-3">
                    {messages.map((m, i) => {
                        const isMe = m.autor?.usuario === "Tú" || m.autor?.id === undefined;
                        return (
                            <div key={m.id ?? `${i}-${m.createdAt}`} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                                <div className={`px-3 py-2 rounded-xl ${isMe ? "bg-primary text-primary-foreground" : "bg-muted"}`} style={{ maxWidth: "75%" }}>
                                    <div className="text-sm">{m.contenido}</div>
                                    <div className="text-xs text-muted-foreground mt-1 text-right">{m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}</div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={bottomRef} />
                </div>
            </div>

            <Separator />

            {/* input */}
            <div className="p-3">
                <div className="flex gap-2">
                    <Input placeholder="Escribe un mensaje..." value={texto} onChange={(e) => setTexto(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSend(); } }} />
                    <Button size="icon" onClick={handleSend} disabled={sending}>
                        <Send className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
