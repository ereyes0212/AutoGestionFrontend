"use client";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { MovimientoInsumo } from "../types";
import FirmaCell from "./firma-cell";

interface MovimientosListProps {
  movimientos: MovimientoInsumo[];
  /** Se oculta la columna de insumo cuando ya se está viendo un insumo */
  mostrarInsumo?: boolean;
}

export default function MovimientosList({
  movimientos,
  mostrarInsumo = true,
}: MovimientosListProps) {
  const [filtro, setFiltro] = useState("");

  const filtrados = useMemo(() => {
    const termino = filtro.toLowerCase().trim();
    if (!termino) return movimientos;

    return movimientos.filter((m) =>
      [m.insumoNombre, m.solicitadoPor, m.registradoPor, m.observaciones, m.tipo]
        .join(" ")
        .toLowerCase()
        .includes(termino)
    );
  }, [movimientos, filtro]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Input
          type="text"
          placeholder="Buscar por insumo, empleado u observación..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="pl-10"
        />
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
      </div>

      {/* Escritorio */}
      <div className="hidden rounded-md border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              {mostrarInsumo && <TableHead>Insumo</TableHead>}
              <TableHead>Tipo</TableHead>
              <TableHead>Cantidad</TableHead>
              <TableHead>Stock resultante</TableHead>
              <TableHead>Solicitó</TableHead>
              <TableHead>Registró</TableHead>
              <TableHead>Observaciones</TableHead>
              <TableHead>Firma</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtrados.length ? (
              filtrados.map((movimiento) => (
                <TableRow key={movimiento.id}>
                  <TableCell className="whitespace-nowrap">{movimiento.fechaLabel}</TableCell>
                  {mostrarInsumo && <TableCell>{movimiento.insumoNombre}</TableCell>}
                  <TableCell>
                    <Badge variant={movimiento.tipo === "ENTRADA" ? "default" : "secondary"}>
                      {movimiento.tipo === "ENTRADA" ? "Entrada" : "Salida"}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {movimiento.tipo === "ENTRADA" ? "+" : "-"}
                    {movimiento.cantidadLabel}
                  </TableCell>
                  <TableCell>{movimiento.stockResultante}</TableCell>
                  <TableCell>{movimiento.solicitadoPor}</TableCell>
                  <TableCell>{movimiento.registradoPor}</TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {movimiento.observaciones || "-"}
                  </TableCell>
                  <TableCell>
                    <FirmaCell movimiento={movimiento} />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={mostrarInsumo ? 9 : 8} className="h-24 text-center">
                  Sin movimientos registrados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Móvil */}
      <div className="space-y-3 md:hidden">
        {filtrados.map((movimiento) => (
          <div key={movimiento.id} className="space-y-2 rounded-lg border p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="truncate text-base font-semibold">{movimiento.insumoNombre}</h3>
                <p className="text-xs text-muted-foreground">{movimiento.fechaLabel}</p>
              </div>
              <Badge variant={movimiento.tipo === "ENTRADA" ? "default" : "secondary"}>
                {movimiento.tipo === "ENTRADA" ? "Entrada" : "Salida"}
              </Badge>
            </div>
            <p className="text-sm">
              <span className="text-muted-foreground">Cantidad: </span>
              {movimiento.tipo === "ENTRADA" ? "+" : "-"}
              {movimiento.cantidadLabel} (stock: {movimiento.stockResultante})
            </p>
            <p className="text-sm">
              <span className="text-muted-foreground">Solicitó: </span>
              {movimiento.solicitadoPor}
            </p>
            <p className="text-sm">
              <span className="text-muted-foreground">Registró: </span>
              {movimiento.registradoPor}
            </p>
            {movimiento.observaciones && (
              <p className="text-sm">
                <span className="text-muted-foreground">Observaciones: </span>
                {movimiento.observaciones}
              </p>
            )}
            <FirmaCell movimiento={movimiento} />
          </div>
        ))}
        {filtrados.length === 0 && (
          <p className="text-center text-gray-500">Sin movimientos registrados.</p>
        )}
      </div>
    </div>
  );
}
