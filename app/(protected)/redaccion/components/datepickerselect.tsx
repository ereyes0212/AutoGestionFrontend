// app/puestos/NotasDatePickerClient.tsx
"use client";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React from "react";

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

export default function NotasDatePickerClient({ desdeInit, hastaInit }: { desdeInit?: string; hastaInit?: string }) {
    const router = useRouter();
    const pathname = usePathname();
    const sp = useSearchParams();

    // helper para parsear YYYY-MM-DD (lo tratamos como fecha local)
    const parse = (s?: string) => {
        if (!s) return undefined;
        // acepta YYYY-MM-DD o ISO completo
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

    // Si vienen params o props los usamos; si no, por defecto hoy
    const initialDesde = parse(desdeInit ?? sp?.get("desde") ?? undefined) ?? today;
    const initialHasta = parse(hastaInit ?? sp?.get("hasta") ?? undefined) ?? today;

    const [desde, setDesde] = React.useState<Date | undefined>(initialDesde);
    const [hasta, setHasta] = React.useState<Date | undefined>(initialHasta);

    const apply = () => {
        const params = new URLSearchParams();
        if (desde) params.set("desde", formatISODate(desde));
        if (hasta) params.set("hasta", formatISODate(hasta));
        const url = params.toString() ? `${pathname}?${params.toString()}` : pathname;
        router.push(url);
    };

    const clear = () => {
        setDesde(undefined);
        setHasta(undefined);
        router.push(pathname);
    };

    const setToday = () => {
        const h = new Date();
        const hoy = new Date(h.getFullYear(), h.getMonth(), h.getDate());
        setDesde(hoy);
        setHasta(hoy);
        const params = new URLSearchParams();
        params.set("desde", formatISODate(hoy));
        params.set("hasta", formatISODate(hoy));
        router.push(`${pathname}?${params.toString()}`);
    };

    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
            <div className="flex items-center gap-2">
                <label className="text-sm">Desde:</label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Input readOnly value={desde ? displayDate(desde) : ""} placeholder="Selecciona fecha" className="max-w-[180px] cursor-pointer" />
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={desde} onSelect={(d) => setDesde(d ?? undefined)} initialFocus />
                    </PopoverContent>
                </Popover>
            </div>

            <div className="flex items-center gap-2 mt-2 sm:mt-0">
                <label className="text-sm">Hasta:</label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Input readOnly value={hasta ? displayDate(hasta) : ""} placeholder="Selecciona fecha" className="max-w-[180px] cursor-pointer" />
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={hasta} onSelect={(d) => setHasta(d ?? undefined)} initialFocus />
                    </PopoverContent>
                </Popover>
            </div>

            <div className="flex items-center gap-2 mt-3 sm:mt-0">
                <Button onClick={apply}>Aplicar</Button>
                <Button variant="outline" onClick={clear}>Limpiar</Button>
                <Button variant="ghost" onClick={setToday}>Hoy</Button>
            </div>
        </div>
    );
}
