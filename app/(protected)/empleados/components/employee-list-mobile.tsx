"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Mail, User, UserX, Search, Plus } from "lucide-react";
import type { Empleado } from "@/lib/Types";

interface EmployeeListProps {
  empleados: Empleado[];
}

export default function EmployeeListMobile({ empleados }: EmployeeListProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredEmpleados = empleados.filter(
    (empleado) =>
      empleado.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      empleado.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      empleado.correo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <Link href={`/empleados/create`} className="w-full md:w-auto">
        <Button className="w-full md:w-auto flex items-center gap-2">
          Nuevo empleado
          <Plus />
        </Button>
      </Link>
      <div className="relative">
        <Input
          type="text"
          placeholder="Buscar empleado..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      </div>

      {filteredEmpleados.map((empleado) => (
        <div
          key={empleado.id}
          className="flex items-center justify-between p-4 rounded-lg shadow border"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center">
              <span
                className={`w-2 h-2 rounded-full mr-2 ${
                  empleado.activo ? "bg-green-500" : "bg-red-500"
                }`}
              ></span>
              <h3 className="text-sm font-medium truncate">
                {empleado.nombre} {empleado.apellido}
              </h3>
            </div>
            <div className="mt-2 flex flex-col space-y-1">
              <p className="text-xs flex items-center">
                <Mail className="h-3 w-3 mr-1" />
                <span className="truncate">{empleado.correo}</span>
              </p>
              <p className="text-xs flex items-center">
                <User className="h-3 w-3 mr-1" />
                {empleado.edad} años, {empleado.genero}
              </p>
              {empleado.usuarioNombre ? (
                <p className="text-xs flex items-center">
                  <User className="h-3 w-3 mr-1" />
                  {empleado.usuarioNombre}
                </p>
              ) : (
                <p className="text-xs flex items-center">
                  <UserX className="h-3 w-3 mr-1" />
                  <span>Sin usuario</span>
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center ml-4">
            <Link href={`/empleados/${empleado.id}/edit`}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Pencil className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      ))}
      {filteredEmpleados.length === 0 && (
        <p className="text-center text-gray-500">
          No se encontraron empleados.
        </p>
      )}
    </div>
  );
}
