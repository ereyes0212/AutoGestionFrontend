// components/TemplateGenerator.tsx
"use client";

import { Button } from "@/components/ui/button";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { getTemplate } from "../actions";
import { EmpleadoTemplate, VoucherTemplateResponse } from "../types";

type RowData = Record<string, string | number | null>;

export function TemplateGenerator() {
    const generate = async () => {
        const { empleados, tiposDeducciones }: VoucherTemplateResponse = await getTemplate();

        // 1) Encabezados fijos
        const baseHeaders = [
            "EmpleadoId",
            "NombreCompleto",
            "DiasTrabajados",
            "SalarioDiario",
            "SalarioMensual",
            "NetoPagar",
            "Observaciones",      // ← agregado
        ];

        // 2) Encabezados dinámicos de deducciones
        const deduccionHeaders = tiposDeducciones.map((t) => t.nombre);
        const headers = [...baseHeaders, ...deduccionHeaders];

        // 3) Filas iniciales
        const data: RowData[] = empleados.map((e: EmpleadoTemplate) => {
            const row: RowData = {
                EmpleadoId: e.empleadoId,
                NombreCompleto: e.nombreCompleto,
                DiasTrabajados: e.diasTrabajados,
                SalarioDiario: e.salarioDiario,
                SalarioMensual: e.salarioMensual,
                NetoPagar: e.netoPagar,
                Observaciones: "",    // ← agregado
            };
            deduccionHeaders.forEach((col) => (row[col] = 0));
            return row;
        });

        // 4) Generar y descargar Excel
        const ws = XLSX.utils.json_to_sheet(data, { header: headers });
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Plantilla");
        const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        saveAs(new Blob([wbout]), "plantilla_vouchers.xlsx");
    };

    return <Button onClick={generate}>Generar plantilla</Button>;
}
