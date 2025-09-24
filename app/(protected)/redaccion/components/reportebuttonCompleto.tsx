"use client";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function DownloadPDFButton() {
    const [loading, setLoading] = useState(false);

    async function handleDownload() {
        setLoading(true);
        try {
            const res = await fetch("/api/export-finalizadas-completo");
            if (!res.ok) throw new Error("Error descargando Excel");

            const blob = await res.blob();
            const href = URL.createObjectURL(blob);

            const fecha = new Date().toISOString().split("T")[0]; // yyyy-mm-dd
            const nombreArchivo = `notas-finalizadas-${fecha}.pdf`;

            const a = document.createElement("a");
            a.href = href;
            a.download = nombreArchivo;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(href);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Button
            onClick={handleDownload}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border"
        >
            {loading ? "Generando..." : "Exportar notas agrupadas PDF"}
        </Button>
    );
}
