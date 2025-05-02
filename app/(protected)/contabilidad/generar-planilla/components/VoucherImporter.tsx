// components/VoucherImporter.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
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
            alert("Seleccione la fecha de pago");
            return;
        }
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
        alert("Vouchers guardados correctamente");
    };

    const columns = data[0] ? Object.keys(data[0]) : [];

    return (
        <div className="space-y-4">
            <div className="flex items-center space-x-4">
                <Input
                    type="date"
                    value={fechaPago}
                    onChange={(e) => setFechaPago(e.target.value)}
                />
                <Input type="file" accept=".xlsx, .xls" onChange={handleFile} />
                <Button onClick={handleSave}>Guardar Vouchers</Button>
            </div>

            {data.length > 0 && (
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
            )}
        </div>
    );
}
