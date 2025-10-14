"use client";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function DownloadExcelButton() {
    const [loading, setLoading] = useState(false);

    async function handleDownload() {
        setLoading(true);
        try {
            const res = await fetch("/api/export-finalizadas");
            if (!res.ok) throw new Error("Error descargando Excel");

            const blob = await res.blob();
            const href = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = href;
            a.download = "notas-finalizadas.pdf";
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
            {loading ? "Generando..." : "Exportar notas"}
        </Button>
    );
}
