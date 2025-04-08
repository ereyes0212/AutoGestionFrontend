"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import type { Permiso } from "@/lib/Types";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PermissionListProps {
  permisos: Permiso[];
}

export default function PermissionListMobile({ permisos }: PermissionListProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredPermisos = permisos.filter(
    (permiso) =>
      permiso.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permiso.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (

    <div className="space-y-4 p-4">
      {/* Buscador */}
      <div className="relative">
        <Input
          type="text"
          placeholder="Buscar permiso..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      </div>
      <ScrollArea className="h-[500px]">
        {/* Listado de permisos */}
        {filteredPermisos.map((permiso) => (
          <div key={permiso.id} className="p-4 rounded-lg shadow border my-2">
            <div className="flex items-center">
              <span
                className={`w-2 h-2 rounded-full mr-2 ${permiso.activo ? "bg-green-500" : "bg-red-500"
                  }`}
              ></span>
              <h3 className="text-sm font-medium truncate">{permiso.nombre}</h3>
            </div>
            <p className="text-xs mt-1">{permiso.descripcion}</p>
          </div>
        ))}
        {filteredPermisos.length === 0 && (
          <p className="text-center text-gray-500">
            No se encontraron permisos.
          </p>
        )}
      </ScrollArea>
    </div>

  );
}
