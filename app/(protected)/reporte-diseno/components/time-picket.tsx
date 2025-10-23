/* eslint-disable prefer-const */
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import React from "react";

type TimePickerProps = {
    value?: string | null; // espera "HH:MM:SS" o "HH:MM" o empty
    onChange: (value: string) => void;
    onBlur?: () => void;
    id?: string;
    className?: string;
    withSeconds?: boolean;
    minuteStep?: number; // por defecto 1, podes pasar 5
};

const pad = (n: number) => String(n).padStart(2, "0");

function parseToParts(value?: string | null, withSeconds = true) {
    if (!value) {
        return { hour12: 12, minute: 0, second: 0, ampm: "AM" };
    }
    const parts = value.split(":").map((p) => parseInt(p, 10) || 0);
    let hh = parts[0] ?? 0;
    const mm = parts[1] ?? 0;
    const ss = parts[2] ?? 0;

    const ampm = hh >= 12 ? "PM" : "AM";
    let hour12 = hh % 12;
    if (hour12 === 0) hour12 = 12;

    return { hour12, minute: mm, second: ss, ampm };
}

export function TimePicker({
    value,
    onChange,
    onBlur,
    id,
    className,
    withSeconds = false,
    minuteStep = 1,
}: TimePickerProps) {
    const initial = parseToParts(value, withSeconds);
    const [hour, setHour] = React.useState<number>(initial.hour12);
    const [minute, setMinute] = React.useState<number>(initial.minute);
    const [second, setSecond] = React.useState<number>(initial.second);
    const [ampm, setAmpm] = React.useState<"AM" | "PM">(initial.ampm as "AM" | "PM");

    // Sync cuando value externo cambie (ej. reset)
    React.useEffect(() => {
        const p = parseToParts(value, withSeconds);
        setHour(p.hour12);
        setMinute(p.minute);
        setSecond(p.second);
        setAmpm(p.ampm as "AM" | "PM");
    }, [value, withSeconds]);

    const emit = React.useCallback(
        (h12: number, m: number, s: number, am: "AM" | "PM") => {
            let h24 = h12 % 12;
            if (am === "PM") h24 = h24 + 12;
            const out = `${pad(h24)}:${pad(m)}:${pad(s)}`;
            onChange(out);
        },
        [onChange]
    );

    React.useEffect(() => {
        emit(hour, minute, second, ampm);
    }, [hour, minute, second, ampm, emit]);

    // arrays de opciones
    const hours = Array.from({ length: 12 }, (_, i) => i + 1);
    const minutes = Array.from(
        { length: Math.ceil(60 / Math.max(1, minuteStep)) },
        (_, i) => i * Math.max(1, minuteStep)
    );
    const seconds = Array.from({ length: 60 }, (_, i) => i);

    return (
        <div id={id} className={`flex gap-2 items-center ${className ?? ""}`}>
            {/* Hour */}
            <div className="w-24">
                <Select
                    value={String(hour)}
                    onValueChange={(v) => {
                        setHour(Number(v));
                    }}
                >
                    <SelectTrigger className="h-10">
                        <SelectValue placeholder="HH" />
                    </SelectTrigger>
                    <SelectContent>
                        {hours.map((h) => (
                            <SelectItem key={h} value={String(h)}>
                                {h}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <span className="text-sm select-none">:</span>

            {/* Minute */}
            <div className="w-24">
                <Select
                    value={String(minute)}
                    onValueChange={(v) => {
                        setMinute(Number(v));
                    }}
                >
                    <SelectTrigger className="h-10">
                        <SelectValue placeholder="MM" />
                    </SelectTrigger>
                    <SelectContent>
                        {minutes.map((m) => (
                            <SelectItem key={m} value={String(m)}>
                                {pad(m)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Seconds (opcional) */}
            {withSeconds && (
                <>
                    <span className="text-sm select-none">:</span>
                    <div className="w-24">
                        <Select
                            value={String(second)}
                            onValueChange={(v) => {
                                setSecond(Number(v));
                            }}
                        >
                            <SelectTrigger className="h-10">
                                <SelectValue placeholder="SS" />
                            </SelectTrigger>
                            <SelectContent>
                                {seconds.map((s) => (
                                    <SelectItem key={s} value={String(s)}>
                                        {pad(s)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </>
            )}

            {/* AM / PM */}
            <div className="w-28">
                <Select
                    value={ampm}
                    onValueChange={(v) => setAmpm(v as "AM" | "PM")}

                >
                    <SelectTrigger className="h-10">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="AM">AM</SelectItem>
                        <SelectItem value="PM">PM</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}
