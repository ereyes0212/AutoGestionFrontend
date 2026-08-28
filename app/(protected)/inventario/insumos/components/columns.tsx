"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ColumnDef } from "@tanstack/react-table";
import { AlertTriangle, ArrowUpDown, CheckCircleIcon, MoreHorizontal, XCircleIcon } from "lucide-react";
import Link from "next/link";
import { Insumo } from "../types";

export const columns: ColumnDef<Insumo>[] = [
  {
    accessorKey: "nombre",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-center"
      >
        Insumo
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "unidadNombre",
    header: "Unidad",
  },
  {
    accessorKey: "stockActual",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-center"
      >
        Stock
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const insumo = row.original;
      return (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">
              {insumo.stockActual} {insumo.unidadNombre}
            </span>
            {insumo.bajoStock && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Bajo stock
              </Badge>
            )}
          </div>
          {insumo.equivalenciaStock && (
            <p className="text-xs text-muted-foreground">≈ {insumo.equivalenciaStock}</p>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "stockMinimo",
    header: "Stock mínimo",
  },
  {
    id: "contenido",
    header: "Empaque",
    cell: ({ row }) => {
      const insumo = row.original;
      return insumo.contenidoLabel ? (
        <span className="text-sm">{insumo.contenidoLabel}</span>
      ) : (
        <span className="text-muted-foreground">-</span>
      );
    },
  },
  {
    accessorKey: "activo",
    header: "Activo",
    cell: ({ row }) => {
      const isActive = row.getValue("activo");
      return (
        <div>
          {isActive ? (
            <div className="flex gap-2">
              <CheckCircleIcon color="green" /> Activo{" "}
            </div>
          ) : (
            <div className="flex gap-2">
              <XCircleIcon color="red" /> Inactivo{" "}
            </div>
          )}
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "Acciones",
    cell: ({ row }) => {
      const insumo = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir Menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
            <Link href={`/inventario/insumos/${insumo.id}`}>
              <DropdownMenuItem>Ver movimientos</DropdownMenuItem>
            </Link>
            <Link href={`/inventario/insumos/${insumo.id}/edit`}>
              <DropdownMenuItem>Editar</DropdownMenuItem>
            </Link>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
