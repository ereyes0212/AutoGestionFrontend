"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Check, Copy, ExternalLink } from "lucide-react";
import { useState } from "react";

interface FirmaLinkProps {
  url: string;
  descripcion?: string;
}

/**
 * Muestra el enlace de firma para que el empleado lo abra desde su teléfono.
 */
export default function FirmaLink({ url, descripcion }: FirmaLinkProps) {
  const { toast } = useToast();
  const [copiado, setCopiado] = useState(false);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      toast({
        title: "No se pudo copiar",
        description: "Copie el enlace manualmente.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-2 rounded-md border p-3">
      <p className="text-sm text-muted-foreground">
        {descripcion ??
          "Comparta este enlace con el empleado para que firme desde su teléfono. Vence en 48 horas."}
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input readOnly value={url} className="text-xs" onFocus={(e) => e.target.select()} />
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={copiar} className="flex-1">
            {copiado ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Copiado
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copiar
              </>
            )}
          </Button>
          <Button type="button" variant="outline" asChild>
            <a href={url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
              <span className="sr-only">Abrir enlace de firma</span>
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
