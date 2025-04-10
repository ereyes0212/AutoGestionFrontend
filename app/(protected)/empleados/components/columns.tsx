"use client";
import { ArrowUpDown, Check, CheckCircleIcon, UserX } from "lucide-react";
// import { FormateadorFecha } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, CheckCircle, XCircleIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { Empleado } from "../type";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export const columns: ColumnDef<Empleado>[] = [

  {
    accessorKey: "nombre", // La columna principal, que será 'nombre'
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-left"
      >
        Nombre
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      // Concatenar 'nombre' y 'apellido' usando row.original
      const nombre = row.original.nombre || "";
      const apellido = row.original.apellido || ""; // Acceder al apellido desde row.original
      const nombreCompleto = `${nombre} ${apellido}`.trim(); // Concatenar y eliminar espacios extras
      return nombreCompleto; // Mostrar el nombre completo
    },
  },


  {
    accessorKey: "edad",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-center"
      >
        Edad
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "usuario",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-left"
      >
        Usuario
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const usuario = row.getValue("usuario");
      return usuario ? usuario : <UserX className="text-gray-500 w-5 h-5" />;
    },
  },
  {
    accessorKey: "puesto",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-left"
      >
        Puesto
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "jefe",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-left"
      >
        Jefe
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "empresa",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-left"
      >
        Empresas
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const empresas = row.original.empresas || [];

      return (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="default" className="text-left w-full">
              {empresas.length > 0 ? "Ver empresas" : "Sin empresas"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full">
            {empresas.length > 0 ? (
              empresas.map((cliente) => (
                <div key={cliente.id} className="flex items-center space-x-2">
                  <CheckCircleIcon className="text-green-500" />
                  <span>{cliente.nombre}</span>
                </div>
              ))
            ) : (
              <div>No hay empresas asociadas</div>
            )}
          </PopoverContent>
        </Popover>
      );
    },
  },
  {
    accessorKey: "genero",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-left"
      >
        Genero
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },

  {
    accessorKey: "activo",
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
      const isActive = row.getValue("activo");
      return (
        <div className="">
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
      const empleado = row.original;

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
            <Link href={`/empleados/${empleado.id}/edit`}>
              <DropdownMenuItem>Editar</DropdownMenuItem>
            </Link>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
