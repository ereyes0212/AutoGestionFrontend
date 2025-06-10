"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Activo } from "../types";

interface ActivoListProps {
    activos: Activo[];
}

export default function ActivoListMobile({ activos }: ActivoListProps) {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredActivos = activos.filter(
        (activo) =>
            activo.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            activo.codigoBarra.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-4">
            <Link href={`/inventario/activo/create`} className="w-full md:w-auto">
                <Button className="w-full md:w-auto flex items-center gap-2">
                    Nuevo activo
                    <Plus />
                </Button>
            </Link>
            <div className="relative">
                <Input
                    type="text"
                    placeholder="Buscar activo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>

            {filteredActivos.map((activo) => (
                <div
                    key={activo.id}
                    className="flex items-center justify-between p-4 rounded-lg shadow border"
                >
                    <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold truncate">
                            {activo.nombre}
                        </h3>
                        <p className="text-sm text-gray-500 truncate">
                            {activo.codigoBarra}
                        </p>
                        <div className="flex flex-col gap-1 mt-1">
                            <div className="flex gap-2">
                                <Badge variant={activo.activo ? "default" : "destructive"}>
                                    {activo.activo ? "Activo" : "Inactivo"}
                                </Badge>
                                <Badge variant="outline">
                                    {activo.categoria?.nombre}
                                </Badge>
                            </div>
                            <p className="text-sm text-gray-600">
                                Estado: {activo.estadoActual?.nombre}
                            </p>
                            <p className="text-sm text-gray-600">
                                Asignado a: {activo.empleadoAsignado?.nombre || "Sin asignar"}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center ml-4">
                        <Link href={`/inventario/activo/${activo.id}/edit`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Pencil className="h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                </div>
            ))}
            {filteredActivos.length === 0 && (
                <p className="text-center text-gray-500">
                    No se encontraron activos.
                </p>
            )}
        </div>
    );
} 