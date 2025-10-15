// components/SocketNotifier.tsx
"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
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
    const { toast } = useToast();
    const router = useRouter();
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        audioRef.current = new Audio(
            "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA="
        );
        try { audioRef.current.volume = 0.6; } catch { }
    }, []);

    useEffect(() => {
        if (!socket) return;

        const handleMessage = (m: any) => {
            console.log("SocketNotifier received message:", m);
            try {
                const autorId = m?.autor?.id ?? m?.autorId ?? null;
                const conversacionId = m?.conversacionId ?? m?.conversacion?.id ?? null;
                const contenido = typeof m?.contenido === "string" ? m.contenido : "Nuevo mensaje";

                if (!autorId || autorId === currentUserId) return;

                if (getActiveConversationId && conversacionId) {
                    const active = getActiveConversationId();
                    if (active && active === conversacionId) return;
                }

                try { audioRef.current?.play().catch(() => { }); } catch { }

                const preview = contenido.length > 120 ? contenido.slice(0, 120) + "…" : contenido;
                const title = m?.autor?.usuario ?? "Nuevo mensaje";

                toast({
                    title,
                    description: preview,
                    action: (
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                                if (onNotifyClick) onNotifyClick(conversacionId ?? null);
                                if (conversacionId) router.push(`/mensajes/${conversacionId}/mensaje`);
                            }}
                        >
                            Abrir
                        </Button>
                    ),
                    duration: 6000,
                });
            } catch (err) {
                // keep silent
                // eslint-disable-next-line no-console
                console.error("SocketNotifier error:", err);
            }
        };

        socket.on("message", handleMessage);
        return () => {
            try { socket.off("message", handleMessage); } catch { }
        };
    }, [socket, currentUserId, getActiveConversationId, onNotifyClick, router, toast]);

    return null;
}
