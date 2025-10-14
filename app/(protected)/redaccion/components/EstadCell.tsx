"use client";

import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Award, CheckCircle, Clock, Info, XCircle } from "lucide-react";
import { useState } from "react";

interface EstadoCellProps {
    estado: "PENDIENTE" | "APROBADA" | "FINALIZADA" | "RECHAZADA";
    feedback?: string;
}

export const EstadoCell: React.FC<EstadoCellProps> = ({ estado, feedback }) => {
    const [showFeedback, setShowFeedback] = useState(false);

    const map = {
        PENDIENTE: { Icon: Clock, color: "bg-yellow-100 text-yellow-800", label: "PENDIENTE" },
        APROBADA: { Icon: CheckCircle, color: "bg-green-100 text-green-800", label: "APROBADA" },
        FINALIZADA: { Icon: Award, color: "bg-blue-100 text-blue-800", label: "FINALIZADA" },
        RECHAZADA: { Icon: XCircle, color: "bg-red-100 text-red-800", label: "RECHAZADA" },
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

            {/* Solo para RECHAZADA mostramos el feedback */}
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
