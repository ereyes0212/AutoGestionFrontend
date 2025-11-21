"use client";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useState } from "react";

// Helper para formatear fecha como YYYY-MM-DD sin problemas de zona horaria
function formatISODate(d: Date): string {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

export default function DownloadPDFButton() {
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

    async function handleDownload() {
        if (!selectedDate) return;

        setLoading(true);
        try {
            // Formatear fecha como YYYY-MM-DD usando método local (sin zona horaria)
            const fechaStr = formatISODate(selectedDate);
            const res = await fetch(`/api/export-finalizadas-completo?fecha=${fechaStr}`);
            if (!res.ok) throw new Error("Error descargando PDF");

            const blob = await res.blob();
            const href = URL.createObjectURL(blob);

            const nombreArchivo = `notas-finalizadas-${fechaStr}.pdf`;

            const a = document.createElement("a");
            a.href = href;
            a.download = nombreArchivo;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(href);

            setOpen(false);
            setSelectedDate(undefined);
        } catch (error) {
            console.error("Error al descargar PDF:", error);
            alert("Error al generar el PDF. Por favor, intenta nuevamente.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <Button
                onClick={() => setOpen(true)}
                disabled={loading}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border"
            >
                {loading ? "Generando..." : "Exportar notas PDF"}
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Seleccionar fecha del reporte</DialogTitle>
                        <DialogDescription>
                            Elige el día para el cual deseas generar el reporte de notas finalizadas.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-center py-4">
                        <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            locale={es}
                            className="rounded-md border"
                            initialFocus
                        />
                    </div>
                    {selectedDate && (
                        <p className="text-sm text-muted-foreground text-center">
                            Fecha seleccionada: {format(selectedDate, "PPP", { locale: es })}
                        </p>
                    )}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setOpen(false);
                                setSelectedDate(undefined);
                            }}
                            disabled={loading}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleDownload}
                            disabled={loading || !selectedDate}
                        >
                            {loading ? "Generando..." : "Descargar PDF"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
