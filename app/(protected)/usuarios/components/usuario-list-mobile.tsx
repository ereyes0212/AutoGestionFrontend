"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Usuario } from "../type";

interface UserListProps {
  usuarios: Usuario[];
}

export default function UserListMobile({ usuarios }: UserListProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredUsuarios = usuarios.filter((user) =>
    user.usuario?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.empleado?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Botón para crear un nuevo usuario */}
      <Link href="/usuarios/create" className="w-full md:w-auto">
        <Button className="w-full md:w-auto flex items-center gap-2">
          Nuevo usuario
          <Plus />
        </Button>
      </Link>

      {/* Input de búsqueda */}
      <div className="relative">
        <Input
          type="text"
          placeholder="Buscar usuario..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      </div>

      {/* Listado de usuarios */}
      {filteredUsuarios.map((user) => (
        <div key={user.id} className="flex items-center justify-between p-4 rounded-lg shadow border">
          <div className="flex-1 min-w-0">
            <div className="flex items-center">
              <span
                className={`w-2 h-2 rounded-full mr-2 ${user.activo ? "bg-green-500" : "bg-red-500"}`}
              ></span>
              <h3 className="text-sm font-medium truncate">{user.usuario}</h3>
            </div>
            <p className="text-xs mt-1 truncate">Empleado: {user.empleado}</p>
            <p className="text-xs mt-1 truncate">Rol: {user.rol}</p>
          </div>
          <div className="flex items-center ml-4">
            <Link href={`/usuarios/${user.id}/edit`}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Pencil className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      ))}

      {filteredUsuarios.length === 0 && (
        <p className="text-center text-gray-500">No se encontraron usuarios.</p>
      )}
      {filteredUsuarios.length > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          Mostrando {filteredUsuarios.length} de {usuarios.length} usuarios
        </p>
      )}
    </div>
  );
}
