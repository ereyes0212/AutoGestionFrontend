"use client";
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

export default function useSocket() {
    const socketRef = useRef<Socket | null>(null);
    const [connected, setConnected] = useState(false);
    const [lastError, setLastError] = useState<any>(null);

    useEffect(() => {
        let mounted = true;

        (async () => {
            try {
                // 1) Inicializar pages/api/socketio (idempotente)
                await fetch("/api/socketio").catch((e) => {
                    // no romper si falla aquí, seguiremos intentando con token
                    console.warn("init /api/socketio fallo (no crítico):", e);
                });

                // 2) Pedir token
                const tokenRes = await fetch("/api/socket-token");
                if (!tokenRes.ok) {
                    const txt = await tokenRes.text().catch(() => null);
                    throw new Error("No auth token: " + (txt ?? tokenRes.status));
                }
                const { token } = await tokenRes.json();

                if (!mounted) return;

                // 3) Conectar socket.io al mismo origen
                const socket = io(undefined, {
                    auth: { token },
                    transports: ["websocket", "polling"],
                });

                socketRef.current = socket;

                socket.on("connect", () => {
                    if (!mounted) return;
                    setConnected(true);
                    setLastError(null);
                    console.log("[useSocket] connected", socket.id);
                });

                socket.on("disconnect", (reason: any) => {
                    if (!mounted) return;
                    setConnected(false);
                    console.log("[useSocket] disconnected", reason);
                });

                socket.on("connect_error", (err: any) => {
                    console.error("[useSocket] connect_error", err);
                    setLastError(err);
                });

            } catch (err) {
                console.error("useSocket init error:", err);
                setLastError(err);
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

    return { socket: socketRef.current, connected, lastError };
}
