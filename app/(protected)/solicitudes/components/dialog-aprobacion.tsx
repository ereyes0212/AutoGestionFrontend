"use client"

import { useState } from "react"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface ApprovalDialogProps {
  action: "approve" | "reject"
  onConfirm: (description: string) => void
}

export function ApprovalDialog({ action, onConfirm }: ApprovalDialogProps) {
  const [open, setOpen] = useState(false)
  const [description, setDescription] = useState("")

  const title = action === "approve" ? "Aprobar solicitud" : "Rechazar solicitud"
  const triggerLabel = action === "approve" ? "Aprobar" : "Rechazar"
  const triggerVariant = action === "approve" ? "default" : "destructive"

  const handleConfirm = () => {
    onConfirm(description.trim())
    setDescription("")
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={triggerVariant}>{triggerLabel}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Ingresa una descripción o comentario antes de enviar tu decisión.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <Textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Escribe aquí tu comentario..."
            rows={4}
          />
        </div>
        <DialogFooter>
          <Button 
            variant={triggerVariant}
            onClick={handleConfirm}
            disabled={!description.trim()}
          >
            Enviar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
