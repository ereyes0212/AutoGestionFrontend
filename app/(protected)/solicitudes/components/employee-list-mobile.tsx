"use client";;
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatearFecha } from "@/lib/utils";
import { Calendar1, Plus, Search, View } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { SolicitudPermiso } from "../type";

interface EmployeeListProps {
  empleados: SolicitudPermiso[];
}

export default function SolicitudesListMobile({ empleados: solicitudes }: EmployeeListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const filteredSolicitudes = solicitudes.filter(
    (empleado) =>
      empleado.nombreEmpleado.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <Link href={`/solicitudes/create`} className="w-full md:w-auto">
        <Button className="w-full md:w-auto flex items-center gap-2">
          Nueva solicitud
          <Plus />
        </Button>
      </Link>
      <div className="relative">
        <Input
          type="text"
          placeholder="Buscar solicitud..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      </div>

      {filteredSolicitudes.map((empleado) => (
        <div
          key={empleado.id}
          className="flex items-center justify-between p-4 rounded-lg shadow border"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center">
              <span
                className={`w-2 h-2 rounded-full mr-2 ${empleado.aprobado ? "bg-green-500" : "bg-red-500"
                  }`}

              ></span>
              <h3 className="text-sm font-medium truncate">
                {empleado.nombreEmpleado}
              </h3>
            </div>
            <div className="mt-2 flex flex-col space-y-1">
              <p className="text-xs flex items-center">
                <Calendar1 className="h-3 w-3 mr-1" />
                <span className="truncate"> Fecha Inicio: {formatearFecha(empleado.fechaInicio)}</span>
              </p>
              <p className="text-xs flex items-center">
                <Calendar1 className="h-3 w-3 mr-1" />
                <span className="truncate">Fecha Fin: {formatearFecha(empleado.fechaFin)}</span>
              </p>
              <p className="text-xs flex items-center">
                <Calendar1 className="h-3 w-3 mr-1" />
                <span className="truncate"> Fecha Solicitud:{formatearFecha(empleado.fechaSolicitud)}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center ml-4">
            <Link href={`/solicitudes/${empleado.id}/detalle`}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <View className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      ))}
      {filteredSolicitudes.length === 0 && (
        <p className="text-center text-gray-500">
          No se encontraron solicitudes.
        </p>
      )}
      {filteredSolicitudes.length > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          Mostrando {filteredSolicitudes.length} de {solicitudes.length} solicitudes
        </p>
      )}
    </div>
  );
}
