"use client";

import { Info, Pencil, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

import { Nota } from "../types";

interface NotaListMobileProps {
    notas: Nota[];
}

export default function NotaListMobile({ notas }: NotaListMobileProps) {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredNotas = notas.filter(
        (nota) =>
            nota.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            nota.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (nota.empleadoCreador?.toLowerCase() ?? "").includes(searchTerm.toLowerCase())
    );

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
                                <div className="flex items-center justify-between p-4">
                                    <div className="flex-1 min-w-0 space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-medium truncate">{nota.titulo}</h3>
                                            <Badge
                                                variant={
                                                    nota.estado === "APROBADA"
                                                        ? "default"
                                                        : nota.estado === "PENDIENTE"
                                                            ? "secondary"
                                                            : nota.estado === "FINALIZADA"
                                                                ? "outline"
                                                                : "destructive"
                                                }
                                                className="text-xs"
                                            >
                                                {nota.estado}
                                            </Badge>
                                        </div>

                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <p className="text-sm text-muted-foreground truncate">
                                                        {nota.descripcion || "Sin descripción"}
                                                    </p>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p className="max-w-xs">
                                                        {nota.descripcion || "Sin descripción"}
                                                    </p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>

                                        {nota.empleadoCreador && (
                                            <p className="text-xs text-muted-foreground">
                                                Creado por: {nota.empleadoCreador}
                                            </p>
                                        )}
                                    </div>

                                    {/* Botón editar */}
                                    <Link
                                        href={`/redaccion/${nota.id}/edit`}
                                        className="ml-2 flex-shrink-0"
                                    >
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 rounded-full"
                                        >
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
                            {searchTerm
                                ? "Intenta con otra búsqueda."
                                : "Crea una nueva nota para comenzar."}
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
