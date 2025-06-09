'use client'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Briefcase, CalendarDays, Clock, FileText, User } from 'lucide-react'
import { useRouter } from "next/navigation"
import { processApproval } from "../actions"
import { SolicitudAprobacion } from "../type"
import { ApprovalDialog } from "./dialog-aprobacion"

const formatearFecha = (fecha: string) => {
    if (!fecha) return "N/A"
    try {
        return format(new Date(fecha), "dd 'de' MMMM 'de' yyyy", { locale: es })
    } catch {
        return "Fecha inválida"
    }
}

export default function SolicitudAprobaciones({ solicitudes }: { solicitudes: SolicitudAprobacion[] }) {
    console.log("🚀 ~ SolicitudAprobaciones ~ solicitudes:", solicitudes)

    const { toast } = useToast();
    const router = useRouter();
    return (
        <Accordion type="single" collapsible className="space-y-2">
            {solicitudes.map((solicitud) => (
                <AccordionItem key={solicitud.id} value={solicitud.id.toString()}>
                    <AccordionTrigger>
                        <div className="flex justify-between items-center w-full">
                            <span>Solicitud de Permiso - {solicitud.nombreEmpleado || "No especificado"}</span>
                            <div>
                                {solicitud.aprobado === "Aprobado" ? (
                                    <Badge className="bg-green-500 hover:bg-green-600">Aprobado</Badge>
                                ) : solicitud.aprobado === "Rechazado" ? (
                                    <Badge variant="destructive">Rechazado</Badge>
                                ) : (
                                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-300">
                                        Pendiente
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        <Card className="shadow-sm">
                            <CardContent className="p-2">
                                <div className="mb-2">
                                    <div className="flex items-center gap-1 text-sm font-medium text-gray-500 border-b pb-1">
                                        <User className="h-4 w-4" />
                                        <span>Información del Empleado</span>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            window.open(
                                                `/solicitudes/${solicitud.idSolicitud}/imprimir`,
                                                "_blank"
                                            );
                                        }}
                                    >
                                        Imprimir
                                    </Button>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
                                        <div>
                                            <p className="text-xs font-medium text-gray-500">Nombre:</p>
                                            <p>{solicitud.nombreEmpleado || "No especificado"}</p>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-1">
                                                <Briefcase className="h-4 w-4 text-gray-500" />
                                                <p className="text-xs font-medium text-gray-500">Puesto:</p>
                                            </div>
                                            <p>{solicitud.puesto}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-500">Nivel de Aprobación:</p>
                                            <p>Nivel {solicitud.nivel}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-2">
                                    <div className="flex items-center gap-1 text-sm font-medium text-gray-500 border-b pb-1">
                                        <FileText className="h-4 w-4" />
                                        <span>Detalles de la Solicitud</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
                                        <div>
                                            <div className="flex items-center gap-1">
                                                <CalendarDays className="h-4 w-4 text-gray-500" />
                                                <p className="text-xs font-medium text-gray-500">Fecha de Solicitud:</p>
                                            </div>
                                            <p>{formatearFecha(solicitud.fechaSolicitud)}</p>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-4 w-4 text-gray-500" />
                                                <p className="text-xs font-medium text-gray-500">Período Solicitado:</p>
                                            </div>
                                            <p>
                                                {formatearFecha(solicitud.fechaInicio)} - {formatearFecha(solicitud.fechaFin)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-500">Días Solicitados:</p>
                                            <p>{solicitud.diasSolicitados} días</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-500">Estado de Aprobación:</p>
                                            <div className="mt-1">
                                                {solicitud.aprobado === "Aprobado" ? (
                                                    <Badge className="bg-green-500 hover:bg-green-600">Aprobado el {formatearFecha(solicitud.fechaAprobacion || "")}</Badge>
                                                ) : solicitud.aprobado === "Rechazado" ? (
                                                    <Badge variant="destructive">Rechazado</Badge>
                                                ) : (
                                                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-300">
                                                        Pendiente de Aprobación
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-2">
                                    <p className="text-xs font-medium text-gray-500">Descripción:</p>
                                    <p className="mt-1">{solicitud.descripcion}</p>
                                </div>

                                {solicitud.comentario && (
                                    <div>
                                        <p className="text-xs font-medium text-gray-500">Comentario:</p>
                                        <p className="mt-1">{solicitud.comentario}</p>
                                    </div>
                                )}
                            </CardContent>

                            {solicitud.aprobado === 'Pendiente' && (
                                <CardFooter key={solicitud.id} className="flex justify-end gap-1">
                                    <ApprovalDialog
                                        action="approve"
                                        onConfirm={async (comentario) => {
                                            try {
                                                await processApproval({
                                                    id: solicitud.id,
                                                    nivel: solicitud.nivel,
                                                    aprobado: true,
                                                    comentarios: comentario,
                                                });
                                                toast({
                                                    title: "Aprobación exitosa",
                                                    description: "La solicitud de vacaciones fue aprobada.",
                                                    variant: "default",
                                                });
                                                router.push("/solicitudes");
                                                router.refresh();
                                            } catch {
                                                toast({
                                                    title: "Error en la aprobación",
                                                    description: "Hubo un problema al procesar la aprobación.",
                                                    variant: "destructive",
                                                });
                                            }
                                        }}
                                    />

                                    <ApprovalDialog
                                        action="reject"
                                        onConfirm={async (comentario) => {
                                            try {
                                                await processApproval({
                                                    id: solicitud.idSolicitud,
                                                    nivel: solicitud.nivel,
                                                    aprobado: false,
                                                    comentarios: comentario,
                                                })
                                                toast({
                                                    title: "Aprobación rechazada",
                                                    description: "La solicitud de vacaciones fue rechazada.",
                                                    variant: "default",
                                                });
                                                router.push("/solicitudes");
                                                router.refresh();
                                            } catch {
                                                toast({
                                                    title: "Error en la aprobación",
                                                    description: "Hubo un problema al procesar la aprobación.",
                                                    variant: "destructive",
                                                });
                                            }
                                        }}
                                    />
                                </CardFooter>
                            )}
                        </Card>
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
    )
}
