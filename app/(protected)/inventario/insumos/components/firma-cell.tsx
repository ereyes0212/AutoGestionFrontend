"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { FileSignature, Link2, Loader2 } from "lucide-react";
import { useState } from "react";
import { regenerarEnlaceFirma } from "../actions";
import { MovimientoInsumo } from "../types";
import FirmaLink from "./firma-link";

interface FirmaCellProps {
  movimiento: MovimientoInsumo;
}

/**
 * Estado de la firma de un movimiento: ver la firma guardada, compartir el
 * enlace pendiente o generar uno nuevo si el anterior expiró.
 */
export default function FirmaCell({ movimiento }: FirmaCellProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState<string | null>(movimiento.firmaUrl);
  const [generando, setGenerando] = useState(false);

  if (movimiento.tipo === "ENTRADA") {
    return <span className="text-muted-foreground">-</span>;
  }

  // Un movimiento cancelado ya no necesita firma
  if (movimiento.cancelado && !movimiento.firmado) {
    return <span className="text-muted-foreground">-</span>;
  }

  if (movimiento.firmado) {
    return (
      <div className="flex flex-col gap-1">
        <a
          href={`/api/insumos/firma/${movimiento.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
        >
          <FileSignature className="h-4 w-4" />
          Ver firma
        </a>
        {movimiento.firmaFechaLabel && (
          <span className="text-xs text-muted-foreground">{movimiento.firmaFechaLabel}</span>
        )}
      </div>
    );
  }

  const generarEnlace = async () => {
    setGenerando(true);
    const resultado = await regenerarEnlaceFirma(movimiento.id);
    setGenerando(false);

    if (!resultado.success || !resultado.firmaUrl) {
      toast({
        title: "Error",
        description: resultado.error ?? "No se pudo generar el enlace.",
        variant: "destructive",
      });
      return;
    }

    setUrl(resultado.firmaUrl);
    setOpen(true);
  };

  return (
    <div className="flex flex-col items-start gap-1">
      <Badge variant="destructive">Sin firma</Badge>
      {url ? (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 px-2">
              <Link2 className="mr-1 h-4 w-4" />
              Enlace
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Enlace de firma</DialogTitle>
              <DialogDescription>
                {movimiento.cantidadLabel} de {movimiento.insumoNombre} —{" "}
                {movimiento.solicitadoPor}
              </DialogDescription>
            </DialogHeader>
            <FirmaLink url={url} />
          </DialogContent>
        </Dialog>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2"
          onClick={generarEnlace}
          disabled={generando}
        >
          {generando ? (
            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
          ) : (
            <Link2 className="mr-1 h-4 w-4" />
          )}
          Generar enlace
        </Button>
      )}
    </div>
  );
}
