'use client'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Briefcase, CalendarDays, Clock, FileText, User } from 'lucide-react'
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Empleado } from "../../empleados/type"
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

export default function SolicitudAprobaciones({
    solicitudes,
    empleados = []
}: {
    solicitudes: SolicitudAprobacion[],
    empleados?: Empleado[]
}) {
    const { toast } = useToast();
    const router = useRouter();
    const [diasRestantes, setDiasRestantes] = useState<number>(0);

    const [dialogOpen, setDialogOpen] = useState(false)
    const [currentSolicitud, setCurrentSolicitud] = useState<SolicitudAprobacion | null>(null)
    const [checkedFirmas, setCheckedFirmas] = useState<string[]>([]) // IDs de empleados seleccionados
    const [search, setSearch] = useState("") // filtro de empleados

    const handleOpenDialog = (solicitud: SolicitudAprobacion) => {
        setCurrentSolicitud(solicitud)
        // Marcar automáticamente al empleado que hizo la solicitud
        const empleadoQueSolicita = empleados.find(e => e.id === solicitud.empleadoId)
        // Solo agregar el empleado que solicita (sin duplicar)
        const iniciales = empleadoQueSolicita?.id ? [empleadoQueSolicita.id] : []
        setCheckedFirmas(iniciales)
        setSearch("")
        setDialogOpen(true)
    }

    const handleGenerarPDF = () => {
        if (!currentSolicitud || checkedFirmas.length === 0) return;

        const firmasQuery = checkedFirmas
            .map((id) => {
                const emp = empleados.find(e => e.id === id);
                if (!emp) return null;
                return `nombre=${encodeURIComponent(emp.nombre + ' ' + emp.apellido)}&cargo=${encodeURIComponent(emp.puesto! || '')}`;
            })
            .filter(Boolean)
            .join('&');

        window.open(`/solicitudes/${currentSolicitud.idSolicitud}/imprimir?${firmasQuery}`, "_blank");
        setDialogOpen(false);
    }

    const empleadosFiltrados = (empleados || []).filter(e =>
        `${e.nombre} ${e.apellido}`.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <>
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
                                    {/* Información y detalles de la solicitud */}
                                    <div className="mb-2">
                                        <div className="flex items-center gap-1 text-sm font-medium text-gray-500 border-b pb-1">
                                            <User className="h-4 w-4" />
                                            <span>Información del Empleado</span>
                                        </div>
                                        {solicitud.aprobado === 'Rechazado' ? (
                                            <Button variant="outline" size="sm" disabled title="No se puede imprimir una solicitud rechazada">
                                                Imprimir
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleOpenDialog(solicitud)}
                                            >
                                                Imprimir
                                            </Button>
                                        )}
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
                                                <p>{solicitud.puesto || "No especificado"}</p>
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
                                            fechaInicio={new Date(solicitud.fechaInicio)}
                                            fechaFin={new Date(solicitud.fechaFin)}
                                            onConfirm={async (comentario, diasRestantes, diasGozados, periodo, fechaPresentacion) => {
                                                try {
                                                    await processApproval({
                                                        id: solicitud.id,
                                                        nivel: solicitud.nivel,
                                                        aprobado: true,
                                                        comentarios: comentario,
                                                        diasRestantes,
                                                        diasGozados,
                                                        periodo,
                                                        fechaPresentacion,
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
                                        <Button
                                            variant="destructive"
                                            onClick={async () => {
                                                try {
                                                    // Envío directo del rechazo sin abrir diálogo
                                                    await processApproval({
                                                        id: solicitud.id,
                                                        nivel: solicitud.nivel,
                                                        aprobado: false,
                                                        comentarios: "",
                                                        diasRestantes: diasRestantes,
                                                        diasGozados: 0,
                                                        periodo: "",
                                                        fechaPresentacion: new Date().toString(),
                                                    });
                                                    toast({
                                                        title: "Solicitud rechazada",
                                                        description: "La solicitud de vacaciones fue rechazada.",
                                                        variant: "default",
                                                    });
                                                    router.push("/solicitudes");
                                                    router.refresh();
                                                } catch (err) {
                                                    console.error(err);
                                                    toast({
                                                        title: "Error en la operación",
                                                        description: "Hubo un problema al procesar el rechazo.",
                                                        variant: "destructive",
                                                    });
                                                }
                                            }}
                                        >
                                            Rechazar
                                        </Button>
                                    </CardFooter>
                                )}
                            </Card>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>

            {/* Dialog de Firmas con buscador */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Selecciona las firmas a incluir</DialogTitle>
                    </DialogHeader>

                    <Input
                        placeholder="Buscar empleado..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="mb-2"
                    />

                    <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
                        {empleadosFiltrados.map((empleado) => (
                            <label key={empleado.id} className="flex items-center gap-2">
                                <Checkbox
                                    checked={checkedFirmas.includes(empleado.id!)}
                                    onCheckedChange={(valor) => {
                                        if (valor) {
                                            setCheckedFirmas([...checkedFirmas, empleado.id!]);
                                        } else {
                                            setCheckedFirmas(checkedFirmas.filter(id => id !== empleado.id));
                                        }
                                    }}
                                />
                                <span>{empleado.nombre} {empleado.apellido} ({empleado.puesto! || ''})</span>
                            </label>
                        ))}
                    </div>

                    <DialogFooter className="mt-4">
                        <Button onClick={handleGenerarPDF}>Generar PDF</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
