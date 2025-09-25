"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getNotas } from "../actions"; // <-- tu server action
import { Nota } from "../types";
import { columns } from "./columns";
import { DataTable } from "./data-table";
import NotaListMobile from "./puesto-list-mobile";

export default function NotasRealtimeWrapper({ initialNotas }: { initialNotas: Nota[] }) {
    const searchParams = useSearchParams();
    const desde = searchParams.get("desde");
    const hasta = searchParams.get("hasta");

    const [notas, setNotas] = useState<Nota[]>(initialNotas ?? []);
    const esRef = useRef<EventSource | null>(null);
    const reconnectRef = useRef(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // 🔄 recarga cuando cambian los params
    useEffect(() => {
        (async () => {
            try {
                const data = await getNotas(desde!, hasta!); // llamamos server action directamente
                setNotas(data);
            } catch (err) {
                console.error("Error cargando notas", err);
            }
        })();
    }, [desde, hasta]);

    // SSE
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
                    const payload = JSON.parse(e.data);
                    const nota: Nota = payload.nota ?? payload;

                    const createdAt = new Date(nota.createAt!);
                    const from = desde ? new Date(desde) : null;
                    const to = hasta ? new Date(hasta) : null;

                    if ((!from || createdAt >= from) && (!to || createdAt <= to)) {
                        setNotas((prev) => {
                            if (prev.some((n) => String(n.id) === String(nota.id))) {
                                return prev.map((p) =>
                                    String(p.id) === String(nota.id) ? { ...p, ...nota } : p
                                );
                            }
                            return [nota, ...prev];
                        });

                        if (audioRef.current) {
                            audioRef.current.currentTime = 0;
                            audioRef.current.play().catch(() => { });
                        }
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
    }, [desde, hasta]);

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
