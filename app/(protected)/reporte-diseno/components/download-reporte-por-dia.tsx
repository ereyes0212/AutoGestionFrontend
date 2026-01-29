"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Download } from "lucide-react";
import { useMemo, useState } from "react";

function hoyYYYYMMDD(): string {
  const n = new Date();
  const y = n.getFullYear();
  const m = String(n.getMonth() + 1).padStart(2, "0");
  const d = String(n.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function DownloadReportePorDia() {
  const [loading, setLoading] = useState(false);
  const [fecha, setFecha] = useState<string>(() => hoyYYYYMMDD());
  const [open, setOpen] = useState(false);

  const fechaDate = useMemo(() => {
    const [y, m, d] = fecha.split("-").map(Number);
    return new Date(y, m - 1, d);
  }, [fecha]);

  const fechaLabel = useMemo(
    () =>
      fechaDate.toLocaleDateString("es-ES", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    [fechaDate]
  );

  async function handleDownload() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/reporte-diseno?fecha=${encodeURIComponent(fecha)}`
      );
      if (!res.ok) {
        let errText = `Error ${res.status}`;
        try {
          const j = await res.json();
          errText = j?.error ?? JSON.stringify(j);
        } catch {
          /* noop */
        }
        throw new Error(errText);
      }
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = `reporte-diseno-${fecha}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(href), 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Error descargando reporte:", err);
      alert("Error generando el reporte: " + msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Download className="h-4 w-4" />
          Descargar reportes por día
        </CardTitle>
        <CardDescription>
          Elige un día. Se incluyen los reportes desde las 8:00 AM de ese día
          hasta las 5:00 AM del día siguiente (ej. lunes 8:00 → martes 5:00).
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col sm:flex-row gap-3">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full sm:min-w-[240px] sm:w-auto justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              <span className="truncate">{fechaLabel}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={fechaDate}
              onSelect={(d) => {
                if (!d) return;
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, "0");
                const day = String(d.getDate()).padStart(2, "0");
                setFecha(`${y}-${m}-${day}`);
                setOpen(false);
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        <Button
          onClick={handleDownload}
          disabled={loading}
          className="shrink-0"
          aria-busy={loading}
        >
          {loading ? "Generando…" : "Descargar PDF"}
        </Button>
      </CardContent>
    </Card>
  );
}
