// components/VoucherImporter.tsx
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
import { CalendarIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import {
    DetalleVoucherDto,
    TipoDeduccionTemplate,
    VoucherDto,
    VoucherTemplateResponse,
} from "../types";

// Importamos las acciones del servidor
import { getTemplate, saveVouchers, sendVoucherEmails } from "../actions";

type RowData = Record<string, string | number | null>;

export function VoucherImporter() {
    const router = useRouter();
    const { toast } = useToast();

    // Estados para archivos + template
    const [data, setData] = useState<RowData[]>([]);
    const [tipos, setTipos] = useState<TipoDeduccionTemplate[]>([]);
    const [fechaPago, setFechaPago] = useState<string>("");

    // IDs de vouchers recién guardados
    const [voucherIds, setVoucherIds] = useState<string[]>([]);

    // Estados de carga para botones
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [isSending, setIsSending] = useState<boolean>(false);

    // Cargar el template (tipos de deducción) al iniciar
    useEffect(() => {
        getTemplate().then((json: VoucherTemplateResponse) => {
            setTipos(json.tiposDeducciones);
        });
    }, []);

    // Manejar selección de archivo Excel
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
            // Mapear filas a VoucherDto
            const vouchers: VoucherDto[] = data.map((row) => {
                const v: VoucherDto = {
                    empleadoNombre: (row["NombreCompleto"] as string) || "",
                    empleadoId: row["EmpleadoId"] as string,
                    fechaPago,
                    diasTrabajados: Number(row["DiasTrabajados"] || 0),
                    salarioDiario: Number(row["SalarioDiario"] || 0),
                    salarioMensual: Number(row["SalarioMensual"] || 0),
                    netoPagar: Number(row["NetoPagar"] || 0),
                    observaciones: (row["Observaciones"] as string) || "",
                    detalles: [],
                };

                // Agregar cada deducción
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

            // Llamamos a la acción saveVouchers, que retorna los IDs
            const createdIds = await saveVouchers(vouchers);
            setVoucherIds(createdIds);

            toast({
                title: "Éxito",
                description: "Los vouchers se han guardado correctamente.",
            });

            // NO redirigimos automáticamente: permitimos al usuario hacer clic en "Enviar Emails"
            // router.push("/contabilidad");
            // router.refresh();
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

    // Columnas de la tabla (nombres de propiedades del XLSX)
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
                            onSelect={(date) =>
                                setFechaPago(date ? date.toISOString().split("T")[0] : "")
                            }
                            initialFocus
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
