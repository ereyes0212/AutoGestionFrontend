"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
    cell: ({ row }) => {
      const text = row.original.titulo;
      const maxLength = 25; // cantidad de caracteres visibles en la celda
      const display = text.length > maxLength ? text.slice(0, maxLength) + "..." : text;

      return (
        <Popover>
          <PopoverTrigger asChild>
            <span className="cursor-pointer">{display}</span>
          </PopoverTrigger>
          {text.length > maxLength && (
            <PopoverContent className="max-w-xs">
              <p className="whitespace-pre-wrap">{text}</p>
            </PopoverContent>
          )}
        </Popover>
      );
    },
  },
  {
    id: "empleados",
    header: "Empleados",
    cell: ({ row }: { row: any }) => {
      const { empleadoCreador, empleadoAsignado, empleadoAprobador } = row.original;
      const fullDisplay = `Creador: ${empleadoCreador} / Asignado: ${empleadoAsignado} / Aprobador: ${empleadoAprobador}`;
      const maxLength = 30;
      const display = fullDisplay.length > maxLength ? fullDisplay.slice(0, maxLength) + "..." : fullDisplay;

      return (
        <Popover>
          <PopoverTrigger asChild>
            <span className="cursor-pointer">{display}</span>
          </PopoverTrigger>
          {fullDisplay.length > maxLength && (
            <PopoverContent className="max-w-xs">
              <p className="whitespace-pre-wrap">
                <strong>Creador:</strong> {empleadoCreador} <br />
                <strong>Asignado:</strong> {empleadoAsignado} <br />
                <strong>Aprobador:</strong> {empleadoAprobador}
              </p>
            </PopoverContent>
          )}
        </Popover>
      );
    },
    filterFn: (row: any, id: string, filterValue: string) => {
      const { empleadoCreador, empleadoAsignado, empleadoAprobador } = row.original;
      const val = filterValue.toLowerCase();
      return (
        (empleadoCreador?.toLowerCase().includes(val) ?? false) ||
        (empleadoAsignado?.toLowerCase().includes(val) ?? false) ||
        (empleadoAprobador?.toLowerCase().includes(val) ?? false)
      );
    },
  },


  {
    accessorKey: "descripcion",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-center"
      >
        Descripción
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const text = row.original.descripcion;
      const maxLength = 30; // cantidad de caracteres visibles en la celda
      const display = text.length > maxLength ? text.slice(0, maxLength) + "..." : text;

      return (
        <Popover>
          <PopoverTrigger asChild>
            <span className="cursor-pointer">{display}</span>
          </PopoverTrigger>
          {text.length > maxLength && (
            <PopoverContent className="max-w-80">
              <p className="whitespace-pre-wrap">{text}</p>
            </PopoverContent>
          )}
        </Popover>
      );
    },
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
        Estado
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
