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
import { ArrowUpDown, Award, CheckCircle, Clock, MoreHorizontal, XCircle } from "lucide-react";
import Link from "next/link";
import { Nota } from "../types";

export const columns: ColumnDef<Nota>[] = [
  {
    accessorKey: "titulo",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-center"
      >
        Titulo
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "empleadoCreador",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-center"
      >
        Empleado Creador
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "empleadoAsignado",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-center"
      >
        Empleado Asignado
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "empleadoAprobador",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-center"
      >
        Empleado aprobador
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  // columna estado con icono y color
  {
    accessorKey: "estado",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-left"
      >
        Activo
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const estado = row.original.estado as
        | "PENDIENTE"
        | "APROBADA"
        | "FINALIZADA"
        | "RECHAZADA";

      const map = {
        PENDIENTE: { Icon: Clock, color: "text-yellow-500", label: "PENDIENTE" },
        APROBADA: { Icon: CheckCircle, color: "text-green-600", label: "APROBADA" },
        FINALIZADA: { Icon: Award, color: "text-blue-600", label: "FINALIZADA" },
        RECHAZADA: { Icon: XCircle, color: "text-red-600", label: "RECHAZADA" },
      } as const;

      const info = map[estado] ?? map.PENDIENTE;
      const Icon = info.Icon;

      return (
        <div className="flex items-center">
          <Icon className={`mr-2 h-4 w-4 ${info.color}`} />
          <span className="text-sm font-medium">{info.label}</span>
        </div>
      );
    },
  },
  // acciones
  {
    id: "actions",
    header: "Acciones",
    cell: ({ row }) => {
      const redaccion = row.original;

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
            <Link href={`/redaccion/${redaccion.id}/edit`}>
              <DropdownMenuItem>Editar</DropdownMenuItem>
            </Link>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
