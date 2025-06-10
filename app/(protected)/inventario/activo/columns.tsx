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
import { ArrowUpDown, CheckCircleIcon, MoreHorizontal, XCircleIcon } from "lucide-react";
import Link from "next/link";
import { Activo } from "./types";
export const columns: ColumnDef<Activo>[] = [
    {
        accessorKey: "codigoBarra",
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                className="text-center"
            >
                Código de Barras
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => {
            const codigoBarra = row.getValue("codigoBarra") as string;
            return (
                <div className="font-mono text-sm">
                    {codigoBarra || "No asignado"}
                </div>
            );
        },
    },
    {
        accessorKey: "nombre",
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                className="text-center"
            >
                Nombre
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
    },
    {
        accessorKey: "categoriaId",
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                className="text-center"
            >
                Categoría
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
    },
    {
        accessorKey: "estadoActualId",
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                className="text-center"
            >
                Estado
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
            const activo = row.original;

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
                        <Link href={`/inventario/activo/${activo.id}/edit`}>
                            <DropdownMenuItem>Editar</DropdownMenuItem>
                        </Link>
                        <Link href={`/inventario/activo/${activo.id}/historial`}>
                            <DropdownMenuItem>Ver Historial</DropdownMenuItem>
                        </Link>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
];