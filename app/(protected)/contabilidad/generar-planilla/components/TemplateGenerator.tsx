"use client";

import { Button } from "@/components/ui/button";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { getTemplate } from "../actions";
import { EmpleadoTemplate, VoucherTemplateResponse } from "../types";

type RowData = Record<string, string | number | null>;

export function TemplateGenerator() {
    const generate = async () => {
        const { empleados, ajustes }: VoucherTemplateResponse = await getTemplate();

        const baseHeaders = [
            "EmpleadoId",
            "NombreCompleto",
            "DiasTrabajados",
            "SalarioDiario",
            "SalarioMensual",
        ];

        const ajusteHeaders = ajustes.map((a) => a.nombre);
        const obsHeader = ["Observaciones"];
        const formulaHeaders = [
            "SalarioQuincena",
            "TotalDeducciones",
            "TotalBonos",
            "NetoPagar",
        ];

        const headers = [
            ...baseHeaders,
            ...ajusteHeaders,
            ...obsHeader,
            ...formulaHeaders,
        ];

        const data: RowData[] = empleados.map((e: EmpleadoTemplate) => {
            const row: RowData = {
                EmpleadoId: e.empleadoId,
                NombreCompleto: e.nombreCompleto,
                DiasTrabajados: e.diasTrabajados,
                SalarioDiario: e.salarioDiario,
                SalarioMensual: e.salarioMensual,
            };
            ajustes.forEach((adj) => {
                row[adj.nombre] = adj.montoPorDefecto;
            });
            row["Observaciones"] = "";
            formulaHeaders.forEach((col) => {
                row[col] = null;
            });
            return row;
        });

        const ws = XLSX.utils.json_to_sheet(data, { header: headers });

        const headerIndexMap: Record<string, number> = {};
        headers.forEach((h, idx) => {
            headerIndexMap[h] = idx;
        });

        const deduccionCols: string[] = [];
        const bonoCols: string[] = [];
        ajustes.forEach((adj) => {
            const colIndex = headerIndexMap[adj.nombre];
            const colLetter = XLSX.utils.encode_col(colIndex);
            if (adj.categoria === "DEDUCCION") deduccionCols.push(colLetter);
            else bonoCols.push(colLetter);
        });

        const startRow = 2;
        const endRow = empleados.length + 1;

        for (let row = startRow; row <= endRow; row++) {
            const diasCol = XLSX.utils.encode_col(headerIndexMap["DiasTrabajados"]);
            const diarioCol = XLSX.utils.encode_col(headerIndexMap["SalarioDiario"]);
            const salarioQuincenaCol = XLSX.utils.encode_col(headerIndexMap["SalarioQuincena"]);
            const totalDeduccionesCol = XLSX.utils.encode_col(headerIndexMap["TotalDeducciones"]);
            const totalBonosCol = XLSX.utils.encode_col(headerIndexMap["TotalBonos"]);
            const netoCol = XLSX.utils.encode_col(headerIndexMap["NetoPagar"]);

            // Redondear SalarioQuincena al entero más cercano
            const salarioQuincenaFormula = `=ROUND(${diarioCol}${row}*${diasCol}${row},0)`;
            ws[`${salarioQuincenaCol}${row}`] = { f: salarioQuincenaFormula };

            if (deduccionCols.length > 0) {
                const sumDedParts = deduccionCols.map((col) => `${col}${row}`);
                const totalDeduccionesFormula = `=SUM(${sumDedParts.join(",")})`;
                ws[`${totalDeduccionesCol}${row}`] = { f: totalDeduccionesFormula };
            } else {
                ws[`${totalDeduccionesCol}${row}`] = { v: 0 };
            }

            if (bonoCols.length > 0) {
                const sumBonParts = bonoCols.map((col) => `${col}${row}`);
                const totalBonosFormula = `=SUM(${sumBonParts.join(",")})`;
                ws[`${totalBonosCol}${row}`] = { f: totalBonosFormula };
            } else {
                ws[`${totalBonosCol}${row}`] = { v: 0 };
            }

            const netoFormula = `=${salarioQuincenaCol}${row} - ${totalDeduccionesCol}${row} + ${totalBonosCol}${row}`;
            ws[`${netoCol}${row}`] = { f: netoFormula };
        }

        const range = XLSX.utils.decode_range(ws["!ref"]!);
        range.e.c = headers.length - 1;
        range.e.r = endRow - 1;
        ws["!ref"] = XLSX.utils.encode_range(range);

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Plantilla");
        const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        saveAs(new Blob([wbout]), "plantilla_vouchers.xlsx");
    };

    return <Button onClick={generate}>Generar plantilla</Button>;
}
