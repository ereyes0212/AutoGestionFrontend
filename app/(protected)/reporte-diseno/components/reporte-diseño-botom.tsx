"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";

/**
 * Botón que solicita la API /api/reporte-diseño (GET) y descarga el PDF generado.
 * Turno fijo: 08:00 -> 02:00 (HN) — coincide con la ruta server que creaste.
 */

function hoyEnHondurasYYYYMMDD(): string {
    // en-CA produce YYYY-MM-DD, y al usar timeZone obtenemos la fecha "hoy" en HN
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Tegucigalpa",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });
    return formatter.format(now); // "YYYY-MM-DD"
}

export default function DownloadReporteTurnoButton() {
    const [loading, setLoading] = useState(false);

    async function handleDownload() {
        setLoading(true);
        try {
            const res = await fetch("/api/reporte-diseno");
            if (!res.ok) {
                // intentar leer JSON de error si viene
                let errText = `Error ${res.status}`;
                try {
                    const j = await res.json();
                    errText = j?.error ?? JSON.stringify(j);
                } catch {
                    // noop
                }
                throw new Error(errText);
            }

            const blob = await res.blob();
            const href = URL.createObjectURL(blob);

            const fecha = hoyEnHondurasYYYYMMDD(); // para que coincida con la fecha usada en server
            const nombreArchivo = `reporte-diseno-${fecha}.pdf`;

            const a = document.createElement("a");
            a.href = href;
            a.download = nombreArchivo;
            document.body.appendChild(a);
            a.click();
            a.remove();
            // liberamos el objeto URL después de un pequeño timeout para asegurar la descarga
            setTimeout(() => URL.revokeObjectURL(href), 1000);
        } catch (err: any) {
            console.error("Error descargando reporte:", err);
            alert("Error generando el reporte: " + (err?.message ?? err));
        } finally {
            setLoading(false);
        }
    }

    return (
        <Button
            onClick={handleDownload}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border"
            aria-busy={loading}
            aria-label="Generar y descargar reporte del día"
        >
            {loading ? "Generando..." : "Generar reporte del día"}
        </Button>
    );
}
