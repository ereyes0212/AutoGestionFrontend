'use client'

import { SolicitudPermiso } from "@/app/(protected)/solicitudes/type"
import { formatearFecha } from "@/lib/utils"
import { useEffect, useState } from "react"

export default function ClientPrintView({ solicitud, usuario }: { solicitud: SolicitudPermiso ; usuario: string }) {
    const [fechayhora, setFechayhora] = useState<string>("")
    useEffect(() => {
        const now = new Date()
        const resultado = `${formatearFecha(now.toISOString())} ${now.toLocaleTimeString()}`
        setFechayhora(resultado)

        const handleAfterPrint = () => {
            window.close()
        }

        window.addEventListener("afterprint", handleAfterPrint)

        // Esperar un pequeño tiempo para que el DOM se actualice antes de imprimir
        const timeout = setTimeout(() => {
            window.print()
        }, 100) // 100ms suele ser suficiente

        return () => {
            clearTimeout(timeout)
            window.removeEventListener("afterprint", handleAfterPrint)
        }
    }, [])


    return (
        <>
            {/* estilos para impresión */}
            <style jsx global>{`
                @page { margin: 0; }
                @media print {
                    html, body { margin: 0; padding: 0; }
                    .print-container { margin: 0; padding: 0; }
                    .print-header { top: 20px; left: 0; right: 0; }
                    .print-body { padding-top: 2rem; }
                }
            `}</style>

            <div className="print-container relative">
                <div className="fecha-hora-impresion">{fechayhora} - {usuario}</div>

                <header className="print-header text-center mb-4 pb-4">
                    <h1 className="text-2xl font-bold">Medios Publicitarios S.A. de C.V.</h1>
                    <p className="text-sm border-b-2 border-black">RTN 05019015805580</p>
                </header>

                <div className="print-body mt-0">
                    <h1 className="text-center text-xl font-semibold mb-6">SOLICITUD DE VACACIONES</h1>
                    <p className="mb-2 text-lg">
                        <span className="font-medium">Nombre del empleado:</span> {solicitud.nombreEmpleado}
                    </p>
                    <p className="mb-2 text-lg">
                        <span className="font-medium">Puesto:</span> {solicitud.puesto}
                    </p>
                    <p className="mb-2 text-lg">
                        <span className="font-medium">Fecha de solicitud:</span> {formatearFecha(solicitud.fechaSolicitud)}
                    </p>
                    <p className="mb-2 text-lg">
                        <span className="font-medium">Total días autorizados para goce de vacaciones:</span>{" "}
                        {solicitud.diasSolicitados}
                    </p>
                    <p className="mb-2 text-lg">
                        <span className="font-medium">Fecha de goce de vacaciones:</span>{" "}
                        {formatearFecha(solicitud.fechaInicio)}
                    </p>
                    <p className="mb-6 text-lg">
                        <span className="font-medium">Fecha de regreso:</span>{" "}
                        {formatearFecha(solicitud.fechaFin)}
                    </p>

                    <div className="flex items-center gap-6 mb-6">
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="aprobadas"
                                checked={solicitud.aprobado === true}
                                readOnly
                                className="checkbox w-5 h-5"
                            />
                            <label htmlFor="aprobadas" className="ml-2 text-lg">
                                Aprobadas
                            </label>
                        </div>
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="no-aprobadas"
                                checked={solicitud.aprobado === false}
                                readOnly
                                className="checkbox w-5 h-5"
                            />
                            <label htmlFor="no-aprobadas" className="ml-2 text-lg">
                                No Aprobadas
                            </label>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-20 mt-20">
                        <div className="text-center">
                            <p className="mb-2 border-b-2 border-black w-48 mx-auto"></p>
                            <p className="text-lg font-medium">Firma del empleado</p>
                        </div>
                        <div className="text-center">
                            <p className="mb-2 border-b-2 border-black w-48 mx-auto"></p>
                            <p className="text-lg font-medium">Firma del jefe inmediato</p>
                        </div>
                        <div className="text-center">
                            <p className="mb-2 border-b-2 border-black w-48 mx-auto"></p>
                            <p className="text-lg font-medium">Lic. Andrés E. Rosenthal Enamorado</p>
                            <p className="text-sm">Gerente Administrativo</p>
                        </div>
                        <div className="text-center">
                            <p className="mb-2 border-b-2 border-black w-48 mx-auto"></p>
                            <p className="text-lg font-medium">Abog. Martha Julia Rápalo</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
