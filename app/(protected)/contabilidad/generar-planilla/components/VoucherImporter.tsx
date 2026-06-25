"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { AlertCircle, CalendarIcon, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
    VoucherDto,
    PayrollImportRow,
    VoucherTemplateResponse,
} from "../types";

// Importamos las acciones del servidor
import { getTemplate, previewPayrollImport, saveVouchers, sendVoucherEmails } from "../actions";

type RowData = Record<string, string | number | null>;

const columnAliases: Record<string, string[]> = {
    no: ["No.", "No", "N°"],
    empleadoNombre: ["Nombre de Empleado", "Empleado", "NombreCompleto"],
    dni: ["DNI", "Identidad", "Número Identificación", "Numero Identificacion"],
    puesto: ["Puesto"],
    oficina: ["Oficina"],
    diasTrabajados: ["Días Trabajados", "Dias Trabajados", "DiasTrabajados"],
    salarioDiario: ["Salario Diario", "SalarioDiario"],
    salarioMensual: ["Salario Mensual", "SalarioMensual"],
    retencionFuenteISR: ["Retención en la Fuente ISR", "Retencion en la Fuente ISR"],
    retencionIHSS: ["Retención IHSS", "Retencion IHSS"],
    retencionRAP: ["Retención RAP", "Retencion RAP"],
    impuestoPersonalMunicipal: ["Impuesto Personal Municipal"],
    deduccionAnticipoSalario: ["Deducción por Anticipo de Salario", "Deduccion por Anticipo de Salario"],
    totalDeducciones: ["Total Deducciones"],
    reembolsos: ["Reembolsos"],
    retroactivoSM: ["Retroactivo SM"],
    bonos: ["Bonos"],
    feriados: ["Feriados"],
    netoPagar: ["Neto a Pagar", "NetoPagar"],
    metodoPago: ["Método de Pago", "Metodo de Pago"],
};

function getValue(row: RowData, key: string) {
    const aliases = columnAliases[key] ?? [key];
    return aliases.map((alias) => row[alias]).find((value) => value !== undefined && value !== null && value !== "");
}

function toNumber(value: unknown) {
    if (typeof value === "number") return value;
    if (!value) return 0;
    return Number(String(value).replace(/,/g, "")) || 0;
}

export function VoucherImporter() {
    const { toast } = useToast();

    // Estados para archivos + template
    const [data, setData] = useState<PayrollImportRow[]>([]);
    const [fechaPago, setFechaPago] = useState<string>("");

    // IDs de vouchers recién guardados
    const [voucherIds, setVoucherIds] = useState<string[]>([]);

    // Estados de carga para botones
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [isSending, setIsSending] = useState<boolean>(false);

    const loadXlsx = async () => import("xlsx");

    // Cargar el template (ajustes) al iniciar
    useEffect(() => {
        getTemplate().then((_json: VoucherTemplateResponse) => undefined);
    }, []);

    // Manejar selección de archivo Excel
    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (evt) => {
            const bstr = evt.target?.result as string;
            const XLSX = await loadXlsx();
            const wb = XLSX.read(bstr, { type: "binary" });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const json = XLSX.utils.sheet_to_json<RowData>(ws, { raw: false });
            const parsed = json.map((row) => ({
                empleadoNombre: String(getValue(row, "empleadoNombre") ?? ""),
                dni: String(getValue(row, "dni") ?? ""),
                puesto: String(getValue(row, "puesto") ?? ""),
                oficina: String(getValue(row, "oficina") ?? ""),
                fechaPago,
                diasTrabajados: toNumber(getValue(row, "diasTrabajados")),
                salarioDiario: toNumber(getValue(row, "salarioDiario")),
                salarioMensual: toNumber(getValue(row, "salarioMensual")),
                retencionFuenteISR: toNumber(getValue(row, "retencionFuenteISR")),
                retencionIHSS: toNumber(getValue(row, "retencionIHSS")),
                retencionRAP: toNumber(getValue(row, "retencionRAP")),
                impuestoPersonalMunicipal: toNumber(getValue(row, "impuestoPersonalMunicipal")),
                deduccionAnticipoSalario: toNumber(getValue(row, "deduccionAnticipoSalario")),
                totalDeducciones: toNumber(getValue(row, "totalDeducciones")),
                reembolsos: toNumber(getValue(row, "reembolsos")),
                retroactivoSM: toNumber(getValue(row, "retroactivoSM")),
                bonos: toNumber(getValue(row, "bonos")),
                feriados: toNumber(getValue(row, "feriados")),
                netoPagar: toNumber(getValue(row, "netoPagar")),
                metodoPago: String(getValue(row, "metodoPago") ?? ""),
                observaciones: `Oficina: ${String(getValue(row, "oficina") ?? "")}`,
            }));
            const preview = await previewPayrollImport(parsed);
            setData(preview.rows);
            setVoucherIds([]);
        };
        reader.readAsBinaryString(file);
    };

    // Acción: Guardar vouchers (solo guarda, no envía emails)
    const handleSave = async () => {
        if (!fechaPago) {
            toast({
                title: "Seleccione una fecha",
                description: "Por favor, seleccione una fecha de pago.",
                variant: "destructive",
            });
            return;
        }

        setIsSaving(true);
        try {
            const invalidRows = data.filter((row) => row.estado === "ERROR");
            if (invalidRows.length > 0) {
                throw new Error("La planilla contiene empleados sin validar.");
            }
            const vouchers: VoucherDto[] = data.map((row) => ({ ...row, fechaPago }));

            // Llamamos a la acción saveVouchers, que retorna los IDs
            const createdIds = await saveVouchers(vouchers);
            setVoucherIds(createdIds);

            toast({
                title: "Éxito",
                description: "Los vouchers se han guardado correctamente.",
            });
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                variant: "destructive",
                description: "No se pudieron guardar los vouchers.",
            });
        } finally {
            setIsSaving(false);
        }
    };

    // Acción: Enviar correos para los IDs que se guardaron
    const handleSendEmails = async () => {
        if (voucherIds.length === 0) {
            toast({
                title: "Nada para enviar",
                description: "No hay vouchers guardados para enviar correo.",
                variant: "destructive",
            });
            return;
        }

        setIsSending(true);
        try {
            const { sent, failed } = await sendVoucherEmails(voucherIds);

            if (sent.length > 0) {
                toast({
                    title: "Emails enviados",
                    description: `Se enviaron los correos de los vouchers: ${sent.join(", ")}`,
                });
            }

            if (failed.length > 0) {
                toast({
                    title: "Algunos fallaron",
                    variant: "destructive",
                    description: `No se enviaron los correos de: ${failed.join(", ")}`,
                });
            }
        } catch (error) {
            console.error(error);
            toast({
                title: "Error general",
                variant: "destructive",
                description: "Ocurrió un error al intentar enviar los correos.",
            });
        } finally {
            setIsSending(false);
        }
    };

    const columns = [
        "rowNumber", "estado", "empleadoNombre", "dni", "puesto", "oficina", "diasTrabajados",
        "salarioDiario", "salarioMensual", "totalDeducciones", "reembolsos", "retroactivoSM",
        "bonos", "feriados", "netoPagar", "metodoPago", "errores",
    ] as const;

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
                            onSelect={(date) =>
                                setFechaPago(date ? date.toISOString().split("T")[0] : "")
                            }
                        />
                    </PopoverContent>
                </Popover>

                <Input
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleFile}
                    className="w-full sm:w-auto"
                />

                {/* Botón Guardar Vouchers */}
                <Button
                    onClick={handleSave}
                    className="w-full sm:w-auto"
                    disabled={isSaving || data.length === 0}
                >
                    {isSaving ? "Guardando..." : "Guardar Vouchers"}
                </Button>

                {/* Botón Enviar Emails */}
                <Button
                    onClick={handleSendEmails}
                    variant="secondary"
                    className="w-full sm:w-auto"
                    disabled={isSending || voucherIds.length === 0}
                >
                    {isSending ? "Enviando correos..." : "Enviar Emails"}
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
                                        <TableCell key={col}>
                                            {col === "estado" ? (
                                                row.estado === "VALIDO" ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4 text-red-600" />
                                            ) : Array.isArray(row[col]) ? row[col].join(", ") : row[col]?.toString() ?? ""}
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
