"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { EstadoPedidoInsumo, PedidoInsumo } from "../types";

const ESTADOS: Record<
  EstadoPedidoInsumo,
  { etiqueta: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  PENDIENTE: { etiqueta: "Pendiente", variant: "secondary" },
  RECIBIDO: { etiqueta: "Recibido", variant: "default" },
  CANCELADO: { etiqueta: "Cancelado", variant: "outline" },
};

export default function PedidosList({ pedidos }: { pedidos: PedidoInsumo[] }) {
  const [filtro, setFiltro] = useState("");

  const filtrados = useMemo(() => {
    const termino = filtro.toLowerCase().trim();
    if (!termino) return pedidos;

    return pedidos.filter((pedido) =>
      [
        `#${pedido.numero}`,
        pedido.ciudadNombre,
        pedido.solicitadoPor,
        pedido.observaciones,
        ESTADOS[pedido.estado].etiqueta,
        ...pedido.detalles.map((d) => d.insumoNombre),
      ]
        .join(" ")
        .toLowerCase()
        .includes(termino)
    );
  }, [pedidos, filtro]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Input
          type="text"
          placeholder="Buscar por número, ciudad, insumo o solicitante..."
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
              <TableHead>Pedido</TableHead>
              <TableHead>Ciudad</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Solicitó</TableHead>
              <TableHead>Insumos</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtrados.length ? (
              filtrados.map((pedido) => (
                <TableRow key={pedido.id}>
                  <TableCell className="font-medium">#{pedido.numero}</TableCell>
                  <TableCell>{pedido.ciudadNombre}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {pedido.fechaSolicitudLabel}
                  </TableCell>
                  <TableCell>{pedido.solicitadoPor}</TableCell>
                  <TableCell>{pedido.totalLineas}</TableCell>
                  <TableCell>
                    <Badge variant={ESTADOS[pedido.estado].variant}>
                      {ESTADOS[pedido.estado].etiqueta}
                    </Badge>
                    {pedido.estado === "RECIBIDO" && pedido.fechaRecepcionLabel && (
                      <span className="block text-xs text-muted-foreground">
                        {pedido.fechaRecepcionLabel}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/inventario/insumos/pedidos/${pedido.id}`}>
                        <Eye className="mr-1 h-4 w-4" />
                        Ver
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  Sin pedidos registrados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Móvil */}
      <div className="space-y-3 md:hidden">
        {filtrados.map((pedido) => (
          <Link
            key={pedido.id}
            href={`/inventario/insumos/pedidos/${pedido.id}`}
            className="block space-y-1 rounded-lg border p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-base font-semibold">Pedido #{pedido.numero}</h3>
                <p className="text-xs text-muted-foreground">
                  {pedido.ciudadNombre} · {pedido.fechaSolicitudLabel}
                </p>
              </div>
              <Badge variant={ESTADOS[pedido.estado].variant}>
                {ESTADOS[pedido.estado].etiqueta}
              </Badge>
            </div>
            <p className="text-sm">
              <span className="text-muted-foreground">Solicitó: </span>
              {pedido.solicitadoPor}
            </p>
            <p className="text-sm">
              <span className="text-muted-foreground">Insumos: </span>
              {pedido.totalLineas}
            </p>
          </Link>
        ))}
        {filtrados.length === 0 && (
          <p className="text-center text-gray-500">Sin pedidos registrados.</p>
        )}
      </div>
    </div>
  );
}
