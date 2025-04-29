'use client'

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarDays, Clock, FileText, User } from "lucide-react"
import { SolicitudPermiso } from "../type"

// Componente para mostrar el estado de aprobación
const EstadoAprobacion = ({ aprobado }: { aprobado: boolean | null }) => {
  if (aprobado === true) {
    return <Badge className="bg-green-500 hover:bg-green-600">Aprobado</Badge>
  } else if (aprobado === false) {
    return <Badge variant="destructive">Rechazado</Badge>
  } else {
    return (
      <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-300">
        Pendiente
      </Badge>
    )
  }
}

// Función para formatear fechas
const formatearFecha = (fecha: string) => {
  if (!fecha) return "N/A"
  try {
    return format(new Date(fecha), "dd 'de' MMMM 'de' yyyy", { locale: es })
  } catch {
    return "Fecha inválida"
  }
}

export default function SolicitudPermisoCard({ solicitud }: { solicitud: SolicitudPermiso }) {
  // Determinar el estado general de la solicitud basado en las aprobaciones
  const determinarEstadoGeneral = (sol: SolicitudPermiso) => {
    if (sol.aprobaciones.some(a => a.aprobado === false)) return false
    if (sol.aprobaciones.every(a => a.aprobado === true)) return true
    return null
  }

  const estadoGeneral = determinarEstadoGeneral(solicitud)

  const handlePrint = () => {
    window.open(
      `/solicitudes/${solicitud.id}/imprimir`,
      "_blank"
    )
  }

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-2 flex justify-between items-start">
        <div>
          <CardTitle className="text-xl">Solicitud de Permiso</CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            Imprimir
          </Button>
          <EstadoAprobacion aprobado={estadoGeneral} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Información del empleado */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <User className="h-4 w-4" />
            <span>Información del Empleado</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Nombre:</p>
              <p>{solicitud.nombreEmpleado || "No especificado"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Puesto:</p>
              <p>{solicitud.puestoId}</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Detalles de la solicitud */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span>Detalles de la Solicitud</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Fecha de Solicitud:</p>
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <p>{formatearFecha(solicitud.fechaSolicitud)}</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Período Solicitado:</p>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <p>
                  {formatearFecha(solicitud.fechaInicio)} - {formatearFecha(solicitud.fechaFin)}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Días Solicitados:</p>
              <p>{solicitud.diasSolicitados} días</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Descripción:</p>
              <p>{solicitud.descripcion}</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Historial de aprobaciones */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <span>Historial de Aprobaciones</span>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nivel</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Comentario</TableHead>
                <TableHead>Aprobador</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {solicitud.aprobaciones.map(a => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">Nivel {a.nivel}</TableCell>
                  <TableCell><EstadoAprobacion aprobado={a.aprobado} /></TableCell>
                  <TableCell>
                    {a.fechaAprobacion ? formatearFecha(a.fechaAprobacion) : "Pendiente"}
                  </TableCell>
                  <TableCell>{a.comentario || "Sin comentarios"}</TableCell>
                  <TableCell>{a.descripcion || "Sin aprobador asignado"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
