"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Search, Plus } from "lucide-react";
import type { Puesto } from "@/lib/Types";

interface EmployeeListProps {
  puesto: Puesto[];
}

export default function PuestoListMobile({ puesto: puestos }: EmployeeListProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredPuestos = puestos.filter(
    (puesto) =>
      puesto.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <Link href={`/puestos/create`} className="w-full md:w-auto">
        <Button className="w-full md:w-auto flex items-center gap-2">
          Nuevo puesto
          <Plus />
        </Button>
      </Link>
      <div className="relative">
        <Input
          type="text"
          placeholder="Buscar puesto..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      </div>

      {filteredPuestos.map((puestos) => (
        <div
          key={puestos.id}
          className="flex items-center justify-between p-4 rounded-lg shadow border"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center">
              <span
                className={`w-2 h-2 rounded-full mr-2 ${
                  puestos.activo ? "bg-green-500" : "bg-red-500"
                }`}
              ></span>
              <h3 className="text-sm font-medium truncate">
                {puestos.nombre}
              </h3>
              <h3 className="text-sm font-medium truncate">
                {puestos.descripcion}
              </h3>
              <h3 className="text-sm font-medium truncate">
                {puestos.empresa}
              </h3>
            </div>
          </div>
          <div className="flex items-center ml-4">
            <Link href={`/puestos/${puestos.id}/edit`}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Pencil className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      ))}
      {filteredPuestos.length === 0 && (
        <p className="text-center text-gray-500">
          No se encontraron empresas.
        </p>
      )}
    </div>
  );
}
