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
import CancelarMovimientoDialog from "./cancelar-movimiento-dialog";
import FirmaCell from "./firma-cell";

interface MovimientosListProps {
  movimientos: MovimientoInsumo[];
  /** Se oculta la columna de insumo cuando ya se está viendo un insumo */
  mostrarInsumo?: boolean;
  /** Habilita la acción de cancelar (permiso crear_movimiento_insumo) */
  puedeCancelar?: boolean;
}

export default function MovimientosList({
  movimientos,
  mostrarInsumo = true,
  puedeCancelar = false,
}: MovimientosListProps) {
  const [filtro, setFiltro] = useState("");

  const filtrados = useMemo(() => {
    const termino = filtro.toLowerCase().trim();
    if (!termino) return movimientos;

    return movimientos.filter((m) =>
      [m.insumoNombre, m.ciudadNombre, m.solicitadoPor, m.registradoPor, m.observaciones, m.tipo]
        .join(" ")
        .toLowerCase()
        .includes(termino)
    );
  }, [movimientos, filtro]);

  const columnas = 9 + (mostrarInsumo ? 1 : 0) + (puedeCancelar ? 1 : 0);

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
              <TableHead>Ciudad</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Cantidad</TableHead>
              <TableHead>Stock resultante</TableHead>
              <TableHead>Solicitó</TableHead>
              <TableHead>Registró</TableHead>
              <TableHead>Observaciones</TableHead>
              <TableHead>Firma</TableHead>
              {puedeCancelar && <TableHead>Acciones</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtrados.length ? (
              filtrados.map((movimiento) => (
                <TableRow key={movimiento.id} className={movimiento.cancelado ? "opacity-60" : ""}>
                  <TableCell className="whitespace-nowrap">{movimiento.fechaLabel}</TableCell>
                  {mostrarInsumo && <TableCell>{movimiento.insumoNombre}</TableCell>}
                  <TableCell>{movimiento.ciudadNombre}</TableCell>
                  <TableCell>
                    {movimiento.cancelado ? (
                      <Badge variant="outline">Cancelado</Badge>
                    ) : (
                      <Badge variant={movimiento.tipo === "ENTRADA" ? "default" : "secondary"}>
                        {movimiento.tipo === "ENTRADA" ? "Entrada" : "Salida"}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell
                    className={`whitespace-nowrap ${movimiento.cancelado ? "line-through" : ""}`}
                  >
                    {movimiento.tipo === "ENTRADA" ? "+" : "-"}
                    {movimiento.cantidadLabel}
                  </TableCell>
                  <TableCell>{movimiento.stockResultante}</TableCell>
                  <TableCell>{movimiento.solicitadoPor}</TableCell>
                  <TableCell>{movimiento.registradoPor}</TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {movimiento.cancelado
                      ? `Cancelado por ${movimiento.canceladoPor ?? "-"}${
                          movimiento.motivoCancelacion
                            ? `: ${movimiento.motivoCancelacion}`
                            : ""
                        }`
                      : movimiento.observaciones || "-"}
                  </TableCell>
                  <TableCell>
                    <FirmaCell movimiento={movimiento} />
                  </TableCell>
                  {puedeCancelar && (
                    <TableCell>
                      {movimiento.cancelado ? null : movimiento.firmado ? (
                        <span className="text-xs text-muted-foreground">Firmado</span>
                      ) : (
                        <CancelarMovimientoDialog movimiento={movimiento} />
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columnas} className="h-24 text-center">
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
          <div
            key={movimiento.id}
            className={`space-y-2 rounded-lg border p-4 shadow-sm ${
              movimiento.cancelado ? "opacity-60" : ""
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="truncate text-base font-semibold">{movimiento.insumoNombre}</h3>
                <p className="text-xs text-muted-foreground">
                  {movimiento.ciudadNombre} · {movimiento.fechaLabel}
                </p>
              </div>
              {movimiento.cancelado ? (
                <Badge variant="outline">Cancelado</Badge>
              ) : (
                <Badge variant={movimiento.tipo === "ENTRADA" ? "default" : "secondary"}>
                  {movimiento.tipo === "ENTRADA" ? "Entrada" : "Salida"}
                </Badge>
              )}
            </div>
            <p className={`text-sm ${movimiento.cancelado ? "line-through" : ""}`}>
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
            {movimiento.cancelado ? (
              <p className="text-sm">
                <span className="text-muted-foreground">Cancelado por: </span>
                {movimiento.canceladoPor ?? "-"}
                {movimiento.motivoCancelacion ? ` — ${movimiento.motivoCancelacion}` : ""}
              </p>
            ) : (
              movimiento.observaciones && (
                <p className="text-sm">
                  <span className="text-muted-foreground">Observaciones: </span>
                  {movimiento.observaciones}
                </p>
              )
            )}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <FirmaCell movimiento={movimiento} />
              {puedeCancelar && !movimiento.cancelado && !movimiento.firmado && (
                <CancelarMovimientoDialog movimiento={movimiento} />
              )}
            </div>
          </div>
        ))}
        {filtrados.length === 0 && (
          <p className="text-center text-gray-500">Sin movimientos registrados.</p>
        )}
      </div>
    </div>
  );
}
