"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Pencil, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Insumo } from "../types";

interface InsumoListProps {
  insumos: Insumo[];
}

export default function InsumoListMobile({ insumos }: InsumoListProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredInsumos = insumos.filter((insumo) =>
    insumo.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <Link href={`/inventario/insumos/create`} className="w-full md:w-auto">
        <Button className="w-full md:w-auto flex items-center gap-2">
          Nuevo insumo
          <Plus />
        </Button>
      </Link>
      <div className="relative">
        <Input
          type="text"
          placeholder="Buscar insumo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
      </div>

      {filteredInsumos.map((insumo) => (
        <div
          key={insumo.id}
          className="flex items-center justify-between rounded-lg border p-4 shadow"
        >
          <Link href={`/inventario/insumos/${insumo.id}`} className="min-w-0 flex-1">
            <h3 className="truncate text-base font-semibold">{insumo.nombre}</h3>
            <p className="text-sm text-gray-500">
              Stock: {insumo.stockActual} {insumo.unidadNombre} (mínimo {insumo.stockMinimo})
            </p>
            {insumo.equivalenciaStock && (
              <p className="text-xs text-gray-500">≈ {insumo.equivalenciaStock}</p>
            )}
            {insumo.contenidoLabel && (
              <p className="text-xs text-gray-500">{insumo.contenidoLabel}</p>
            )}
            <div className="mt-1 flex flex-wrap gap-2">
              <Badge variant={insumo.activo ? "default" : "destructive"}>
                {insumo.activo ? "Activo" : "Inactivo"}
              </Badge>
              {insumo.bajoStock && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Bajo stock
                </Badge>
              )}
            </div>
          </Link>
          <div className="ml-4 flex items-center">
            <Link href={`/inventario/insumos/${insumo.id}/edit`}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Pencil className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      ))}
      {filteredInsumos.length === 0 && (
        <p className="text-center text-gray-500">No se encontraron insumos.</p>
      )}
    </div>
  );
}
