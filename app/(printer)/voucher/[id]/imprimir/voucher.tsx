// components/PayrollPrintLayout.tsx
"use client";

import { RegistroPago } from "@/app/(protected)/voucher-pago/type";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useEffect } from "react";

interface PayrollPrintLayoutProps {
    registro: RegistroPago;
    companyName?: string;
}

export function PayrollPrintLayout({
    registro,
    companyName = "EMPRESA S.A.",
}: PayrollPrintLayoutProps) {
    useEffect(() => {
        const handleAfterPrint = () => window.close();
        window.addEventListener("afterprint", handleAfterPrint);
        const timeout = setTimeout(() => window.print(), 100);
        return () => {
            clearTimeout(timeout);
            window.removeEventListener("afterprint", handleAfterPrint);
        };
    }, []);

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat("es-HN", { style: "currency", currency: "HNL" }).format(amount);

    const formatDate = (dateString: string) =>
        format(new Date(dateString), "dd 'de' MMMM, yyyy", { locale: es });

    const totalDeducciones = registro.detalles.reduce((sum, d) => sum + d.monto, 0);
    const salarioQuincenal = registro.salarioMensual / 2;

    return (
        <>
            <style jsx global>{`
        @page { margin: 0; }
        @media print {
          html, body { margin: 0; padding: 0; }
          .print-container {
            width: 90%;
            padding: 0.5rem; /* algo más de espacio */
          }
          .print-header { top: 0px; left: 0; right: 0; }
          .print-body { padding-top: 0.5rem; }
        }
      `}</style>

            <div className="print-container relative">
                {/* Header */}
                <div className="text-center mb-2 pb-1 border-b print-header">
                    <h1 className="text-xl font-bold">{companyName}</h1>
                    <p className="text-sm">RECIBO DE PAGO DE NÓMINA</p>
                    <p className="text-sm">Emitido: {formatDate(new Date().toISOString())}</p>
                </div>

                {/* Body */}
                <div className="print-body space-y-3 text-sm">
                    {/* Employee Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div><strong>Nombre:</strong> {registro.empleadoNombre}</div>
                        <div><strong>Puesto:</strong> {registro.empleadoPuesto}</div>
                        <div><strong>Fecha Pago:</strong> {formatDate(registro.fechaPago)}</div>
                    </div>

                    {/* Payment Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <div><strong>Días Trabajados:</strong> {registro.diasTrabajados}</div>
                        <div><strong>Salario Diario:</strong> {formatCurrency(registro.salarioDiario)}</div>
                        <div><strong>Salario Quincenal:</strong> {formatCurrency(salarioQuincenal)}</div>
                    </div>

                    {/* Deductions */}
                    <table className="w-full border-collapse mb-2 text-sm">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="px-2 py-1 text-left">Deducción</th>
                                <th className="px-2 py-1 text-right">Monto</th>
                            </tr>
                        </thead>
                        <tbody>
                            {registro.detalles.map((d) => (
                                <tr key={d.id}>
                                    <td className="px-2 py-1">{d.tipoDeduccionNombre}</td>
                                    <td className="px-2 py-1 text-right">{formatCurrency(d.monto)}</td>
                                </tr>
                            ))}
                            <tr className="font-semibold">
                                <td className="px-2 py-1">Total Deducciones</td>
                                <td className="px-2 py-1 text-right">{formatCurrency(totalDeducciones)}</td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Summary */}
                    <div className="flex justify-between text-sm space-x-2">
                        <div className="flex-1 text-center px-2 py-1"><strong>Quincenal</strong><div>{formatCurrency(salarioQuincenal)}</div></div>
                        <div className="flex-1 text-center px-2 py-1"><strong>Deducciones</strong><div>{formatCurrency(totalDeducciones)}</div></div>
                        <div className="flex-1 text-center px-2 py-1 font-bold"><strong>Neto</strong><div>{formatCurrency(registro.netoPagar)}</div></div>
                    </div>
                </div>
            </div>
        </>
    );
}
