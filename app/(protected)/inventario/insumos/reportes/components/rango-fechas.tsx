"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import { DateRange } from "react-day-picker";

/** YYYY-MM-DD tratado siempre como fecha local */
function formatISODate(d?: Date) {
  if (!d) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function parseISODate(valor?: string) {
  if (!valor) return undefined;
  const m = valor.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return undefined;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

function displayDate(d?: Date) {
  return d ? d.toLocaleDateString() : "";
}

function displayRange(range?: DateRange) {
  if (!range?.from && !range?.to) return "";
  const desde = displayDate(range?.from);
  const hasta = displayDate(range?.to);
  if (desde && hasta) return `${desde} — ${hasta}`;
  return desde || hasta;
}

interface RangoFechasProps {
  desde: string;
  hasta: string;
  onChange: (desde: string, hasta: string) => void;
  placeholder?: string;
}

/**
 * Selector de rango de fechas con el calendario de shadcn, el mismo que se
 * usa en Redacción. Devuelve las fechas en formato YYYY-MM-DD.
 */
export default function RangoFechas({
  desde,
  hasta,
  onChange,
  placeholder = "Todas las fechas",
}: RangoFechasProps) {
  const [abierto, setAbierto] = useState(false);

  const range: DateRange | undefined =
    desde || hasta ? { from: parseISODate(desde), to: parseISODate(hasta) } : undefined;

  const seleccionar = (nuevo: DateRange | undefined) => {
    onChange(formatISODate(nuevo?.from), formatISODate(nuevo?.to));
  };

  const limpiar = () => {
    onChange("", "");
  };

  const hoy = () => {
    const fecha = formatISODate(new Date());
    onChange(fecha, fecha);
  };

  return (
    <Popover open={abierto} onOpenChange={setAbierto}>
      <PopoverTrigger asChild>
        <div className="relative cursor-pointer select-none">
          <Input
            readOnly
            value={displayRange(range)}
            placeholder={placeholder}
            className="cursor-pointer pr-9"
          />
          <CalendarIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-2">
          <Calendar mode="range" selected={range} onSelect={seleccionar} initialFocus />
          <div className="mt-2 flex justify-end gap-2 border-t pt-2">
            <Button size="sm" variant="outline" onClick={limpiar}>
              Limpiar
            </Button>
            <Button size="sm" variant="ghost" onClick={hoy}>
              Hoy
            </Button>
            <Button size="sm" onClick={() => setAbierto(false)}>
              Listo
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
