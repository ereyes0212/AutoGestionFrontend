'use client'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Briefcase, CalendarDays, FileText, User } from "lucide-react"
import { useState } from "react"
import { Empleado } from "../../empleados/type"
import { SolicitudPermiso } from "../type"

const tipoSolicitudLabel = (tipo?: string) => {
    switch (tipo) {
        case "VACACION":
            return "Vacación"
        case "DIACOMPENSATORIO":
            return "Día compensatorio"
        case "MIXTO":
            return "Mixto"
        default:
            return "No especificado"
    }
}

const formatearFecha = (fecha: string) => {
    if (!fecha) return "N/A"
    try {
        return format(new Date(fecha), "dd 'de' MMMM 'de' yyyy", { locale: es })
    } catch {
        return "Fecha inválida"
    }
}

export default function SolicitudesRH({
    solicitudes,
    empleados = [],
}: {
    solicitudes: SolicitudPermiso[]
    empleados?: Empleado[]
}) {
    const [dialogOpen, setDialogOpen] = useState(false)
    const [currentSolicitud, setCurrentSolicitud] = useState<SolicitudPermiso | null>(null)
    const [checkedFirmas, setCheckedFirmas] = useState<string[]>([])
    const [search, setSearch] = useState("")

    const handleOpenDialog = (solicitud: SolicitudPermiso) => {
        setCurrentSolicitud(solicitud)
        const empleadoQueSolicita = empleados.find((e) => e.id === solicitud.empleadoId)
        setCheckedFirmas(empleadoQueSolicita?.id ? [empleadoQueSolicita.id] : [])
        setSearch("")
        setDialogOpen(true)
    }

    const handleGenerarPDF = () => {
        if (!currentSolicitud || checkedFirmas.length === 0) return

        const firmasQuery = checkedFirmas
            .map((id) => {
                const emp = empleados.find((e) => e.id === id)
                if (!emp) return null
                return `nombre=${encodeURIComponent(emp.nombre + " " + emp.apellido)}&cargo=${encodeURIComponent(emp.puesto! || "")}`
            })
            .filter(Boolean)
            .join("&")

        window.open(`/solicitudes/${currentSolicitud.id}/imprimir?${firmasQuery}`, "_blank")
        setDialogOpen(false)
    }

    const empleadosFiltrados = (empleados || []).filter((e) =>
        `${e.nombre} ${e.apellido}`.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <>
            <Accordion type="single" collapsible className="space-y-2">
                {solicitudes.map((solicitud) => (
                    <AccordionItem key={solicitud.id} value={solicitud.id}>
                        <AccordionTrigger>
                            <div className="flex justify-between items-center w-full pr-4">
                                <span>
                                    {solicitud.nombreEmpleado} — {tipoSolicitudLabel(solicitud.tipoSolicitud)}
                                </span>
                                <div>
                                    {solicitud.aprobado === true ? (
                                        <Badge className="bg-green-500 hover:bg-green-600">Aprobado</Badge>
                                    ) : solicitud.aprobado === false ? (
                                        <Badge variant="destructive">Rechazado</Badge>
                                    ) : (
                                        <Badge
                                            variant="outline"
                                            className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-300"
                                        >
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
                                        <div className="flex items-center justify-between gap-2 text-sm font-medium text-gray-500 border-b pb-1">
                                            <div className="flex items-center gap-1">
                                                <User className="h-4 w-4" />
                                                <span>Información del Empleado</span>
                                            </div>
                                            {solicitud.aprobado === false ? (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    disabled
                                                    title="No se puede imprimir una solicitud rechazada"
                                                >
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
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
                                            <div>
                                                <p className="text-xs font-medium text-gray-500">Nombre:</p>
                                                <p>{solicitud.nombreEmpleado}</p>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-1">
                                                    <Briefcase className="h-4 w-4 text-gray-500" />
                                                    <p className="text-xs font-medium text-gray-500">Puesto:</p>
                                                </div>
                                                <p>{solicitud.puesto}</p>
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
                                                <p className="text-xs font-medium text-gray-500">Tipo:</p>
                                                <p>{tipoSolicitudLabel(solicitud.tipoSolicitud)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-gray-500">Fecha Inicio:</p>
                                                <p>{formatearFecha(solicitud.fechaInicio)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-gray-500">Fecha Fin:</p>
                                                <p>{formatearFecha(solicitud.fechaFin)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-gray-500">Días solicitados:</p>
                                                <p>{solicitud.diasSolicitados}</p>
                                            </div>
                                            <div className="md:col-span-2">
                                                <p className="text-xs font-medium text-gray-500">Descripción:</p>
                                                <p>{solicitud.descripcion || "Sin descripción"}</p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>

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
                                            setCheckedFirmas([...checkedFirmas, empleado.id!])
                                        } else {
                                            setCheckedFirmas(checkedFirmas.filter((id) => id !== empleado.id))
                                        }
                                    }}
                                />
                                <span>
                                    {empleado.nombre} {empleado.apellido} ({empleado.puesto || ""})
                                </span>
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
