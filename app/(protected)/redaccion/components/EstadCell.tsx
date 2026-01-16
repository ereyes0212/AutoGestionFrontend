"use client";

import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { AlertTriangle, Award, CheckCircle, Clock, Info, XCircle } from "lucide-react";

interface EstadoCellProps {
    estado: "PENDIENTE" | "APROBADA" | "FINALIZADA" | "RECHAZADA";
    feedback?: string;
    esPrioridad?: boolean;
    esUltimaHora?: boolean;
}

export const EstadoCell: React.FC<EstadoCellProps> = ({ estado, feedback, esPrioridad = false, esUltimaHora = false }) => {
    const map = {
        PENDIENTE: { Icon: Clock, color: "bg-yellow-100 text-yellow-800", label: "PENDIENTE" },
        APROBADA: { Icon: CheckCircle, color: "bg-green-100 text-green-800", label: "APROBADA" },
        FINALIZADA: { Icon: Award, color: "bg-blue-100 text-blue-800", label: "FINALIZADA" },
        RECHAZADA: { Icon: XCircle, color: "bg-red-100 text-red-800", label: "DESCARTADA" },
    } as const;

    const info = map[estado] ?? map.PENDIENTE;
    const Icon = info.Icon;

    return (
        <div className="flex items-center gap-2">
            {/* Badge con ícono */}
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm font-semibold ${info.color}`}>
                <Icon className="h-4 w-4" />
                <span>{info.label}</span>
            </div>

            {/* Icono de prioridad (si aplica) */}
            {esPrioridad && (
                <HoverCard openDelay={200} closeDelay={100}>
                    <HoverCardTrigger asChild>
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 flex items-center justify-center"
                            aria-label="Esta nota es de prioridad"
                        >
                            <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        </Button>
                    </HoverCardTrigger>
                    <HoverCardContent className="max-w-xs">
                        <p className="text-sm">Esta nota es de prioridad</p>
                    </HoverCardContent>
                </HoverCard>
            )}
            {/* Icono de prioridad (si aplica) */}
            {esUltimaHora && (
                <HoverCard openDelay={200} closeDelay={100}>
                    <HoverCardTrigger asChild>
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 flex items-center justify-center"
                            aria-label="Esta nota es de prioridad"
                        >
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                        </Button>
                    </HoverCardTrigger>
                    <HoverCardContent className="max-w-xs">
                        <p className="text-sm">Esta nota es de última hora</p>
                    </HoverCardContent>
                </HoverCard>
            )}

            {/* Solo para RECHAZADA (mostrada como DESCARTADA) mostramos el feedback */}
            {feedback && (
                <HoverCard openDelay={200} closeDelay={100}>
                    <HoverCardTrigger asChild>
                        <Button size="sm" variant="outline" className="flex items-center gap-1">
                            <Info className="h-3 w-3" /> Feedback
                        </Button>
                    </HoverCardTrigger>
                    <HoverCardContent className="max-w-xs">
                        <p className="whitespace-pre-wrap text-sm">{feedback}</p>
                    </HoverCardContent>
                </HoverCard>
            )}
        </div>
    );
};
