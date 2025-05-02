"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { TipoDeduccion } from "../types";

interface TipoDeduccionListProps {
  tipoDeduccion: TipoDeduccion[];
}

export default function TipoDeduccionesListMobile({ tipoDeduccion: tipoDeduccion }: TipoDeduccionListProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTipoDeduccioness = tipoDeduccion.filter(
    (tipoDeduccion) =>
      tipoDeduccion.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <Link href={`/tipo-deducciones/create`} className="w-full md:w-auto">
        <Button className="w-full md:w-auto flex items-center gap-2">
          Nueva tipo de deducción
          <Plus />
        </Button>
      </Link>
      <div className="relative">
        <Input
          type="text"
          placeholder="Buscar tipo de deduccion..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      </div>

      {filteredTipoDeduccioness.map((tipoDeduccion) => (
        <div
          key={tipoDeduccion.id}
          className="flex items-center justify-between p-4 rounded-lg shadow border"
        >
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold truncate">
              {tipoDeduccion.nombre}
            </h3>
            <p className="text-sm text-gray-500 truncate">
              {tipoDeduccion.descripcion}
            </p>
            <Badge variant={tipoDeduccion.activo ? "default" : "destructive"}>
              {tipoDeduccion.activo ? "Activo" : "Inactivo"}
            </Badge>
          </div>
          <div className="flex items-center ml-4">
            <Link href={`/tipo-deducciones/${tipoDeduccion.id}/edit`}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Pencil className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      ))}
      {filteredTipoDeduccioness.length === 0 && (
        <p className="text-center text-gray-500">
          No se encontraron tipo de deducciones.
        </p>
      )}
    </div>
  );
}
