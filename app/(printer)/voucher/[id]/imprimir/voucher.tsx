'use client'

import { RegistroPago } from "@/app/(protected)/voucher-pago/type";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import jsPDF from "jspdf";
import { useEffect } from "react";

// Utilidad para formatear fecha
function formatearFecha(fecha: string) {
    return format(new Date(fecha), "dd 'de' MMMM, yyyy", { locale: es });
}

// Utilidad para formatear moneda
function formatCurrency(amount: number) {
    // Devuelve el número con dos decimales y separador de miles
    return amount.toLocaleString("es-HN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function VoucherPrintView({ registro }: { registro: RegistroPago }) {
    useEffect(() => {
        const generarPDF = async () => {
            const doc = new jsPDF({
                orientation: "portrait",
                unit: "pt",
                format: "letter"
            });

            const pageWidth = doc.internal.pageSize.getWidth();

            // --- HEADER ---
            doc.setFontSize(20);
            doc.setFont("helvetica", "bold");
            doc.text("Medio Publicitarios S.A", 30, 50);
            doc.setFontSize(14);
            doc.setFont("helvetica", "normal");
            doc.text("RECIBO DE PAGO DE NÓMINA", 30, 75);
            doc.setFontSize(10);
            doc.text(`Emitido: ${formatearFecha(new Date().toISOString())}`, 30, 95);

            // Línea
            doc.setLineWidth(1);
            doc.line(30, 105, pageWidth - 30, 105);

            // --- INFORMACIÓN DEL EMPLEADO ---
            let y = 125;
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text("INFORMACIÓN DEL EMPLEADO", 30, y);
            y += 18;
            doc.setFont("helvetica", "normal");
            doc.text(`Nombre:`, 30, y); doc.setFont("helvetica", "bold"); doc.text(registro.empleadoNombre, 120, y);
            y += 18;
            doc.setFont("helvetica", "normal"); doc.text(`Puesto:`, 30, y); doc.setFont("helvetica", "bold"); doc.text(registro.empleadoPuesto, 120, y);
            doc.setFont("helvetica", "normal"); doc.text(`Fecha de Pago:`, pageWidth / 2 + 10, y); doc.setFont("helvetica", "bold"); doc.text(formatearFecha(registro.fechaPago), pageWidth / 2 + 110, y);

            // --- DETALLE SALARIAL ---
            y += 30;
            doc.setFont("helvetica", "bold");
            doc.text("DETALLE SALARIAL", 30, y);
            y += 18;
            doc.setFont("helvetica", "normal");

            // Definimos las posiciones X para cada columna
            const col1X = 40;   // Días trabajados
            const col2X = 220;  // Salario Diario
            const col3X = 420;  // Salario Mensual
            const colMontoX = pageWidth - 40; // Montos alineados a la derecha

            // Fila 1: Días trabajados
            doc.text(`Días Trabajados:`, col1X, y);
            doc.setFont("helvetica", "bold");
            doc.text(`${registro.diasTrabajados}`, col1X + 110, y);

            // Fila 2: Salario Diario
            doc.setFont("helvetica", "normal");
            doc.text(`Salario Diario:`, col2X, y);
            doc.setFont("helvetica", "bold");
            doc.text(`L ${formatCurrency(registro.salarioDiario)}`, col2X + 120, y, { align: "right" });

            // Fila 3: Salario Mensual
            doc.setFont("helvetica", "normal");
            doc.text(`Salario Mensual:`, col3X, y);
            doc.setFont("helvetica", "bold");
            doc.text(`L ${formatCurrency(registro.salarioMensual)}`, colMontoX, y, { align: "right" });

            // --- BONOS Y BENEFICIOS (TABLA) ---
            y += 30;
            doc.setFont("helvetica", "bold");
            doc.text("BONOS Y BENEFICIOS", 30, y);

            // Encabezado tabla bonos
            y += 18;
            doc.setFillColor(220, 255, 220); // Verde claro
            doc.rect(30, y - 12, pageWidth - 60, 18, "F");
            doc.setTextColor(0, 100, 0);
            doc.text("Concepto", 40, y);
            doc.text("Monto", pageWidth - 40, y, { align: "right" });
            doc.setTextColor(0, 0, 0);

            let totalBonos = 0;
            const bonos = registro.detalles.filter(d => d.categoria === "BONO");
            bonos.forEach((bono) => {
                y += 16;
                doc.text(bono.tipoDeduccionNombre, 40, y);
                doc.text(`L +${formatCurrency(bono.monto)}`, pageWidth - 40, y, { align: "right" });
                totalBonos += bono.monto;
            });
            // Total bonos
            y += 16;
            doc.setFont("helvetica", "bold");
            doc.setFillColor(240, 255, 240); // Verde más suave
            doc.rect(30, y - 12, pageWidth - 60, 18, "F");
            doc.text("TOTAL BONOS", 40, y);
            doc.text(`L +${formatCurrency(totalBonos)}`, pageWidth - 40, y, { align: "right" });

            // --- DEDUCCIONES (TABLA) ---
            y += 30;
            doc.setFont("helvetica", "bold");
            doc.text("DEDUCCIONES", 30, y);

            // Encabezado tabla deducciones
            y += 18;
            doc.setFillColor(255, 220, 220); // Rojo claro
            doc.rect(30, y - 12, pageWidth - 60, 18, "F");
            doc.setTextColor(120, 0, 0);
            doc.text("Concepto", 40, y);
            doc.text("Monto", pageWidth - 40, y, { align: "right" });
            doc.setTextColor(0, 0, 0);

            let totalDeducciones = 0;
            const deducciones = registro.detalles.filter(d => d.categoria === "DEDUCCION");
            deducciones.forEach((deduccion) => {
                y += 16;
                doc.text(deduccion.tipoDeduccionNombre, 40, y);
                doc.text(`L -${formatCurrency(deduccion.monto)}`, pageWidth - 40, y, { align: "right" });
                totalDeducciones += deduccion.monto;
            });
            // Total deducciones
            y += 16;
            doc.setFont("helvetica", "bold");
            doc.setFillColor(255, 240, 240); // Rojo más suave
            doc.rect(30, y - 12, pageWidth - 60, 18, "F");
            doc.text("TOTAL DEDUCCIONES", 40, y);
            doc.text(`L -${formatCurrency(totalDeducciones)}`, pageWidth - 40, y, { align: "right" });

            // --- RESUMEN DE PAGO ---
            y += 30;
            doc.setFont("helvetica", "bold");
            doc.text("RESUMEN DE PAGO", 30, y);
            y += 18;
            doc.setFont("helvetica", "normal");
            doc.text("Salario Quincenal Base:", 40, y); doc.setFont("helvetica", "bold"); doc.text(`L ${formatCurrency(registro.salarioMensual / 2)}`, pageWidth - 40, y, { align: "right" });
            y += 16;
            doc.setFont("helvetica", "normal"); doc.text("Total Bonos:", 40, y); doc.setFont("helvetica", "bold"); doc.text(`L +${formatCurrency(totalBonos)}`, pageWidth - 40, y, { align: "right" });
            y += 16;
            doc.setFont("helvetica", "normal"); doc.text("Total Deducciones:", 40, y); doc.setFont("helvetica", "bold"); doc.text(`L -${formatCurrency(totalDeducciones)}`, pageWidth - 40, y, { align: "right" });
            y += 16;
            doc.setFont("helvetica", "bold");
            doc.text("NETO A PAGAR:", 40, y); doc.text(`L ${formatCurrency(registro.netoPagar)}`, pageWidth - 40, y, { align: "right" });

            // --- FIRMAS CENTRADAS ---
            y += 50;
            const firmaWidth = 160;
            const espacioFirmas = 80;
            const firma1X = pageWidth / 2 - firmaWidth - espacioFirmas / 2;
            const firma2X = pageWidth / 2 + espacioFirmas / 2;

            doc.setLineWidth(1);
            doc.line(firma1X, y, firma1X + firmaWidth, y); // Firma empleado
            doc.line(firma2X, y, firma2X + firmaWidth, y); // Firma RH
            doc.text("Firma del Empleado", firma1X + firmaWidth / 2, y + 15, { align: "center" });
            doc.text("Recursos Humanos", firma2X + firmaWidth / 2, y + 15, { align: "center" });

            // --- FOOTER ---
            y += 40;
            doc.setFontSize(8);
            doc.text("Este documento es un comprobante oficial de pago de nómina.", 30, y);
            doc.text("Conserve este documento para sus registros personales.", 30, y + 12);
            doc.text(`ID de Pago: ${registro.id} | Generado: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 30, y + 24);

            doc.save(`recibo_nomina_${registro.empleadoNombre}.pdf`);
        };

        if (registro) generarPDF();
    }, [registro]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <p>Generando PDF...</p>
        </div>
    );
}
