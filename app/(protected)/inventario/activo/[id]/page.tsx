import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, CheckCircleIcon, Tag, User, XCircleIcon } from "lucide-react"
import { notFound } from "next/navigation"
import { getActivoById } from "../actions"
import { BarcodeWithDownload } from "./BarcodeComponent"

export default async function ViewActivo({ params }: { params: { id: string } }) {
    const activo = await getActivoById(params.id)

    if (!activo) {
        notFound()
    }

    return (
        <div className=" mx-auto py-8 px-4 ">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Detalles del Activo</h1>
                {activo.activo ? (
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                        <CheckCircleIcon className="mr-1 h-4 w-4" />
                        Activo
                    </Badge>
                ) : (
                    <Badge variant="destructive">
                        <XCircleIcon className="mr-1 h-4 w-4" />
                        Inactivo
                    </Badge>
                )}
            </div>

            <Card>
                <CardContent className="pt-6">
                    {/* Código de Barras en la esquina superior derecha */}
                    <div className="flex justify-end mb-4">
                        <BarcodeWithDownload
                            code={activo.codigoBarra}
                            nombre={activo.nombre}
                        />
                    </div>

                    {/* Información en 2 columnas responsiva */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Columna Izquierda */}
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-gray-500">Nombre</label>
                                <p className="font-medium text-sm md:text-base">{activo.nombre}</p>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500">Categoría</label>
                                <div className="flex items-center gap-1">
                                    <Tag className="h-3 w-3 text-blue-600" />
                                    <p className="text-sm md:text-base">{activo.categoria?.nombre}</p>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500">Estado Actual</label>
                                <p className="text-sm md:text-base">{activo.estadoActual?.nombre}</p>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500">Fecha de Registro</label>
                                <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3 text-gray-400" />
                                    <p className="text-sm md:text-base">
                                        {activo.fechaRegistro ? new Date(activo.fechaRegistro).toLocaleDateString("es-ES") : "No disponible"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Columna Derecha */}
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-gray-500">Descripción</label>
                                <p className="text-sm md:text-base">{activo.descripcion}</p>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500">Empleado Asignado</label>
                                <div className="flex items-center gap-1">
                                    <User className="h-3 w-3 text-orange-600" />
                                    <p className="text-sm md:text-base">
                                        {activo.empleadoAsignado
                                            ? `${activo.empleadoAsignado.nombre} ${activo.empleadoAsignado.apellido}`
                                            : "No asignado"}
                                    </p>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500">Fecha de Asignación</label>
                                <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3 text-gray-400" />
                                    <p className="text-sm md:text-base">
                                        {activo.fechaAsignacion
                                            ? new Date(activo.fechaAsignacion).toLocaleDateString("es-ES")
                                            : "No asignado"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
