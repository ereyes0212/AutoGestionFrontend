"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { EventoFactura } from "../types";

export const columns: ColumnDef<EventoFactura>[] = [
  { accessorKey: "titulo", header: "Título" },
  { accessorKey: "empleadoNombre", header: "Empleado" },
  {
    accessorKey: "fechaEventoLabel",
    header: "Fecha",
    cell: ({ row }) => row.original.fechaEventoLabel,
  },
  {
    accessorKey: "notaTitulo",
    header: "Nota vinculada",
    cell: ({ row }) => row.original.notaTitulo || "—",
  },
  {
    accessorKey: "totalFacturas",
    header: "Facturas",
    cell: ({ row }) => row.original.totalFacturas,
  },
  {
    id: "actions",
    header: "Acciones",
    cell: ({ row }) => {
      const evento = row.original;
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
            <Link href={`/facturas/${evento.id}/detalle`}>
              <DropdownMenuItem>Ver detalle</DropdownMenuItem>
            </Link>
            <Link href={`/facturas/${evento.id}/editar`}>
              <DropdownMenuItem>Editar</DropdownMenuItem>
            </Link>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
