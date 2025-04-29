"use client";;
import { ArrowUpDown } from "lucide-react";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { SolicitudPermiso } from "../type";

export const columns: ColumnDef<SolicitudPermiso>[] = [
  {
    accessorKey: "fechaSolicitud",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-left"
      >
        Fecha Solicitud
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const fechaSolicitud = row.getValue<string>("fechaSolicitud");
      const fechaFormateada = new Date(fechaSolicitud).toLocaleDateString();
      return <span>{fechaFormateada}</span>;
    },
  },
  {
    accessorKey: "fechaInicio",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-left"
      >
        Fecha Inicio
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const fechaInicio = row.getValue<string>("fechaInicio");
      const fechaFormateada = new Date(fechaInicio).toLocaleDateString();
      return <span>{fechaFormateada}</span>;
    },
  },
  {
    accessorKey: "fechaFin",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-left"
      >
        Fecha Fin
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const fechaFin = row.getValue<string>("fechaFin");
      const fechaFormateada = new Date(fechaFin).toLocaleDateString();
      return <span>{fechaFormateada}</span>;
    },
  },
  {
    accessorKey: "descripcion",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-left"
      >
        Descripción
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "diasSolicitados",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-left"
      >
        Dias Solicitados
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const diasSolicitados = row.getValue<number>("diasSolicitados");
      return <span>{diasSolicitados}</span>;
    },
  },
  {
    accessorKey: "aprobado",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-left"
      >
        Estado
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const aprobado = row.getValue<boolean | null>("aprobado");

      return aprobado === true ? (
        <Badge className="bg-green-500 hover:bg-green-600">Aprobado</Badge>
      ) : aprobado === false ? (
        <Badge variant="destructive">Rechazado</Badge>
      ) : (
        <Badge
          variant="outline"
          className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-300"
        >
          Pendiente
        </Badge>
      );
    },
  },
  {
    id: "actions",
    header: "Acciones",
    cell: ({ row }) => {
      const solicitud = row.original;
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
            <Link href={`/solicitudes/${solicitud.id}/detalle`}>
              <DropdownMenuItem>Ver Detalle</DropdownMenuItem>
            </Link>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
