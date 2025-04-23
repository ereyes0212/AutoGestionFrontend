"use client"

import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
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
  } catch (error) {
    return "Fecha inválida"
  }
}

export default function SolicitudPermisoCard({ solicitud }: { solicitud: SolicitudPermiso }) {
  // Determinar el estado general de la solicitud basado en las aprobaciones
  const determinarEstadoGeneral = (solicitud: SolicitudPermiso) => {
    // Si hay alguna aprobación en false, la solicitud está rechazada
    if (solicitud.aprobaciones.some((a) => a.aprobado === false)) {
      return false
    }

    // Si todas las aprobaciones están en true, la solicitud está aprobada
    if (solicitud.aprobaciones.every((a) => a.aprobado === true)) {
      return true
    }

    // En cualquier otro caso, está pendiente
    return null
  }

  const estadoGeneral = determinarEstadoGeneral(solicitud)

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">Solicitud de Permiso</CardTitle>
            <CardDescription>ID: {solicitud.id.substring(0, 8)}...</CardDescription>
          </div>
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
              <p className="text-sm font-medium text-muted-foreground">ID Empleado:</p>
              <p>{solicitud.empleadoId.substring(0, 8)}...</p>
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

        {/* Historial de aprobaciones - mostrado directamente */}
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {solicitud.aprobaciones.map((aprobacion) => (
                <TableRow key={aprobacion.id}>
                  <TableCell className="font-medium">Nivel {aprobacion.nivel}</TableCell>
                  <TableCell>
                    <EstadoAprobacion aprobado={aprobacion.aprobado} />
                  </TableCell>
                  <TableCell>
                    {aprobacion.fechaAprobacion ? formatearFecha(aprobacion.fechaAprobacion) : "Pendiente"}
                  </TableCell>
                  <TableCell>{aprobacion.comentario || "Sin comentarios"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
