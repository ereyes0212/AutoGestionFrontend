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
import { cancelarPedido } from "../actions";

export default function CancelarPedidoDialog({
  pedidoId,
  numero,
}: {
  pedidoId: string;
  numero: number;
}) {
  const { toast } = useToast();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [guardando, setGuardando] = useState(false);

  const confirmar = async () => {
    setGuardando(true);
    const resultado = await cancelarPedido(pedidoId, motivo);
    setGuardando(false);

    if (!resultado.success) {
      toast({
        title: "No se pudo cancelar",
        description: resultado.error,
        variant: "destructive",
      });
      return;
    }

    toast({ title: `Pedido #${numero} cancelado` });
    setOpen(false);
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 text-destructive">
          <Ban className="h-4 w-4" />
          Cancelar pedido
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cancelar pedido #{numero}</DialogTitle>
          <DialogDescription>
            El pedido queda cancelado y ya no se puede recibir. No afecta el stock porque
            todavía no había entrado nada.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="motivo-pedido">Motivo (opcional)</Label>
          <Textarea
            id="motivo-pedido"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Por qué se cancela este pedido"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={guardando}>
            Volver
          </Button>
          <Button variant="destructive" onClick={confirmar} disabled={guardando}>
            {guardando ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cancelando...
              </>
            ) : (
              "Cancelar pedido"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
