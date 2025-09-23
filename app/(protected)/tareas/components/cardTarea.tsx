"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Edit, Eye, Flag } from "lucide-react";
import type { Tarea } from "../types";

export function estadoToBadgeText(estado: string) {
    if (!estado) return estado;
    switch (estado.toLowerCase()) {
        case "completada":
            return "Completada";
        case "pendiente":
            return "Pendiente";
        case "en_progreso":
            return "En Progreso";
        case "finalizado":
            return "Finalizado";
        default:
            return estado.charAt(0).toUpperCase() + estado.slice(1);
    }
}

export function formatTimeRange(fechaInicio: Date | undefined, fechaFin: Date | undefined) {
    if (!fechaInicio && !fechaFin) return "Sin fecha";
    const fecha = fechaInicio || fechaFin;
    return fecha
        ? new Date(fecha).toLocaleDateString("es-ES", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
        })
        : "Sin fecha";
}

export function TaskCard({
    tarea,
    onView,
    onComplete,
    onEdit,
}: {
    tarea: Tarea;
    onView?: (t: Tarea) => void;
    onComplete?: (t: Tarea) => void;
    onEdit?: (t: Tarea) => void;
}) {
    const estadoLower = (tarea?.estado || "").toLowerCase();

    const prioridadLabel = tarea.prioridad
        ? tarea.prioridad.charAt(0).toUpperCase() + tarea.prioridad.slice(1).toLowerCase()
        : "N/A";

    const PriorityIcon = () => {
        switch (tarea.prioridad?.toLowerCase()) {
            case "alta":
                return <AlertCircle className="h-4 w-4 text-red-600" />;
            case "media":
                return <Flag className="h-4 w-4 text-amber-600" />;
            case "baja":
                return <Flag className="h-4 w-4 text-green-600" />;
            default:
                return <Flag className="h-4 w-4 text-gray-500" />;
        }
    };

    return (
        <Card className="w-full border ">
            <CardHeader className="p-3">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <CardTitle className="text-base font-medium line-clamp-2">{tarea.titulo}</CardTitle>
                        <div className="text-xs text-muted-foreground mt-1">{formatTimeRange(tarea.fechaInicio as any, tarea.fechaFin as any)}</div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                        <Badge className="text-xs px-2 py-1">{estadoToBadgeText(tarea.estado)}</Badge>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="px-3 py-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <PriorityIcon />
                        <div className="text-sm">{prioridadLabel}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">Asignaciones: {(tarea.asignaciones || []).length}</div>
                </div>
            </CardContent>

            <CardFooter className="p-3">
                <div className="w-full flex items-center justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={() => onView?.(tarea)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Ver
                    </Button>

                    {estadoLower !== "finalizado" && (
                        <Button size="sm" variant="secondary" onClick={() => onEdit?.(tarea)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                        </Button>
                    )}

                    {estadoLower !== "completada" && estadoLower !== "finalizado" && (
                        <Button size="sm" onClick={() => onComplete?.(tarea)}>
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Completar
                        </Button>
                    )}
                </div>
            </CardFooter>
        </Card>
    );
}
