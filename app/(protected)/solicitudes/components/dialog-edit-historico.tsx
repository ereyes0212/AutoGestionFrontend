"use client"

import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { SolicitudAprobacion } from "../type"

interface EditHistoricoDialogProps {
  solicitud: SolicitudAprobacion
  onConfirm: (
    periodo: string | null,
    diasRestantes: number | null,
    diasGozados: number | null,
    fechaPresentacion: string | null,
    comentario: string | null
  ) => void
}

export function EditHistoricoDialog({
  solicitud,
  onConfirm,
}: EditHistoricoDialogProps) {
  const [open, setOpen] = useState(false)
  const [comentario, setComentario] = useState(solicitud.comentario || "")
  const [diasRestantes, setDiasRestantes] = useState<string>(solicitud.diasRestantes?.toString() || "")
  const [diasGozados, setDiasGozados] = useState<string>(solicitud.diasGozados?.toString() || "")
  const [periodo, setPeriodo] = useState(solicitud.periodo || "")
  const [fechaPresentacion, setFechaPresentacion] = useState<Date | undefined>(
    solicitud.fechaPresentacion ? new Date(solicitud.fechaPresentacion) : undefined
  )
  const [calendarOpen, setCalendarOpen] = useState(false)

  useEffect(() => {
    if (open) {
      setComentario(solicitud.comentario || "")
      setDiasRestantes(solicitud.diasRestantes?.toString() || "")
      setDiasGozados(solicitud.diasGozados?.toString() || "")
      setPeriodo(solicitud.periodo || "")
      setFechaPresentacion(
        solicitud.fechaPresentacion ? new Date(solicitud.fechaPresentacion) : undefined
      )
    }
  }, [open, solicitud])

  const handleConfirm = () => {
    onConfirm(
      periodo.trim() || null,
      diasRestantes ? Number(diasRestantes) : null,
      diasGozados ? Number(diasGozados) : null,
      fechaPresentacion ? fechaPresentacion.toISOString() : null,
      comentario.trim() || null
    )
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Editar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Solicitud del Histórico</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Días de goce</Label>
              <Input
                type="number"
                value={diasGozados}
                onChange={(e) => setDiasGozados(e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <Label>Días restantes</Label>
              <Input
                type="number"
                value={diasRestantes}
                onChange={(e) => setDiasRestantes(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <Label>Periodo</Label>
            <Input
              placeholder="Ej: Enero 2025"
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
            />
          </div>

          <div>
            <Label>Fecha de presentación</Label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full pl-3 text-left font-normal",
                    !fechaPresentacion && "text-muted-foreground"
                  )}
                >
                  {fechaPresentacion ? (
                    format(fechaPresentacion, "PPP", { locale: es })
                  ) : (
                    <span>Selecciona una fecha</span>
                  )}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-0"
                align="start"
                side="bottom"
                sideOffset={4}
                alignOffset={0}
              >
                <Calendar
                  mode="single"
                  selected={fechaPresentacion}
                  onSelect={(date) => {
                    setFechaPresentacion(date)
                    setCalendarOpen(false)
                  }}
                  disabled={(date) => date < new Date("1900-01-01")}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label>Comentario</Label>
            <Textarea
              placeholder="Comentario..."
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm}>
            Guardar Cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

