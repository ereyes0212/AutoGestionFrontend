"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, FileSpreadsheet, Upload } from "lucide-react";
import type React from "react";
import { useState } from "react";
import * as XLSX from "xlsx";

type RawRow = Record<string, any>;

interface EmployeeDto {
    identidad: string;
    nombres: string;
    apellidos: string;
    fechaNacimiento: string; // "YYYY-MM-DD"
    genero: string;
    departamento: string;
    ciudad: string;
    colonia: string;
    telefono: string;
    email: string;
    profesion: string;
    fechaIngreso: string; // "YYYY-MM-DD"
    cargo: string;        // puesto
}

export function EmployeeImporter() {
    const { toast } = useToast();
    const [data, setData] = useState<EmployeeDto[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string>("");

    /**
     * Mapeo de meses en español (sin tildes) a dos dígitos.
     */
    const monthMap: Record<string, string> = {
        ENERO: "01",
        FEBRERO: "02",
        MARZO: "03",
        ABRIL: "04",
        MAYO: "05",
        JUNIO: "06",
        JULIO: "07",
        AGOSTO: "08",
        SEPTIEMBRE: "09",
        OCTUBRE: "10",
        NOVIEMBRE: "11",
        DICIEMBRE: "12",
    };

    /**
     * Recibe tres claves (por ejemplo "Dia", "Mes", "Año") y arma "YYYY-MM-DD".
     * - Si “Mes” viene escrito en texto (ej. "DICIEMBRE"), lo traduce a número.
     * - Si día/mes/año vienen con “.0” (número Excel leído como float), se quita la parte decimal.
     * - Si falta cualquiera de las piezas, devuelve cadena vacía.
     */
    const parseDateFromParts = (
        row: RawRow,
        dayKey: string,
        monthKey: string,
        yearKey: string
    ): string => {
        // --- Día ---
        const rawDay = row[dayKey];
        let day = "";
        if (rawDay != null) {
            day = rawDay.toString().trim();
            // Si viene “2.0” o “02.0”, cortamos la parte decimal:
            if (day.includes(".") && /^\d+(\.\d+)?$/.test(day)) {
                day = day.split(".")[0];
            }
            day = day.padStart(2, "0"); // ej. "2" → "02"
        }

        // --- Mes ---
        const rawMonth = row[monthKey]?.toString().trim().toUpperCase() ?? "";
        let month = "";
        if (rawMonth) {
            // Si es palabra (“DICIEMBRE”), buscar en el map
            if (monthMap[rawMonth]) {
                month = monthMap[rawMonth];
            } else {
                // Si es número (ej. “12” o “12.0”), quita decimales y rellena
                let m = rawMonth;
                if (m.includes(".") && /^\d+(\.\d+)?$/.test(m)) {
                    m = m.split(".")[0];
                }
                month = m.padStart(2, "0");
            }
        }

        // --- Año ---
        const rawYear = row[yearKey];
        let year = "";
        if (rawYear != null) {
            year = rawYear.toString().trim();
            // Si viene con “.0”, eliminar la parte decimal:
            if (year.includes(".") && /^\d+(\.\d+)?$/.test(year)) {
                year = year.split(".")[0];
            }
        }

        if (!year || !month || !day) {
            return "";
        }
        const iso = `${year}-${month}-${day}`;
        const d = new Date(iso);
        return isNaN(d.getTime()) ? "" : iso;
    };

    /**
     * A partir de una fila “RawRow” convierte a EmployeeDto.
     * - Para identidad: borra la parte decimal si aparece “.0”.
     * - Para fechas, usa parseDateFromParts con las claves exactas ("Dia"/"Mes"/"Año" vs "Dia.1"/"Mes.1"/"Año.1").
     */
    const transformRow = (row: RawRow): EmployeeDto => {
        // --- Procesar “Numero de Identificacion” para quitar “.0” si fuera necesario ---
        const rawId = row["Numero de Identificacion"];
        let identidad = "";
        if (rawId != null) {
            identidad = rawId.toString().trim();
            if (identidad.includes(".") && /^\d+(\.\d+)?$/.test(identidad)) {
                identidad = identidad.split(".")[0];
            }
        }

        return {
            identidad,
            nombres: row["Nombres"]?.toString().trim() ?? "",
            apellidos: row["Apellidos"]?.toString().trim() ?? "",

            // --- FECHA DE NACIMIENTO (columnas “Dia”, “Mes”, “Año”) ---
            fechaNacimiento: parseDateFromParts(row, "Dia", "Mes", "Año"),

            genero: row["Genero"]?.toString().trim() ?? "",
            departamento: row["Departamento de Domicilio"]?.toString().trim() ?? "",
            ciudad: row["Ciudad de Domicilio"]?.toString().trim() ?? "",
            colonia: row["Colonia/Barrio/Aldea"]?.toString().trim() ?? "",
            telefono: row["Número de Celular de Cliente"]?.toString().trim() ?? "",
            email: row["Correo Electronico Personal"]?.toString().trim() ?? "",
            profesion: row["Profesion u oficio"]?.toString().trim() ?? "",

            // --- FECHA DE INGRESO (columnas “Dia.1”, “Mes.1”, “Año.1”) ---
            fechaIngreso: parseDateFromParts(row, "Dia.1", "Mes.1", "Año.1"),

            cargo: row["Cargo que desempeña"]?.toString().trim() ?? "",
        };
    };

    /**
     * Al cargar el archivo:
     * 1) Leemos el Excel con header:1 para obtener la fila de encabezados en índice 1.
     * 2) Creamos nombres únicos para los encabezados duplicados.
     * 3) Reconstruimos cada fila solo con las columnas “útiles” (incluyendo “Dia” vs “Dia.1”).
     * 4) Aplicamos transformRow para generar EmployeeDto.
     */
    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        setError("");
        setData([]);

        try {
            const arrayBuffer = await file.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer, {
                type: "array",
                cellDates: true,
                cellText: false,
                cellNF: false,
            });

            if (!workbook.SheetNames.length) {
                throw new Error("El Excel no contiene hojas de trabajo.");
            }
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];

            // --- IMPORTANTE: leemos con header:1 ---
            // rawJson[0] = títulos generales (“FECHA DE NACIMIENTO”, “DATOS ECONOMICOS”, etc.)
            // rawJson[1] = fila real de encabezados: “N°”, “Numero de Identificacion”, “Nombres”, “Apellidos”, “Dia”, “Mes”, “Año”, …, “Dia”, “Mes”, “Año”, “Cargo que desempeña”, …
            const rawJson: RawRow[] = XLSX.utils.sheet_to_json(worksheet, {
                header: 1,
                raw: false,
                defval: "",
                blankrows: false,
            });

            if (rawJson.length < 2) {
                throw new Error("El archivo debe tener al menos dos filas: una general y otra con encabezados.");
            }

            // Obtenemos la segunda fila, que es la fila de encabezados reales
            const headersRow = rawJson[1] as string[];
            const rows = rawJson.slice(2) as any[][]; // el resto de filas (datos)

            // --- 1) Generar encabezados únicos (para no pisar “Dia” → “Dia.1”) ---
            const headerCounts: Record<string, number> = {};
            const uniqueHeaders = headersRow.map((h) => {
                const title = h?.toString().trim() ?? "";
                if (!title) return "";
                if (headerCounts[title] == null) {
                    headerCounts[title] = 0;
                    return title;
                } else {
                    headerCounts[title]++;
                    return `${title}.${headerCounts[title]}`; // “Dia” → “Dia.1” en segundo encuentro
                }
            });

            // --- 2) Defino las columnas que necesito, ya con nombres únicos ---
            const columnasUtiles = [
                "Numero de Identificacion",
                "Nombres",
                "Apellidos",
                "Dia",     // fechaNacimiento - día
                "Mes",     // fechaNacimiento - mes
                "Año",     // fechaNacimiento - año
                "Genero",
                "Departamento de Domicilio",
                "Ciudad de Domicilio",
                "Colonia/Barrio/Aldea",
                "Número de Celular de Cliente",
                "Correo Electronico Personal",
                "Profesion u oficio",
                "Dia.1",   // fechaIngreso - día
                "Mes.1",   // fechaIngreso - mes
                "Año.1",   // fechaIngreso - año
                "Cargo que desempeña",
            ];

            // --- 3) Reconstruir cada fila usando uniqueHeaders como clave ---
            const reconstructed: RawRow[] = rows.map((rowArr) => {
                const obj: RawRow = {};
                uniqueHeaders.forEach((colName, idx) => {
                    if (columnasUtiles.includes(colName)) {
                        obj[colName] = rowArr[idx];
                    }
                });
                return obj;
            });

            // --- 4) Transformar cada RawRow filtrado a EmployeeDto ---
            const empleados = reconstructed.map((r) => {
                try {
                    return transformRow(r);
                } catch {
                    return transformRow({} as RawRow);
                }
            });

            // Filtrar filas vacías (sin identidad, nombre o apellido)
            const empleadosValidos = empleados.filter(
                (emp) =>
                    emp.identidad !== "" ||
                    emp.nombres !== "" ||
                    emp.apellidos !== ""
            );

            if (!empleadosValidos.length) {
                throw new Error("No se encontraron empleados válidos en el archivo.");
            }

            setData(empleadosValidos);
            toast({
                title: "Archivo cargado",
                description: `Se detectaron ${empleadosValidos.length} empleados válidos.`,
            });
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Error desconocido";
            setError(msg);
            toast({
                title: "Error al procesar Excel",
                description: msg,
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveAll = async () => {
        if (!data.length) {
            toast({
                title: "Sin datos",
                description: "Carga primero un archivo Excel con empleados.",
                variant: "destructive",
            });
            return;
        }

        setIsSaving(true);
        try {
            // Acá podrías llamar tu API, por ejemplo:
            // await fetch("/api/import-empleados", { method: "POST", body: JSON.stringify(data) });

            // Simulación de retraso para mostrar “Guardando…”
            await new Promise((r) => setTimeout(r, 1500));

            toast({
                title: "Empleados guardados",
                description: `${data.length} registros procesados correctamente.`,
            });
            // Si querés limpiar después:
            // setData([]);
        } catch (err) {
            console.error("Error guardando:", err);
            toast({
                title: "Error guardando",
                variant: "destructive",
                description: "Hubo un problema al guardar los empleados.",
            });
        } finally {
            setIsSaving(false);
        }
    };

    // Columnas que mostramos en la tabla
    const columnLabels: { key: keyof EmployeeDto; label: string }[] = [
        { key: "identidad", label: "Identidad" },
        { key: "nombres", label: "Nombres" },
        { key: "apellidos", label: "Apellidos" },
        { key: "fechaNacimiento", label: "Fecha Nac." },
        { key: "genero", label: "Género" },
        { key: "departamento", label: "Departamento" },
        { key: "ciudad", label: "Ciudad" },
        { key: "colonia", label: "Colonia/Barrio/Aldea" },
        { key: "telefono", label: "Teléfono" },
        { key: "email", label: "Email" },
        { key: "profesion", label: "Profesión" },
        { key: "fechaIngreso", label: "Fecha Ingreso" },
        { key: "cargo", label: "Cargo" },
    ];

    return (
        <div className="space-y-6">
            {/* Zona de carga de archivo + botón de guardado */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-4">
                <div className="flex items-center gap-2">
                    <Input
                        type="file"
                        accept=".xlsx,.xls,.xlsm"
                        onChange={handleFile}
                        disabled={isLoading}
                        className="max-w-xs"
                    />
                    {isLoading && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Upload className="h-4 w-4 animate-spin" />
                            Cargando…
                        </div>
                    )}
                </div>

                <Button
                    onClick={handleSaveAll}
                    disabled={isSaving || !data.length}
                    className="flex items-center gap-2"
                >
                    <FileSpreadsheet className="h-4 w-4" />
                    {isSaving ? "Guardando…" : `Guardar ${data.length} Empleados`}
                </Button>
            </div>

            {/* Si ocurrió un error, lo mostramos */}
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Tabla con los empleados filtrados */}
            {data.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FileSpreadsheet className="h-4 w-4" />
                        {data.length} empleados listos para guardar
                    </div>

                    <div className="overflow-x-auto border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    {columnLabels.map(({ key, label }) => (
                                        <TableHead key={key} className="whitespace-nowrap">
                                            {label}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.slice(0, 100).map((row, rowIndex) => (
                                    <TableRow key={rowIndex}>
                                        {columnLabels.map(({ key }) => (
                                            <TableCell key={key} className="whitespace-nowrap">
                                                {row[key] || "-"}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        {data.length > 100 && (
                            <div className="p-4 text-center text-sm text-muted-foreground border-t">
                                Mostrando los primeros 100 empleados de {data.length} en total
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
