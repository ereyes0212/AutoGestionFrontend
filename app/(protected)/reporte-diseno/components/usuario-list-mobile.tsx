"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ReporteDiseño } from "../type";

interface ReportListProps {
  reportes: ReporteDiseño[];
}

export default function ReportListMobile({ reportes }: ReportListProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = reportes.filter((r) =>
    r.empleado.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.tipoSeccion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3  border-b shadow-sm">
        <h1 className="text-lg font-semibold">Reportes</h1>
        <Link href="/reporte-diseno/create">
          <Button variant="secondary" size="icon" className="p-2">
            <Plus className="h-5 w-5" />
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="px-4 py-2 ">
        <div className="relative">
          <Input
            type="text"
            placeholder="Buscar reporte..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3">
        {filtered.length > 0 ? (
          filtered.map((r) => {
            const date = new Date(r.fechaRegistro).toLocaleDateString();
            return (
              <div
                key={r.id}
                className="p-4  rounded-lg shadow border flex items-start justify-between"
              >
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm font-medium truncate">{r.tipoSeccion}</h2>
                  <p className="text-xs text-muted-foreground truncate">
                    {r.empleado} • {date}
                  </p>
                  <p className="text-xs truncate mt-1">
                    Páginas: {r.paginaInicio} - {r.paginaFin}
                  </p>
                  <p className="text-xs truncate">
                    Horario: {r.horaInicio} - {r.horaFin}
                  </p>
                  <p className="text-xs mt-1 text-ellipsis overflow-hidden">
                    {r.observacion}
                  </p>
                </div>
                <Link href={`/reporte-diseno/${r.id}/edit`}>
                  <Button variant="ghost" size="icon" className="ml-3">
                    <Pencil className="h-5 w-5" />
                  </Button>
                </Link>
              </div>
            )
          })
        ) : (
          <p className="text-center text-gray-500 mt-6">No se encontraron reportes.</p>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2  border-t text-center text-sm text-muted-foreground">
        {filtered.length > 0 && (
          <span>
            Mostrando <strong>{filtered.length}</strong> de <strong>{reportes.length}</strong>
          </span>
        )}
      </div>
    </div>
  );
}
