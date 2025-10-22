"use client";

import { AlertTriangle, Award, CheckCircle, Clock, Info, Pencil, Plus, Search, XCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Input } from "@/components/ui/input";
import { Nota } from "../types";

interface NotaListMobileProps {
    notas: Nota[];
}

export default function NotaListMobile({ notas }: NotaListMobileProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [expandedFeedback, setExpandedFeedback] = useState<Record<string, boolean>>({});

    const filteredNotas = notas.filter(
        (nota) =>
            nota.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            nota.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (nota.empleadoCreador?.toLowerCase() ?? "").includes(searchTerm.toLowerCase())
    );
    const estadoMap = {
        PENDIENTE: { Icon: Clock, color: "bg-yellow-100 text-yellow-800", label: "PENDIENTE" },
        APROBADA: { Icon: CheckCircle, color: "bg-green-100 text-green-800", label: "APROBADA" },
        FINALIZADA: { Icon: Award, color: "bg-blue-100 text-blue-800", label: "FINALIZADA" },
        RECHAZADA: { Icon: XCircle, color: "bg-red-100 text-red-800", label: "RECHAZADA" },
    } as const;

    const toggleFeedback = (id: string) => {
        setExpandedFeedback((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <div className="space-y-4 max-w-3xl mx-auto">
            {/* Botón crear */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <Link href={`/redaccion/create`} className="w-full sm:w-auto">
                    <Button className="w-full sm:w-auto flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Nueva nota
                    </Button>
                </Link>
            </div>

            {/* Buscador */}
            <div className="relative">
                <Input
                    type="text"
                    placeholder="Buscar por título, descripción o creador..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>

            {/* Listado */}
            <div className="space-y-3">
                {filteredNotas.length > 0 ? (
                    filteredNotas.map((nota) => (
                        <Card key={nota.id}>
                            <CardContent className="p-0">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-2">
                                    <div className="flex-1 min-w-0 space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Badge
                                                className={`text-xs w-fit ${estadoMap[nota.estado as keyof typeof estadoMap].color}`}
                                            >
                                                {estadoMap[nota.estado as keyof typeof estadoMap].label}
                                            </Badge>

                                            {/* Icono de prioridad */}
                                            {nota.esPrioridad && (
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
                                        </div>

                                        <h3 className="font-medium text-base leading-snug">{nota.titulo}</h3>

                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            {nota.descripcion || "Sin descripción"}
                                        </p>

                                        <div className="pt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                                            {nota.empleadoCreador && (
                                                <p className="text-xs text-muted-foreground leading-relaxed">Creado: {nota.empleadoCreador}</p>
                                            )}
                                            {nota.empleadoAsignado && (
                                                <p className="text-xs text-muted-foreground leading-relaxed">
                                                    Asignado: {nota.empleadoAsignado}
                                                </p>
                                            )}
                                            {nota.empleadoAprobador && (
                                                <p className="text-xs text-muted-foreground leading-relaxed">
                                                    Aprobado: {nota.empleadoAprobador}
                                                </p>
                                            )}
                                            {/* Fuente (si existe) - ahora es un link */}
                                            {nota.fuente && (
                                                <p className="text-xs leading-relaxed">
                                                    <a
                                                        href={nota.fuente}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="underline text-xs break-words text-blue-600 max-w-[220px] block truncate"
                                                        title={nota.fuente}
                                                    >
                                                        {nota.fuente}
                                                    </a>
                                                </p>
                                            )}
                                        </div>

                                        {/* Feedback de notas rechazadas */}
                                        {nota.estado === "RECHAZADA" && nota.fellback && (
                                            <div className="mt-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => toggleFeedback(nota.id!)}
                                                    className="flex items-center gap-1"
                                                >
                                                    <Info className="h-3 w-3" />
                                                    {expandedFeedback[nota.id!] ? "Ocultar feedback" : "Ver feedback"}
                                                </Button>
                                                {expandedFeedback[nota.id!] && (
                                                    <div className="mt-1 p-2 border rounded-md text-sm whitespace-pre-wrap">
                                                        {nota.fellback}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Botón editar */}
                                    <Link href={`/redaccion/${nota.id}/edit`} className="ml-2 flex-shrink-0">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                            <Pencil className="h-4 w-4" />
                                            <span className="sr-only">Editar nota</span>
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="text-center py-10 bg-muted/30 rounded-lg">
                        <Info className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground">No se encontraron notas.</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            {searchTerm ? "Intenta con otra búsqueda." : "Crea una nueva nota para comenzar."}
                        </p>
                    </div>
                )}
            </div>

            {filteredNotas.length > 0 && (
                <p className="text-sm text-muted-foreground text-center">
                    Mostrando {filteredNotas.length} de {notas.length} notas
                </p>
            )}
        </div>
    );
}
