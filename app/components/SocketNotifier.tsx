// components/SocketNotifier.tsx
"use client";

import useSocket from "@/hooks/useSocket";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export default function SocketNotifier({
    currentUserId,
    getActiveConversationId,
    onNotifyClick,
}: {
    currentUserId: string;
    getActiveConversationId?: () => string | null;
    onNotifyClick?: (conversacionId: string | null) => void;
}) {
    const { socketRef } = useSocket();
    const socket = socketRef?.current;
    const router = useRouter();
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // pequeño beep en data URI
        audioRef.current = new Audio(
            "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA="
        );
        try { audioRef.current.volume = 0.6; } catch { /* ignore */ }
    }, []);

    useEffect(() => {
        if (!socket) return;

        const handleMessage = (m: any) => {
            console.debug("SocketNotifier received message:", m);

            try {
                const autorId = m?.autor?.id ?? m?.autorId ?? null;
                const conversacionId = m?.conversacionId ?? m?.conversacion?.id ?? null;
                const contenido = typeof m?.contenido === "string" ? m.contenido : "Nuevo mensaje";

                // si es nuestro propio mensaje, ignorar
                if (!autorId || autorId === currentUserId) {
                    console.debug("Ignorando mensaje propio o sin autor:", autorId);
                    return;
                }

                // si estamos viendo esa conversación y getActiveConversationId lo indica, no notificar
                if (getActiveConversationId && conversacionId) {
                    const active = getActiveConversationId();
                    if (active && active === conversacionId) {
                        console.debug("Usuario ya está en la conversación activa, no notificar:", conversacionId);
                        return;
                    }
                }

                // reproducir sonido (silencioso si falla)
                try { audioRef.current?.play().catch(() => { }); } catch { /* ignore */ }

                // Disparar evento global para que ChatDock abra la ChatBox
                try {
                    const detail = {
                        id: conversacionId ?? null,
                        nombre: m?.conversacion?.nombre ?? m?.grupoNombre ?? null,
                        tipo: m?.conversacion?.tipo ?? m?.tipo ?? (m?.conversacion ? "GROUP" : "PRIVATE"),
                        lastMessage: {
                            id: m.id ?? null,
                            contenido,
                            autor: m.autor ?? null,
                            createdAt: m.createdAt ?? new Date().toISOString(),
                        },
                    };
                    window.dispatchEvent(new CustomEvent("open-chat", { detail }));
                    console.debug("Dispatched open-chat:", detail);
                } catch (err) {
                    console.error("Error dispatching open-chat:", err);
                }

            } catch (err) {
                console.error("SocketNotifier error:", err);
            }
        };

        socket.on("message", handleMessage);
        return () => {
            try { socket.off("message", handleMessage); } catch { /* ignore */ }
        };
    }, [socket, currentUserId, getActiveConversationId, onNotifyClick, router]);

    return null;
}
