"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { CategoriaActivo } from "../types";

interface CategoriaActivoListProps {
  categoriaActivo: CategoriaActivo[];
}

export default function CategoriaActivoListMobile({ categoriaActivo: categoriaActivo }: CategoriaActivoListProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCategoriaActivo = categoriaActivo.filter(
    (tipoSeccion) =>
      tipoSeccion.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <Link href={`/inventario/categoria-activo/create`} className="w-full md:w-auto">
        <Button className="w-full md:w-auto flex items-center gap-2">
          Nueva categoria
          <Plus />
        </Button>
      </Link>
      <div className="relative">
        <Input
          type="text"
          placeholder="Buscar categoria..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      </div>

      {filteredCategoriaActivo.map((categoriaActivo) => (
        <div
          key={categoriaActivo.id}
          className="flex items-center justify-between p-4 rounded-lg shadow border"
        >
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold truncate">
              {categoriaActivo.nombre}
            </h3>
            <p className="text-sm text-gray-500 truncate">
              {categoriaActivo.descripcion}
            </p>
            <Badge variant={categoriaActivo.activo ? "default" : "destructive"}>
              {categoriaActivo.activo ? "Activo" : "Inactivo"}
            </Badge>
          </div>
          <div className="flex items-center ml-4">
            <Link href={`/inventario/categoria-activo/${categoriaActivo.id}/edit`}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Pencil className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      ))}
      {filteredCategoriaActivo.length === 0 && (
        <p className="text-center text-gray-500">
          No se encontraron categorias de activos.
        </p>
      )}
    </div>
  );
}
