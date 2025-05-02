"use client";
import { ArrowUpDown, MoreHorizontal, UserX } from "lucide-react";
// import { FormateadorFecha } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatLempiras } from "@/lib/utils";
import Link from "next/link";
import { RegistroPago } from "../type";

export const columns: ColumnDef<RegistroPago>[] = [

  {
    accessorKey: "empleadoNombre",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-left"
      >
        Empleado
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const usuario = row.getValue("empleadoNombre");
      return usuario ? usuario : <UserX className="text-gray-500 w-5 h-5" />;
    },
  },
  {
    accessorKey: "empleadoPuesto",
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
    accessorKey: "observaciones",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-left"
      >
        Observación
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const observacion = row.getValue<string>("observaciones");
      return observacion ? observacion : <span className="text-gray-500">Sin observación</span>;
    },
  },
  {
    accessorKey: "diasTrabajados",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-left"
      >
        Días Trabajados
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "netoPagar",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-left"
      >
        Neto a Pagar
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const netoPagar = row.getValue<number>("netoPagar");

      return <span>{formatLempiras(netoPagar)}</span>;
    },
  },
  {
    accessorKey: "fechaPago",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-left"
      >
        Fecha Pago
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const fechaPago = row.getValue<string>("fechaPago");
      const fechaFormateada = new Date(fechaPago).toLocaleDateString();
      return <span>{fechaFormateada}</span>;
    },
  },

  {
    id: "actions",
    header: "Acciones",
    cell: ({ row }) => {
      const voucher = row.original;

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
            <Link href={`/voucher-pago/${voucher.id}/detalle`}>
              <DropdownMenuItem>Detalle</DropdownMenuItem>
            </Link>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
