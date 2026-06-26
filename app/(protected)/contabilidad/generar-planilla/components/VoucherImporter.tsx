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
import { AlertCircle, CalendarIcon, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { getTemplate, previewPayrollImport, saveVouchers, sendVoucherEmails } from "../actions";
import { PayrollImportRow, VoucherDto, VoucherTemplateResponse } from "../types";

export function VoucherImporter() {
    const { toast } = useToast();

    const [data, setData] = useState<PayrollImportRow[]>([]);
    const [fechaPago, setFechaPago] = useState<string>("");
    const [voucherIds, setVoucherIds] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        getTemplate().then((_: VoucherTemplateResponse) => undefined);
    }, []);

    // ── Carga del archivo ──────────────────────────────────────────────────────
    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const buffer = await file.arrayBuffer();
        const XLSX = await import("xlsx");
        const wb = XLSX.read(buffer, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];

        /**
         * Leemos como arrays (header:1) para preservar la posición exacta
         * de cada celda, igual que haría openpyxl en el servidor.
         *
         * - defval: null  → celdas vacías llegan como null, no se omiten
         * - raw: false    → fórmulas resueltas a su valor calculado
         */
        const rawRows: any[][] = XLSX.utils.sheet_to_json(ws, {
            header: 1,
            defval: null,
            raw: false,
        });

        // Enviamos los arrays crudos; el servidor hace toda la normalización
        const preview = await previewPayrollImport(rawRows);
        setData(preview.rows);
        setVoucherIds([]);
    };

    // ── Guardar ───────────────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!fechaPago) {
            toast({
                title: "Seleccione una fecha",
                description: "Por favor, seleccione una fecha de pago.",
                variant: "destructive",
            });
            return;
        }

        const invalidRows = data.filter((r) => r.estado === "ERROR");
        if (invalidRows.length > 0) {
            toast({
                title: "Planilla con errores",
                description: `Hay ${invalidRows.length} empleado(s) sin validar. Corrija los errores antes de guardar.`,
                variant: "destructive",
            });
            return;
        }

        setIsSaving(true);
        try {
            const vouchers: VoucherDto[] = data.map((row) => ({ ...row, fechaPago }));
            const createdIds = await saveVouchers(vouchers);
            setVoucherIds(createdIds);
            toast({
                title: "Éxito",
                description: `${createdIds.length} voucher(s) guardados correctamente.`,
            });
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "No se pudieron guardar los vouchers.",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    // ── Enviar correos ────────────────────────────────────────────────────────
    const handleSendEmails = async () => {
        if (voucherIds.length === 0) {
            toast({
                title: "Nada para enviar",
                description: "Guarde los vouchers primero.",
                variant: "destructive",
            });
            return;
        }

        setIsSending(true);
        try {
            const { sent, failed } = await sendVoucherEmails(voucherIds);
            if (sent.length > 0) {
                toast({
                    title: "Correos enviados",
                    description: `${sent.length} correo(s) enviados correctamente.`,
                });
            }
            if (failed.length > 0) {
                toast({
                    title: "Algunos fallaron",
                    description: `${failed.length} correo(s) no se pudieron enviar.`,
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error(error);
            toast({
                title: "Error general",
                description: "Ocurrió un error al intentar enviar los correos.",
                variant: "destructive",
            });
        } finally {
            setIsSending(false);
        }
    };

    // ── Render ────────────────────────────────────────────────────────────────
    const columns = [
        "rowNumber", "estado", "empleadoNombre", "dni", "puesto", "oficina",
        "diasTrabajados", "salarioDiario", "salarioMensual", "totalDeducciones",
        "reembolsos", "retroactivoSM", "bonos", "feriados", "netoPagar",
        "metodoPago", "errores",
    ] as const;

    return (
        <div className="space-y-4">
            <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:space-x-4 sm:space-y-0">
                {/* Fecha de pago */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className={cn(
                                "w-full sm:w-[280px] justify-start text-left font-normal",
                                !fechaPago && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {fechaPago || <span>Seleccione una fecha</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar
                            mode="single"
                            onSelect={(date) =>
                                setFechaPago(date ? date.toISOString().split("T")[0] : "")
                            }
                        />
                    </PopoverContent>
                </Popover>

                {/* Selector de archivo */}
                <Input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFile}
                    className="w-full sm:w-auto"
                />

                {/* Guardar */}
                <Button
                    onClick={handleSave}
                    disabled={isSaving || data.length === 0}
                    className="w-full sm:w-auto"
                >
                    {isSaving ? "Guardando..." : "Guardar Vouchers"}
                </Button>

                {/* Enviar correos */}
                <Button
                    onClick={handleSendEmails}
                    variant="secondary"
                    disabled={isSending || voucherIds.length === 0}
                    className="w-full sm:w-auto"
                >
                    {isSending ? "Enviando correos..." : "Enviar Emails"}
                </Button>
            </div>

            {/* Tabla de preview */}
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
                                        <TableCell key={col}>
                                            {col === "estado" ? (
                                                row.estado === "VALIDO"
                                                    ? <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                    : <AlertCircle className="h-4 w-4 text-red-600" />
                                            ) : Array.isArray(row[col])
                                                ? (row[col] as string[]).join(", ")
                                                : row[col]?.toString() ?? ""}
                                        </TableCell>
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