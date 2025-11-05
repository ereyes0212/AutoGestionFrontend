"use client";

import { Button } from "@/components/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowUpDown
} from "lucide-react";
import { Nota } from "../types";
import { ActionsCell } from "./actionCell";
import { EstadoCell } from "./EstadCell";
export const columns: ColumnDef<Nota>[] = [
  {
    accessorKey: "titulo",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() =>
          column.toggleSorting(column.getIsSorted() === "asc")
        }
        className="text-center"
      >
        Titulo
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const text = row.original.titulo;
      const maxLength = 25;
      const display =
        text.length > maxLength
          ? text.slice(0, maxLength) + "..."
          : text;

      return (
        <HoverCard openDelay={200} closeDelay={100}>
          <HoverCardTrigger asChild>
            <span className="cursor-pointer">{display}</span>
          </HoverCardTrigger>
          {text.length > maxLength && (
            <HoverCardContent className="max-w-xs">
              <p className="whitespace-pre-wrap">{text}</p>
            </HoverCardContent>
          )}
        </HoverCard>
      );
    },
  },
  {
    id: "empleados",
    header: "Empleados",
    cell: ({ row }: { row: any }) => {
      const { empleadoCreador, empleadoAsignado, empleadoAprobador } =
        row.original;
      const fullDisplay = `Creador: ${empleadoCreador} / Asignado: ${empleadoAsignado} / Aprobador: ${empleadoAprobador}`;
      const maxLength = 30;
      const display =
        fullDisplay.length > maxLength
          ? fullDisplay.slice(0, maxLength) + "..."
          : fullDisplay;

      return (
        <HoverCard openDelay={200} closeDelay={100}>
          <HoverCardTrigger asChild>
            <span className="cursor-pointer">{display}</span>
          </HoverCardTrigger>
          {fullDisplay.length > maxLength && (
            <HoverCardContent className="max-w-xs">
              <p className="whitespace-pre-wrap">
                <strong>Creador:</strong> {empleadoCreador} <br />
                <strong>Asignado:</strong> {empleadoAsignado} <br />
                <strong>Aprobador:</strong> {empleadoAprobador}
              </p>
            </HoverCardContent>
          )}
        </HoverCard>
      );
    },
    filterFn: (row: any, id: string, filterValue: string) => {
      const { empleadoCreador, empleadoAsignado, empleadoAprobador } =
        row.original;
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
        Descripción y fuente
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const descripcion = row.original.descripcion || "";
      const fuente = row.original.fuente || "";
      const maxLength = 30;
      const combinedText = `${descripcion}${fuente ? ` (Fuente: ${fuente})` : ""}`;
      const display =
        combinedText.length > maxLength
          ? combinedText.slice(0, maxLength) + "..."
          : combinedText;

      // Detectar si la fuente es un enlace
      const isUrl = fuente.startsWith("http://") || fuente.startsWith("https://");

      return (
        <HoverCard openDelay={200} closeDelay={100}>
          <HoverCardTrigger asChild>
            <span className="cursor-pointer">{display}</span>
          </HoverCardTrigger>
          {combinedText.length > maxLength && (
            <HoverCardContent className="max-w-80">
              <p className="whitespace-pre-wrap">
                {descripcion}
                {fuente && (
                  <>
                    <br />
                    <strong>Fuente:</strong>{" "}
                    {isUrl ? (
                      <a
                        href={fuente}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline hover:text-blue-800"
                      >
                        {fuente}
                      </a>
                    ) : (
                      fuente
                    )}
                  </>
                )}
              </p>
            </HoverCardContent>
          )}
        </HoverCard>
      );
    },
  },
  {
    accessorKey: "createAt",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-center"
      >
        Creación
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    // filterFn opcional si no enriquecés columnas desde DataTable:
    filterFn: (row: any, id: string, filterValue: string) => {
      const raw = row.original?.createAt;
      if (!raw) return false;
      const date = new Date(raw);
      if (isNaN(date.getTime())) return false;
      const formatted = format(date, "dd/MM/yyyy hh:mm a", { locale: es });
      if (!filterValue || filterValue === "__all") return true;
      return formatted === filterValue;
    },
    cell: ({ row }) => {
      const creacion = row.original.createAt;
      const date = creacion ? new Date(creacion) : undefined;
      // Hora en 12 horas para mostrar en la celda: "08:30 PM"
      const timeDisplay = date ? format(date, "hh:mm a", { locale: es }) : "--:--";
      const fullDisplay = date
        ? format(date, "dd 'de' MMMM yyyy, hh:mm a", { locale: es }) // ejemplo: 31 de octubre 2025, 08:30 PM
        : "Sin fecha";

      return (
        <HoverCard openDelay={200} closeDelay={100}>
          <HoverCardTrigger asChild>
            <span className="cursor-pointer text-sm font-medium">{timeDisplay}</span>
          </HoverCardTrigger>
          <HoverCardContent className="max-w-xs">
            <p className="whitespace-pre-wrap">{fullDisplay}</p>
          </HoverCardContent>
        </HoverCard>
      );
    },
  },


  {
    accessorKey: "estado",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() =>
          column.toggleSorting(column.getIsSorted() === "asc")
        }
        className="text-left"
      >
        Estado
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <EstadoCell estado={row.original.estado} feedback={row.original.fellback || ''} esPrioridad={row.original.esPrioridad} esUltimaHora={row.original.esUltimaHora} />,
  }
  ,
  {
    id: "actions",
    header: "Acciones",
    cell: ({ row }) => <ActionsCell nota={row.original} />,
  },

];
