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
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2, PackageCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { recibirPedido } from "../actions";
import { PedidoInsumo } from "../types";

export default function RecibirPedidoDialog({ pedido }: { pedido: PedidoInsumo }) {
  const { toast } = useToast();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Se teclea en la misma unidad en que se pidió cada línea
  const [recibido, setRecibido] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      pedido.detalles.map((detalle) => [
        detalle.id,
        detalle.cantidadEmpaque ?? detalle.cantidad,
      ])
    )
  );

  const confirmar = async () => {
    setGuardando(true);
    const resultado = await recibirPedido({
      pedidoId: pedido.id,
      recepciones: pedido.detalles.map((detalle) => ({
        detalleId: detalle.id,
        cantidad: Number(recibido[detalle.id] ?? 0),
      })),
    });
    setGuardando(false);

    if (!resultado.success) {
      toast({
        title: "No se pudo recibir",
        description: resultado.error,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Pedido recibido",
      description: `El stock de ${pedido.ciudadNombre} fue actualizado.`,
    });

    setOpen(false);
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <PackageCheck className="h-4 w-4" />
          Marcar recibido
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Recibir pedido #{pedido.numero}</DialogTitle>
          <DialogDescription>
            Confirme lo que realmente llegó. Solo eso se suma al stock de{" "}
            {pedido.ciudadNombre}.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Insumo</TableHead>
                <TableHead>Pedido</TableHead>
                <TableHead className="w-[160px]">Recibido</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pedido.detalles.map((detalle) => {
                const enEmpaques = detalle.cantidadEmpaque !== null;
                const unidad = enEmpaques
                  ? detalle.unidadEmpaqueNombre
                  : detalle.unidadNombre;

                return (
                  <TableRow key={detalle.id}>
                    <TableCell>
                      <span className="font-medium">{detalle.insumoNombre}</span>
                      {detalle.observacion && (
                        <span className="block text-xs text-muted-foreground">
                          {detalle.observacion}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{detalle.cantidadLabel}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={0}
                          value={recibido[detalle.id] ?? 0}
                          onChange={(e) =>
                            setRecibido((previo) => ({
                              ...previo,
                              [detalle.id]: Number(e.target.value),
                            }))
                          }
                        />
                        <span className="whitespace-nowrap text-xs text-muted-foreground">
                          {unidad}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <p className="text-xs text-muted-foreground">
          Cada línea recibida genera una entrada en el historial, ligada a este pedido.
        </p>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={guardando}>
            Volver
          </Button>
          <Button onClick={confirmar} disabled={guardando}>
            {guardando ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              "Confirmar recepción"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
