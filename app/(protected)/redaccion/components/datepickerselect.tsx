// app/puestos/NotasDatePickerClient.tsx
"use client";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React from "react";
import { DateRange } from "react-day-picker";

function formatISODate(d?: Date) {
    if (!d) return "";
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}
function displayDate(d?: Date) {
    if (!d) return "";
    return d.toLocaleDateString();
}
function displayRange(range?: { from?: Date; to?: Date }) {
    if (!range) return "";
    const f = range.from ? displayDate(range.from) : "";
    const t = range.to ? displayDate(range.to) : "";
    if (f && t) return `${f} — ${t}`;
    return f || t || "";
}

export default function NotasDatePickerClient({
    desdeInit,
    hastaInit,
}: {
    desdeInit?: string;
    hastaInit?: string;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const sp = useSearchParams();
    // helper para parsear YYYY-MM-DD (lo tratamos como fecha local)
    const parse = (s?: string) => {
        if (!s) return undefined;
        const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (m) {
            return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
        }
        const d = new Date(s);
        return isNaN(d.getTime()) ? undefined : new Date(d.getFullYear(), d.getMonth(), d.getDate());
    };

    // hoy (sin hora)
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // inicializamos range desde query / props; si no hay, por defecto hoy-hoy
    const initialFrom = parse(desdeInit ?? sp?.get("desde") ?? undefined) ?? today;
    const initialTo = parse(hastaInit ?? sp?.get("hasta") ?? undefined) ?? today;

    const [range, setRange] = React.useState<DateRange>({
        from: initialFrom,
        to: initialTo,
    });

    const apply = () => {
        const params = new URLSearchParams();
        if (range.from) params.set("desde", formatISODate(range.from));
        if (range.to) params.set("hasta", formatISODate(range.to));
        const url = params.toString() ? `${pathname}?${params.toString()}` : pathname;
        router.push(url);
        router.refresh(); // forzamos refresh para que el server component recargue datos
    };

    const resetToToday = () => {
        const hoy = new Date(today);
        setRange({ from: hoy, to: hoy });
        const params = new URLSearchParams();
        params.set("desde", formatISODate(hoy));
        params.set("hasta", formatISODate(hoy));
        router.push(`${pathname}?${params.toString()}`);
    };

    const clear = () => {
        // Comportamiento: dejamos hoy — hoy (si prefieres que clear quite filtros y deje vacío, lo cambio)
        resetToToday();
    };


    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
            <Popover>
                <PopoverTrigger asChild>
                    <div className="flex items-center gap-2 cursor-pointer select-none">
                        <Input
                            readOnly
                            value={displayRange(range)}
                            placeholder="Selecciona rango"
                            className="max-w-[300px] cursor-pointer"
                        />
                    </div>
                </PopoverTrigger>

                <PopoverContent className="w-auto p-0">
                    <div className="p-2">
                        <Calendar
                            mode="range"
                            selected={range}
                            onSelect={(r: DateRange | undefined) => setRange(r ?? { from: today, to: today })}
                            initialFocus
                        />
                        <div className="mt-2 flex justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={clear}>
                                Limpiar
                            </Button>
                            <Button size="sm" variant="ghost" onClick={resetToToday}>
                                Hoy
                            </Button>
                            <Button size="sm" onClick={apply}>
                                Aplicar
                            </Button>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}
