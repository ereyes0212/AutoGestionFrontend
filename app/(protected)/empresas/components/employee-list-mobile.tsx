"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Mail, User, UserX, Search, Plus } from "lucide-react";
import type { Empleado, Empresa } from "@/lib/Types";

interface EmployeeListProps {
  empresa: Empresa[];
}

export default function EmpresaListMobile({ empresa: empresas }: EmployeeListProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredEmpleados = empresas.filter(
    (empleado) =>
      empleado.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <Link href={`/empresas/create`} className="w-full md:w-auto">
        <Button className="w-full md:w-auto flex items-center gap-2">
          Nueva empresa
          <Plus />
        </Button>
      </Link>
      <div className="relative">
        <Input
          type="text"
          placeholder="Buscar empresa..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      </div>

      {filteredEmpleados.map((empresa) => (
        <div
          key={empresa.id}
          className="flex items-center justify-between p-4 rounded-lg shadow border"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center">
              <span
                className={`w-2 h-2 rounded-full mr-2 ${
                  empresa.activo ? "bg-green-500" : "bg-red-500"
                }`}
              ></span>
              <h3 className="text-sm font-medium truncate">
                {empresa.nombre}
              </h3>
            </div>
          </div>
          <div className="flex items-center ml-4">
            <Link href={`/empresas/${empresa.id}/edit`}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Pencil className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      ))}
      {filteredEmpleados.length === 0 && (
        <p className="text-center text-gray-500">
          No se encontraron empresas.
        </p>
      )}
    </div>
  );
}
