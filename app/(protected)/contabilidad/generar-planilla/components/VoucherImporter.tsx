// components/VoucherImporter.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { getTemplate, saveVouchers } from "../actions";
import {
    DetalleVoucherDto,
    TipoDeduccionTemplate,
    VoucherDto,
    VoucherTemplateResponse,
} from "../types";

type RowData = Record<string, string | number | null>;

export function VoucherImporter() {
    const { toast } = useToast();
    const [data, setData] = useState<RowData[]>([]);
    const [tipos, setTipos] = useState<TipoDeduccionTemplate[]>([]);
    const [fechaPago, setFechaPago] = useState<string>("");

    useEffect(() => {
        getTemplate().then((json: VoucherTemplateResponse) => {
            setTipos(json.tiposDeducciones);
        });
    }, []);

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target?.result as string;
            const wb = XLSX.read(bstr, { type: "binary" });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const json = XLSX.utils.sheet_to_json<RowData>(ws, { raw: false });
            setData(json);
        };
        reader.readAsBinaryString(file);
    };

    const handleSave = async () => {
        if (!fechaPago) {
            toast({
                title: "Seleccione una fecha",
                description: "Por favor, seleccione una fecha de pago.",
                variant: "destructive",
            });
            return;
        }

        try {
            const vouchers: VoucherDto[] = data.map((row) => {
                const v: VoucherDto = {
                    empleadoId: row["EmpleadoId"] as string,
                    fechaPago,
                    diasTrabajados: Number(row["DiasTrabajados"] || 0),
                    salarioDiario: Number(row["SalarioDiario"] || 0),
                    salarioMensual: Number(row["SalarioMensual"] || 0),
                    netoPagar: Number(row["NetoPagar"] || 0),
                    observaciones: (row["Observaciones"] as string) || "",
                    detalles: [],
                };

                tipos.forEach((t) => {
                    const monto = Number(row[t.nombre] || 0);
                    if (monto > 0) {
                        const det: DetalleVoucherDto = {
                            tipoDeduccionId: t.id,
                            tipoDeduccionNombre: t.nombre,
                            monto: monto.toString(),
                        };
                        v.detalles.push(det);
                    }
                });

                return v;
            });

            await saveVouchers(vouchers);
            toast({
                title: "Exito",
                description: "Los vouchers se han guardado correctamente."
            });
        } catch (error) {
            toast({
                title: "Error",
                variant: "destructive",
                description: "No se pudieron guardar los vouchers.",
            });
            console.error(error);
        }
    };

    const columns = data[0] ? Object.keys(data[0]) : [];

    return (
        <div className="space-y-4">
            <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:space-x-4 sm:space-y-0">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                                "w-full sm:w-[280px] justify-start text-left font-normal",
                                !fechaPago && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {fechaPago ? fechaPago : <span>Seleccione una fecha</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar
                            mode="single"
                            selected={fechaPago ? new Date(fechaPago) : undefined}
                            onSelect={(date) => setFechaPago(date ? date.toISOString().split("T")[0] : "")}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
                <Input type="file" accept=".xlsx, .xls" onChange={handleFile} className="w-full sm:w-auto" />
                <Button onClick={handleSave} className="w-full sm:w-auto">
                    Guardar Vouchers
                </Button>
            </div>

            {data.length > 0 && (
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {columns.map((col) => (
                                    <TableHead key={col}>{col}</TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((row, i) => (
                                <TableRow key={i}>
                                    {columns.map((col) => (
                                        <TableCell key={col}>{row[col]?.toString() ?? ""}</TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
}
