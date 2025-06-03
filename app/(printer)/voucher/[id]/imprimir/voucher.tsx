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

export function PayrollPrintLayout({ registro, companyName = "EMPRESA S.A." }: PayrollPrintLayoutProps) {
    useEffect(() => {
        const handleAfterPrint = () => window.close()
        window.addEventListener("afterprint", handleAfterPrint)
        const timeout = setTimeout(() => window.print(), 100)
        return () => {
            clearTimeout(timeout)
            window.removeEventListener("afterprint", handleAfterPrint)
        }
    }, [])

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat("es-HN", { style: "currency", currency: "HNL" }).format(amount)

    const formatDate = (dateString: string) => format(new Date(dateString), "dd 'de' MMMM, yyyy", { locale: es })

    // Separar bonos y deducciones
    const bonos = registro.detalles.filter((d) => d.categoria === "BONO")
    const deducciones = registro.detalles.filter((d) => d.categoria === "DEDUCCION")

    // Calcular totales
    const totalBonos = bonos.reduce((sum, b) => sum + b.monto, 0)
    const totalDeducciones = deducciones.reduce((sum, d) => sum + d.monto, 0)
    const salarioQuincenal = registro.salarioMensual / 2

    return (
        <>
            <style jsx global>{`
        @page { 
          margin: 1in; 
          size: letter;
        }
        @media print {
          html, body { 
            margin: 200 px; 
            padding: 0; 
            font-size: 12px;
            line-height: 1.3;
          }
          .print-container {
            width: 90% !important;
            max-width: none;
            padding: 0;
          }
          .no-print {
            display: none !important;
          }
          .print-break {
            page-break-after: always;
          }
          .print-avoid-break {
            page-break-inside: avoid;
          }
          table {
            border-collapse: collapse;
          }
          th, td {
            border: 1px solid #000;
            padding: 4px 8px;
          }
          .summary-box {
            border: 2px solid #000;
            padding: 8px;
            margin: 8px 0;
          }
        }
        @media screen {
          .print-container {
            max-width: 8.5in;
            margin: 0 auto;
            padding: 1rem;
            background: white;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
        }
      `}</style>

            <div className="print-container relative">
                {/* Header */}
                <div className="text-center mb-6 pb-4 border-b-2 border-black print-header">
                    <h1 className="text-2xl font-bold mb-2">{companyName}</h1>
                    <h2 className="text-lg font-semibold mb-1">RECIBO DE PAGO DE NÓMINA</h2>
                    <p className="text-sm">Emitido: {formatDate(new Date().toISOString())}</p>
                </div>

                {/* Employee Information */}
                <div className="mb-6 print-avoid-break">
                    <h3 className="text-lg font-semibold mb-3 border-b border-gray-400">INFORMACIÓN DEL EMPLEADO</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <strong>Nombre:</strong> {registro.empleadoNombre}
                        </div>
                        <div>
                            <strong>ID Empleado:</strong> {registro.empleadoId}
                        </div>
                        <div>
                            <strong>Puesto:</strong> {registro.empleadoPuesto}
                        </div>
                        <div>
                            <strong>Fecha de Pago:</strong> {formatDate(registro.fechaPago)}
                        </div>
                    </div>
                </div>

                {/* Salary Details */}
                <div className="mb-6 print-avoid-break">
                    <h3 className="text-lg font-semibold mb-3 border-b border-gray-400">DETALLE SALARIAL</h3>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                            <strong>Días Trabajados:</strong> {registro.diasTrabajados}
                        </div>
                        <div>
                            <strong>Salario Diario:</strong> {formatCurrency(registro.salarioDiario)}
                        </div>
                        <div>
                            <strong>Salario Mensual:</strong> {formatCurrency(registro.salarioMensual)}
                        </div>
                    </div>
                </div>

                {/* Bonuses Section */}
                {bonos.length > 0 && (
                    <div className="mb-6 print-avoid-break">
                        <h3 className="text-lg font-semibold mb-3 border-b border-gray-400">BONOS Y BENEFICIOS</h3>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-green-100">
                                    <th className="text-left font-semibold">Concepto</th>
                                    <th className="text-right font-semibold">Monto</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bonos.map((bono) => (
                                    <tr key={bono.id}>
                                        <td>{bono.tipoDeduccionNombre}</td>
                                        <td className="text-right">+{formatCurrency(bono.monto)}</td>
                                    </tr>
                                ))}
                                <tr className="bg-green-50 font-semibold">
                                    <td>TOTAL BONOS</td>
                                    <td className="text-right">+{formatCurrency(totalBonos)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Deductions Section */}
                {deducciones.length > 0 && (
                    <div className="mb-6 print-avoid-break">
                        <h3 className="text-lg font-semibold mb-3 border-b border-gray-400">DEDUCCIONES</h3>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-red-100">
                                    <th className="text-left font-semibold">Concepto</th>
                                    <th className="text-right font-semibold">Monto</th>
                                </tr>
                            </thead>
                            <tbody>
                                {deducciones.map((deduccion) => (
                                    <tr key={deduccion.id}>
                                        <td>{deduccion.tipoDeduccionNombre}</td>
                                        <td className="text-right">-{formatCurrency(deduccion.monto)}</td>
                                    </tr>
                                ))}
                                <tr className="bg-red-50 font-semibold">
                                    <td>TOTAL DEDUCCIONES</td>
                                    <td className="text-right">-{formatCurrency(totalDeducciones)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Payment Summary */}
                <div className="summary-box print-avoid-break">
                    <h3 className="text-lg font-semibold mb-4 text-center">RESUMEN DE PAGO</h3>

                    <div className="grid grid-cols-1 gap-3 text-sm mb-4">
                        <div className="flex justify-between">
                            <span>Salario Quincenal Base:</span>
                            <span className="font-semibold">{formatCurrency(salarioQuincenal)}</span>
                        </div>

                        {totalBonos > 0 && (
                            <div className="flex justify-between text-green-700">
                                <span>Total Bonos:</span>
                                <span className="font-semibold">+{formatCurrency(totalBonos)}</span>
                            </div>
                        )}

                        {totalDeducciones > 0 && (
                            <div className="flex justify-between text-red-700">
                                <span>Total Deducciones:</span>
                                <span className="font-semibold">-{formatCurrency(totalDeducciones)}</span>
                            </div>
                        )}

                        <hr className="border-black" />

                        <div className="flex justify-between text-lg font-bold">
                            <span>NETO A PAGAR:</span>
                            <span>{formatCurrency(registro.netoPagar)}</span>
                        </div>
                    </div>

                    {/* Calculation Formula */}
                    <div className="text-xs text-center text-gray-600 mt-4">
                        <p>
                            Cálculo: {formatCurrency(salarioQuincenal)}
                            {totalBonos > 0 && ` + ${formatCurrency(totalBonos)}`}
                            {totalDeducciones > 0 && ` - ${formatCurrency(totalDeducciones)}`}
                            {" = "}
                            <strong>{formatCurrency(registro.netoPagar)}</strong>
                        </p>
                    </div>
                </div>

                {/* Observations */}
                {registro.observaciones && (
                    <div className="mb-6 print-avoid-break">
                        <h3 className="text-lg font-semibold mb-3 border-b border-gray-400">OBSERVACIONES</h3>
                        <div className="bg-yellow-50 p-3 border border-yellow-200 text-sm">{registro.observaciones}</div>
                    </div>
                )}

                {/* Footer */}
                <div className="mt-8 pt-4 border-t border-gray-400 text-xs text-center">
                    <div className="grid grid-cols-2 gap-8 mb-4">
                        <div>
                            <div className="border-t border-black mt-8 pt-2">
                                <strong>Firma del Empleado</strong>
                            </div>
                        </div>
                        <div>
                            <div className="border-t border-black mt-8 pt-2">
                                <strong>Recursos Humanos</strong>
                            </div>
                        </div>
                    </div>

                    <div className="text-gray-600">
                        <p>Este documento es un comprobante oficial de pago de nómina.</p>
                        <p>Conserve este documento para sus registros personales.</p>
                        <p>
                            ID de Pago: {registro.id} | Generado: {format(new Date(), "dd/MM/yyyy HH:mm")}
                        </p>
                    </div>
                </div>
            </div>
        </>
    )
}
