/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import * as React from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus } from "lucide-react";
import Link from "next/link";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  excludeColumnKeys?: string[];
}

export function DataTable<TData extends Record<string, any>, TValue>({
  columns,
  data,
  excludeColumnKeys = ["actions"],
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = React.useState<string>("");

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    globalFilterFn: (row) => {
      const rowValues = Object.values(row.original as Record<string, any>);
      return rowValues.some((value) =>
        String(value).toLowerCase().includes(globalFilter.toLowerCase())
      );
    },
  });

  // Mapa de nombres amigables para columnas específicas
  const displayNameMap: Record<string, string> = {
    empleadoCreador: "Creador",
    empleadoAsignado: "Asignado",
    empleadoAprobador: "Aprobador",
    titulo: "Título",
    estado: "Estado",
    // agrega aquí más mapeos si querés
  };

  const columnOptions = React.useMemo(() => {
    return columns
      .map((col) => {
        const accessor = (col as any).accessorKey ?? (col as any).id ?? "";
        // Si existe un displayName en el mapa lo usamos, si no intentamos usar header (si es string)
        const mapped = displayNameMap[String(accessor)];
        const headerLabel =
          mapped ??
          (typeof col.header === "string"
            ? col.header
            : String((col as any).accessorKey ?? (col as any).id ?? accessor));
        return { key: String(accessor), label: headerLabel };
      })
      .filter((c) => c.key && !excludeColumnKeys.includes(c.key));
  }, [columns, excludeColumnKeys]);

  const [selectedColumn, setSelectedColumn] = React.useState<string | undefined>(
    columnOptions[0]?.key
  );

  const uniqueValuesForSelectedColumn = React.useMemo(() => {
    if (!selectedColumn) return [] as string[];
    const setVals = new Set<string>();
    for (const row of data) {
      const raw = row[selectedColumn];
      if (raw === null || raw === undefined) continue;
      setVals.add(String(raw));
    }
    return Array.from(setVals).sort((a, b) => a.localeCompare(b));
  }, [data, selectedColumn]);

  // RESET handler: limpia filtros, global, selectedColumn, sorting y pone la página 0
  const resetAll = React.useCallback(() => {
    setGlobalFilter("");
    setSelectedColumn(undefined);
    setColumnFilters([]);
    setSorting([]);

    table.getAllColumns().forEach((col) => {
      (col as any).setFilterValue?.(undefined);
    });

    if ((table as any).setPageIndex) {
      try {
        (table as any).setPageIndex(0);
      } catch {
        /* noop */
      }
    }
  }, [setGlobalFilter, setSelectedColumn, setColumnFilters, setSorting, table]);

  return (
    <div className="rounded-md border p-4">
      <div className="flex flex-col md:flex-row items-center py-4 justify-between space-y-2 md:space-y-0 md:space-x-4">
        <Input
          placeholder="Filtrar Datos"
          value={globalFilter}
          onChange={(event) => setGlobalFilter(event.target.value)}
          className="w-full md:max-w-sm"
        />
        <div className="flex items-center gap-2">
          <Link href={`/redaccion/create`} className="w-full md:w-auto">
            <Button className="w-full md:w-auto flex items-center gap-2">
              Nueva nota
              <Plus />
            </Button>
          </Link>
          <Button variant="outline" onClick={resetAll}>
            Reset
          </Button>
        </div>
      </div>

      {/* Selector de columna + selector de valores (dinámico) */}
      <div className="flex gap-4 mb-4 items-center">
        <div className="flex flex-col">
          <label className="text-sm text-muted-foreground mb-1">Columna</label>
          <Select
            value={selectedColumn ?? "__none"}
            onValueChange={(val) => {
              setSelectedColumn(val === "__none" ? undefined : val);
            }}
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Selecciona columna" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none">— Ninguna —</SelectItem>
              {columnOptions.map((col) => (
                <SelectItem key={col.key} value={col.key}>
                  {col.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col">
          <label className="text-sm text-muted-foreground mb-1">Valor</label>
          <Select
            value={
              selectedColumn
                ? ((table.getColumn(selectedColumn)?.getFilterValue() as string) ?? "__all")
                : "__none"
            }
            onValueChange={(val) => {
              if (!selectedColumn) return;
              table
                .getColumn(selectedColumn)
                ?.setFilterValue(val === "__all" ? undefined : val);
            }}
            disabled={!selectedColumn}
          >
            <SelectTrigger className="w-[260px]">
              <SelectValue placeholder="Selecciona valor" />
            </SelectTrigger>
            <SelectContent>
              {!selectedColumn ? (
                <SelectItem value="__none">Selecciona una columna primero</SelectItem>
              ) : (
                <>
                  <SelectItem value="__all">Todos</SelectItem>
                  {uniqueValuesForSelectedColumn.length ? (
                    uniqueValuesForSelectedColumn.map((v) => (
                      <SelectItem key={v} value={v}>
                        {v}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="__empty">— Sin valores —</SelectItem>
                  )}
                </>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 ">
                  Sin resultados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
}
