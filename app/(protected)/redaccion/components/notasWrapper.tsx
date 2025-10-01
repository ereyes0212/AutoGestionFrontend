"use client";

import { useEffect, useRef, useState } from "react";
import { Nota } from "../types";
import { columns } from "./columns";
import { DataTable } from "./data-table";
import NotaListMobile from "./puesto-list-mobile";

interface Props {
    initialNotas: Nota[];
    desde?: string | null;
    hasta?: string | null;
}

export default function NotasRealtimeWrapper({ initialNotas, desde, hasta }: Props) {
    const [notas, setNotas] = useState<Nota[]>(initialNotas ?? []);
    const esRef = useRef<EventSource | null>(null);
    const reconnectRef = useRef(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // refs para mantener filtros actualizados dentro de SSE
    const desdeRef = useRef<string | undefined>(desde ?? undefined);
    const hastaRef = useRef<string | undefined>(hasta ?? undefined);

    // Actualizar refs cuando cambian los props
    useEffect(() => {
        desdeRef.current = desde ?? undefined;
        hastaRef.current = hasta ?? undefined;

        // Filtrar notas iniciales según datepicker
        const from = desde ? new Date(`${desde}T00:00:00`) : null;
        const to = hasta ? new Date(`${hasta}T23:59:59`) : null;

        setNotas(
            initialNotas.filter((nota) => {
                const createdAt = nota.createAt ? new Date(nota.createAt) : null;
                return !createdAt || (!from || createdAt >= from) && (!to || createdAt <= to);
            })
        );
    }, [desde, hasta, initialNotas]);

    useEffect(() => {
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
                    if (!e.data || e.data.startsWith(":")) return; // heartbeat
                    const payload = JSON.parse(e.data);
                    const nota: Nota = payload.nota ?? payload;

                    // Normalizar createdAt
                    const createdAt = nota.createAt ? new Date(nota.createAt) : null;

                    // Tomar filtros actuales
                    let from: Date | null = null;
                    let to: Date | null = null;
                    if (desdeRef.current) {
                        const d = new Date(desdeRef.current);
                        if (!isNaN(d.getTime())) from = new Date(`${d.toISOString().split("T")[0]}T00:00:00`);
                    }
                    if (hastaRef.current) {
                        const d = new Date(hastaRef.current);
                        if (!isNaN(d.getTime())) to = new Date(`${d.toISOString().split("T")[0]}T23:59:59`);
                    }

                    // Filtrar nota según datepicker
                    const passesFilter =
                        !createdAt || ((!from || createdAt >= from) && (!to || createdAt <= to));
                    if (!passesFilter) return;

                    // Actualizar estado
                    setNotas((prev) => {
                        if (prev.some((n) => String(n.id) === String(nota.id))) {
                            return prev.map((p) =>
                                String(p.id) === String(nota.id) ? { ...p, ...nota } : p
                            );
                        }
                        return [nota, ...prev];
                    });

                    // Reproducir audio
                    if (audioRef.current) {
                        audioRef.current.currentTime = 0;
                        audioRef.current.play().catch(() => { });
                    }
                } catch (err) {
                    console.error("[SSE] error procesando nota:", err);
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
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
                audioRef.current = null;
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
