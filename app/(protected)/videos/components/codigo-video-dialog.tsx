"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import type { VideoFila } from "../types";

type Props = {
  video: VideoFila | null;
  onOpenChange: (abierto: boolean) => void;
};

export default function CodigoVideoDialog({ video, onOpenChange }: Props) {
  const [copiado, setCopiado] = useState(false);
  const codigo = video?.codigo ?? "";

  async function copiar() {
    try {
      await navigator.clipboard.writeText(codigo);
    } catch {
      const area = document.getElementById("codigo-video") as HTMLTextAreaElement | null;
      area?.select();
      document.execCommand("copy");
    }
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1500);
  }

  return (
    <Dialog open={!!video} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="break-words">{video?.titulo}</DialogTitle>
          <DialogDescription>
            Copia este código y pégalo en la nota de tiempo.hn (en el bloque HTML).
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-md bg-muted p-2">
            {/* El código lo genera el servidor: solo UUID, enteros y el título escapado */}
            <div dangerouslySetInnerHTML={{ __html: codigo }} />
          </div>

          <div className="flex flex-col gap-2">
            <Textarea
              id="codigo-video"
              readOnly
              value={codigo}
              className="min-h-[180px] font-mono text-xs"
              onFocus={(e) => e.currentTarget.select()}
            />
            <Button type="button" onClick={copiar} className="gap-2">
              {copiado ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copiado ? "¡Copiado!" : "Copiar código"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
