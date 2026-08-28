"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Ban, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cancelarMovimiento } from "../actions";
import { MovimientoInsumo } from "../types";

interface CancelarMovimientoDialogProps {
  movimiento: MovimientoInsumo;
}

export default function CancelarMovimientoDialog({
  movimiento,
}: CancelarMovimientoDialogProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [cancelando, setCancelando] = useState(false);

  const esSalida = movimiento.tipo === "SALIDA";

  const confirmar = async () => {
    setCancelando(true);
    const resultado = await cancelarMovimiento(movimiento.id, motivo);
    setCancelando(false);

    if (!resultado.success) {
      toast({
        title: "No se pudo cancelar",
        description: resultado.error,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Movimiento cancelado",
      description: `Stock actualizado: ${resultado.stockResultante} ${movimiento.unidadNombre}`,
    });

    setOpen(false);
    setMotivo("");
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-destructive">
          <Ban className="mr-1 h-4 w-4" />
          Cancelar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cancelar movimiento</DialogTitle>
          <DialogDescription>
            {esSalida
              ? `Se devolverán ${movimiento.cantidadLabel} de ${movimiento.insumoNombre} al stock.`
              : `Se restarán ${movimiento.cantidadLabel} de ${movimiento.insumoNombre} del stock.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <div className="rounded-md border p-3 text-sm">
            <p>
              <span className="text-muted-foreground">Fecha: </span>
              {movimiento.fechaLabel}
            </p>
            <p>
              <span className="text-muted-foreground">Solicitó: </span>
              {movimiento.solicitadoPor}
            </p>
            <p>
              <span className="text-muted-foreground">Registró: </span>
              {movimiento.registradoPor}
            </p>
          </div>

          <Label htmlFor={`motivo-${movimiento.id}`}>Motivo (opcional)</Label>
          <Textarea
            id={`motivo-${movimiento.id}`}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Por qué se cancela este movimiento"
          />
          <p className="text-xs text-muted-foreground">
            El movimiento queda en el historial marcado como cancelado y deja de contar en
            los reportes.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={cancelando}>
            Volver
          </Button>
          <Button variant="destructive" onClick={confirmar} disabled={cancelando}>
            {cancelando ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cancelando...
              </>
            ) : (
              "Cancelar movimiento"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
