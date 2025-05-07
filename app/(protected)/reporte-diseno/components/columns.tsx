"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, ChevronUp, MoreHorizontal } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { ReporteDiseño } from "../type"

export const columns: ColumnDef<ReporteDiseño>[] = [
  {
    accessorKey: "empleado",
    header: ({ column }) => {
      const sort = column.getIsSorted()
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(sort === "asc")}
          className="text-left"
        >
          Empleado
          <ArrowUpDown className="ml-2 h-4 w-4" />
          {sort === "asc" && <ChevronUp className="ml-1 h-4 w-4" />}
          {sort === "desc" && <ChevronDown className="ml-1 h-4 w-4" />}
        </Button>
      )
    },
  },
  {
    accessorKey: "tipoSeccion",
    header: ({ column }) => {
      const sort = column.getIsSorted()
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(sort === "asc")}
          className="text-left"
        >
          Sección
          <ArrowUpDown className="ml-2 h-4 w-4" />
          {sort === "asc" && <ChevronUp className="ml-1 h-4 w-4" />}
          {sort === "desc" && <ChevronDown className="ml-1 h-4 w-4" />}
        </Button>
      )
    },
  },
  {
    accessorKey: "fechaRegistro",
    header: ({ column }) => {
      const sort = column.getIsSorted()
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(sort === "asc")}
          className="text-left"
        >
          Fecha
          <ArrowUpDown className="ml-2 h-4 w-4" />
          {sort === "asc" && <ChevronUp className="ml-1 h-4 w-4" />}
          {sort === "desc" && <ChevronDown className="ml-1 h-4 w-4" />}
        </Button>
      )
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue<string>("fechaRegistro"))
      return <span>{date.toLocaleDateString()}</span>
    },
  },
  {
    id: "paginas",
    header: "Páginas",
    accessorFn: row => `${row.paginaInicio} - ${row.paginaFin}`,
    cell: info => <span>{info.getValue<string>()}</span>,
  },
  {
    id: "horario",
    header: "Horario",
    accessorFn: row => `${row.horaInicio} - ${row.horaFin}`,
    cell: info => <span>{info.getValue<string>()}</span>,
  },
  {
    accessorKey: "observacion",
    header: "Observación",
    cell: ({ row }) => {
      const observacion = row.getValue<string>("observacion");
      return <span>{observacion ? observacion : "Sin Observación"}</span>;
    },
  },

  {
    id: "actions",
    header: "Acciones",
    enableSorting: false,
    cell: ({ row }) => {
      const reporte = row.original
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menú de acciones</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
            <Link href={`/reporte-diseno/${reporte.id}/edit`}>
              <DropdownMenuItem>Editar</DropdownMenuItem>
            </Link>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
