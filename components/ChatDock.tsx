"use client";
import { getChatsForUser } from "@/app/(protected)/mensajes/actions";
import { Mail } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import ChatBox from "./ChatBox";

// Actions

type OpenChatItem = {
    id: string;
    nombre?: string | null;
    tipo?: string;
    lastMessage?: any;
};

export default function ChatDock({ currentUserId }: { currentUserId: string }) {
    const [openChats, setOpenChats] = useState<OpenChatItem[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [allChats, setAllChats] = useState<OpenChatItem[]>([]);

    // abrir/traer al frente
    const openChat = useCallback((payload: OpenChatItem) => {
        setOpenChats((prev) => {
            if (prev.some((p) => p.id === payload.id)) {
                const updated = prev.map((p) => (p.id === payload.id ? { ...p, ...payload } : p));
                const filtered = updated.filter((p) => p.id !== payload.id);
                return [...filtered, { ...payload }];
            }
            return [...prev, payload];
        });
        setActiveId(payload.id);
    }, []);

    const closeChat = useCallback((id: string) => {
        setOpenChats((prev) => prev.filter((p) => p.id !== id));
        setActiveId((cur) => (cur === id ? null : cur));
    }, []);

    // cargar chats iniciales usando action
    useEffect(() => {
        if (!currentUserId) return;

        const fetchChats = async () => {
            try {
                const chats = await getChatsForUser(currentUserId);
                const formatted: OpenChatItem[] = chats.map((c) => ({
                    id: c.id,
                    nombre: c.nombre,
                    tipo: c.tipo,
                    lastMessage: c.lastMessage
                        ? {
                            id: c.lastMessage.id,
                            contenido: c.lastMessage.contenido,
                            createdAt: c.lastMessage.createdAt,
                            autor: c.lastMessage.autorUsuario
                                ? { id: c.lastMessage.autorId, usuario: c.lastMessage.autorUsuario }
                                : undefined,
                        }
                        : null,
                }));
                setAllChats(formatted);
            } catch (err) {
                console.error("Error cargando chats:", err);
            }
        };

        fetchChats();
    }, [currentUserId]);

    // listener global 'open-chat' disparado por SocketNotifier o botones
    useEffect(() => {
        const handler = (e: any) => {
            const d = e?.detail;
            if (!d || !d.id) return;
            openChat({ id: d.id, nombre: d.nombre, tipo: d.tipo, lastMessage: d.lastMessage });
        };
        window.addEventListener("open-chat", handler as EventListener);
        return () => window.removeEventListener("open-chat", handler as EventListener);
    }, [openChat]);

    if (openChats.length === 0) return null;

    // Limitar número de ChatBoxes visibles (ej: 3)
    const visible = openChats.slice(-3);

    return (
        <div className="fixed bottom-4 right-4 z-50 flex items-end gap-3">
            {/* si hay más chats que mostrar, botón que indica +N */}
            {openChats.length > visible.length && (
                <div className="flex flex-col items-center">
                    <div className="bg-white border rounded-full w-10 h-10 flex items-center justify-center shadow">
                        <Mail />
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">+{openChats.length - visible.length}</div>
                </div>
            )}

            {visible.map((c) => (
                <div key={c.id} className={`transform transition-all ${activeId === c.id ? "scale-100" : "scale-95"}`}>
                    <ChatBox
                        conversacionId={c.id}
                        nombre={c.nombre}
                        tipo={c.tipo}
                        initialLastMessage={c.lastMessage ?? null}
                        currentUserId={currentUserId}
                        onClose={() => closeChat(c.id)}
                    />
                </div>
            ))}
        </div>
    );
}
