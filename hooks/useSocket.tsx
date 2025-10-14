// hooks/useSocket.tsx
"use client";
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

export default function useSocket() {
    const socketRef = useRef<Socket | null>(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                // 1) Inicializar la instancia server-side (idempotente)
                await fetch("/api/socketio");

                // 2) Obtener token para conectar
                const tokenRes = await fetch("/api/socket-token");
                if (!tokenRes.ok) {
                    console.warn("No se obtuvo token para socket:", await tokenRes.text());
                    return;
                }
                const { token } = await tokenRes.json();

                // 3) Conectar al mismo origin (si usás otro host, pon NEXT_PUBLIC_SOCKET_URL)
                const socket = io(window.location.origin, {
                    path: '/api/socketio',      // <-- coincide con el server (o '/socket.io' si elegís eso)
                    auth: { token },
                    transports: ['polling', 'websocket'], // polling first, then upgrade
                    autoConnect: true,
                    withCredentials: true,
                });

                socketRef.current = socket;

                socket.on("connect", () => {
                    if (!mounted) return;
                    setConnected(true);
                    console.debug("socket connected", socket.id);
                });

                socket.on("disconnect", () => {
                    setConnected(false);
                    console.debug("socket disconnected");
                });

                socket.on("connect_error", (err: any) => {
                    console.error("socket connect_error:", err);
                });
            } catch (err) {
                console.error("useSocket init error:", err);
            }
        })();

        return () => {
            mounted = false;
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, []);

    return { socketRef, connected };
}
