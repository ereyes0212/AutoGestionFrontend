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

interface ApprovalDialogProps {
  action: "approve" | "reject"
  onConfirm: (
    comentario: string,
    diasRestantes: number,
    diasGozados: number,
    periodo: string,
    fechaPresentacion: string
  ) => void
  fechaInicio: Date
  fechaFin: Date
}

export function ApprovalDialog({
  action,
  onConfirm,
  fechaInicio,
  fechaFin,
}: ApprovalDialogProps) {
  const [open, setOpen] = useState(false)
  const [comentario, setComentario] = useState("")
  const [diasRestantes, setDiasRestantes] = useState(0)
  const [diasGozados, setDiasGozados] = useState(0)
  const [periodo, setPeriodo] = useState("")
  const [fechaPresentacion, setFechaPresentacion] = useState<Date | undefined>()
  const [calendarOpen, setCalendarOpen] = useState(false)

  const title = action === "approve" ? "Aprobar solicitud" : "Rechazar solicitud"
  const variant = action === "approve" ? "default" : "destructive"

  useEffect(() => {
    if (open) {
      const diff = Math.ceil((fechaFin.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60 * 24)) + 1
      setDiasGozados(diff)
    }
  }, [open, fechaInicio, fechaFin])

  const periodoLabel = `${format(fechaInicio, "dd 'de' MMMM yyyy", {
    locale: es,
  })} - ${format(fechaFin, "dd 'de' MMMM yyyy", { locale: es })}`

  const ahora = format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })

  const handleConfirm = () => {
    onConfirm(
      comentario.trim(),
      diasRestantes,
      diasGozados,
      periodo || periodoLabel,
      fechaPresentacion?.toString() || ahora
    )
    setOpen(false)
    setComentario("")
    setDiasRestantes(0)
    setDiasGozados(0)
    setPeriodo("")
    setFechaPresentacion(undefined)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant}>
          {action === "approve" ? "Aprobar" : "Rechazar"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <Label>Período de Vacaciones</Label>
          <p className="font-medium">{periodoLabel}</p>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Días de goce</Label>
              <Input
                type="number"
                value={diasGozados}
                onChange={(e) => setDiasGozados(Number(e.target.value))}
              />
            </div>
            <div>
              <Label>Días restantes</Label>
              <Input
                type="number"
                value={diasRestantes}
                onChange={(e) => setDiasRestantes(Number(e.target.value))}
              />
            </div>
          </div>

          <Input
            placeholder="Periodo (opcional)"
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
          />

          <div>
            <Label>Fecha de presentación</Label>
            <Popover modal={true}>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[240px] pl-3 text-left font-normal",
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
                  onSelect={setFechaPresentacion}
                  disabled={(date) => date < new Date("1900-01-01")}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <Textarea
            placeholder="Comentario..."
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button variant={variant} onClick={handleConfirm}>
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
