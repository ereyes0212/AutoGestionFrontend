"use client";

import { useEffect, useRef, useState } from "react";
import { Nota } from "../types";
import { columns } from "./columns";
import { DataTable } from "./data-table";
import NotaListMobile from "./puesto-list-mobile";

export default function NotasRealtimeWrapper({ initialNotas, desde, hasta }: { initialNotas: Nota[]; desde?: string | null; hasta?: string | null; }) {
    const [notas, setNotas] = useState<Nota[]>(initialNotas ?? []);
    const esRef = useRef<EventSource | null>(null);
    const reconnectRef = useRef(0);

    // Referencia al audio
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Creamos el audio (puede ser cualquier .mp3/.wav en public/)
        audioRef.current = new Audio("/sounds/notification.mp3");

        const connect = () => {
            if (esRef.current) esRef.current.close();
            const es = new EventSource("/api/notes/stream");
            esRef.current = es;

            es.onopen = () => {
                console.log("[SSE] conectado");
                reconnectRef.current = 0;
            };

            es.onmessage = (e) => {
                try {
                    const payload = JSON.parse(e.data);
                    const nota: Nota = payload.nota ?? payload;

                    setNotas(prev => {
                        if (prev.some(n => String(n.id) === String(nota.id))) {
                            return prev.map(p => String(p.id) === String(nota.id) ? { ...p, ...nota } : p);
                        }
                        return [nota, ...prev];
                    });

                    // ✅ Reproducir tono si es evento nuevo
                    if (audioRef.current) {
                        audioRef.current.currentTime = 0;
                        audioRef.current.play().catch(() => { });
                    }
                } catch (err) {
                    console.error("[SSE] parse error", err);
                }
            };

            es.onerror = (err) => {
                console.error("[SSE] error", err);
                if (esRef.current) {
                    esRef.current.close();
                    esRef.current = null;
                }
                reconnectRef.current++;
                const delay = Math.min(30000, 1000 * 2 ** reconnectRef.current);
                setTimeout(connect, delay);
            };
        };

        connect();
        return () => {
            if (esRef.current) {
                esRef.current.close();
                esRef.current = null;
            }
        };
    }, []);

    return (
        <>
            <div className="hidden md:block">
                <DataTable columns={columns} data={notas} />
            </div>
            <div className="block md:hidden">
                <NotaListMobile notas={notas} />
            </div>
        </>
    );
}
