import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Barcode, CheckCircleIcon, XCircleIcon } from "lucide-react";
import { notFound } from "next/navigation";
import { getActivoById } from "../actions";

export default async function ViewActivo({ params }: { params: { id: string } }) {
    const activo = await getActivoById(params.id);

    if (!activo) {
        notFound();
    }

    return (
        <div className="container mx-auto py-10">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-2xl font-bold">Detalles del Activo</CardTitle>
                        <div className="flex items-center gap-2">
                            <Barcode className="h-6 w-6" />
                            <span className="text-2xl font-mono tracking-wider">{activo.codigoBarra}</span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <h3 className="text-sm font-medium text-gray-500">Nombre</h3>
                            <p className="mt-1 text-lg">{activo.nombre}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-500">Descripción</h3>
                            <p className="mt-1 text-lg">{activo.descripcion}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-500">Categoría</h3>
                            <p className="mt-1 text-lg">{activo.categoria?.nombre}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-500">Estado Actual</h3>
                            <p className="mt-1 text-lg">{activo.estadoActual?.nombre}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-500">Empleado Asignado</h3>
                            <p className="mt-1 text-lg">
                                {activo.empleadoAsignado
                                    ? `${activo.empleadoAsignado.nombre} ${activo.empleadoAsignado.apellido}`
                                    : "No asignado"}
                            </p>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-500">Fecha de Asignación</h3>
                            <p className="mt-1 text-lg">
                                {activo.fechaAsignacion
                                    ? new Date(activo.fechaAsignacion).toLocaleDateString()
                                    : "No asignado"}
                            </p>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-500">Fecha de Registro</h3>
                            <p className="mt-1 text-lg">
                                {activo.fechaRegistro ? new Date(activo.fechaRegistro).toLocaleDateString() : "No disponible"}
                            </p>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-500">Estado</h3>
                            <div className="mt-1">
                                {activo.activo ? (
                                    <Badge className="bg-green-500">
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
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 