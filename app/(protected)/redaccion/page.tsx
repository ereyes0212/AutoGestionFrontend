"use client";
import React from "react";
import { columns } from "./components/columns";
import { DataTable } from "./components/data-table";
import { Nota } from "./types";

interface Props {
    initialNotas: Nota[];
}

export default function NotasRealtimeWrapper({ initialNotas }: Props) {
    const [notas, setNotas] = React.useState<Nota[]>(() => {
        // inicial: clonar y ordenar descendente por createAt
        return [...initialNotas].sort((a, b) => new Date(b.createAt!).getTime() - new Date(a.createAt!).getTime());
    });

    // Si querés agregar createAtLocal para mostrar HN:
    const notasConLocal = React.useMemo(() => {
        return notas.map((n) => ({
            ...n,
            createAtLocal: new Date(n.createAt!).toLocaleString("es-HN", {
                timeZone: "America/Tegucigalpa",
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
            }),
        }));
    }, [notas]);

    React.useEffect(() => {
        // ejemplo SSE: adaptalo a tu implementación real
        const evtSource = new EventSource("/api/sse/notas"); // o la ruta que uses

        evtSource.addEventListener("nota_creada", (ev: any) => {
            try {
                const payload = JSON.parse(ev.data);
                const nuevaNota: Nota = payload.nota;

                setNotas((prev) => {
                    // insertamos y mantenemos orden descendente por createAt
                    const merged = [nuevaNota, ...prev];
                    merged.sort((a, b) => new Date(b.createAt!).getTime() - new Date(a.createAt!).getTime());
                    return merged;
                });
            } catch (err) {
                console.error("SSE nota_creada parse error", err);
            }
        });

        // cleanup
        return () => {
            evtSource.close();
        };
    }, []);

    return <DataTable columns={columns} data={notasConLocal} />;
}
