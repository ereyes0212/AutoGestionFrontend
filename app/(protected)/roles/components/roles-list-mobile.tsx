"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Pencil, Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { Rol } from "@/lib/Types"; // Asegúrate de tener la interfaz Rol definida

interface RoleListProps {
  roles: Rol[];
}

export default function RoleListMobile({ roles }: RoleListProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredRoles = roles.filter(
    (rol) =>
      rol.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rol.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Botón para crear un nuevo rol */}
      <Link href="/roles/create" className="w-full md:w-auto">
        <Button className="w-full md:w-auto flex items-center gap-2">
          Nuevo rol
          <Plus />
        </Button>
      </Link>

      {/* Input de filtro */}
      <div className="relative">
        <Input
          type="text"
          placeholder="Buscar rol..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      </div>

      {/* Listado de roles */}
      {filteredRoles.map((rol) => (
        <div key={rol.id} className="flex items-center justify-between p-4 rounded-lg shadow border">
          <div className="flex-1 min-w-0">
            <div className="flex items-center">
              <span
                className={`w-2 h-2 rounded-full mr-2 ${rol.activo ? "bg-green-500" : "bg-red-500"}`}
              ></span>
              <h3 className="text-sm font-medium truncate">{rol.nombre}</h3>
            </div>
            <p className="text-xs mt-1 truncate">{rol.descripcion}</p>
          </div>
          <div className="flex items-center ml-4">
            <Link href={`/roles/${rol.id}/edit`}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Pencil className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      ))}
      {filteredRoles.length === 0 && (
        <p className="text-center text-gray-500">No se encontraron roles.</p>
      )}
    </div>
  );
}
