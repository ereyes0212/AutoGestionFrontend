"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { formatoTamano } from "./formato";

const MAX_BYTES = 1024 ** 3;

type Props = {
  abierto: boolean;
  onOpenChange: (abierto: boolean) => void;
  onSubido: () => void;
};

/**
 * Envía el archivo a /api/videos/subir (el servidor lo guarda en S3, igual que las facturas).
 * Se usa XMLHttpRequest para poder mostrar el progreso de la subida.
 */
function enviarVideo(
  archivo: File,
  titulo: string,
  onProgreso: (cargado: number, total: number) => void,
  xhrRef: React.MutableRefObject<XMLHttpRequest | null>,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;
    xhr.open("POST", "/api/videos/subir");
    xhr.setRequestHeader("Content-Type", "application/octet-stream");
    xhr.setRequestHeader("X-Video-Titulo", encodeURIComponent(titulo));
    xhr.setRequestHeader("X-Video-Nombre", encodeURIComponent(archivo.name));
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgreso(e.loaded, e.total);
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) return resolve();
      let mensaje = `No se pudo subir el video (HTTP ${xhr.status})`;
      try {
        mensaje = JSON.parse(xhr.responseText).error ?? mensaje;
      } catch {
        if (xhr.status === 413) mensaje = "El servidor rechazó el archivo por tamaño";
      }
      reject(new Error(mensaje));
    };
    xhr.onerror = () => reject(new Error("Error de red al subir el video"));
    xhr.onabort = () => reject(new Error("Subida cancelada"));
    xhr.send(archivo);
  });
}

export default function SubirVideoDialog({ abierto, onOpenChange, onSubido }: Props) {
  const { toast } = useToast();
  const [titulo, setTitulo] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [progreso, setProgreso] = useState<{ cargado: number; total: number } | null>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const inputArchivo = useRef<HTMLInputElement>(null);

  function reiniciar() {
    setTitulo("");
    setArchivo(null);
    setError(null);
    setProgreso(null);
    if (inputArchivo.current) inputArchivo.current.value = "";
  }

  function cambiarAbierto(valor: boolean) {
    if (!valor && subiendo) {
      xhrRef.current?.abort();
      return;
    }
    if (!valor) reiniciar();
    onOpenChange(valor);
  }

  function elegirArchivo(file: File | null) {
    setError(null);
    if (file && file.size > MAX_BYTES) {
      setError("El archivo supera 1 GB.");
      setArchivo(null);
      return;
    }
    if (file && file.type && !file.type.startsWith("video/")) {
      setError("El archivo no parece un video.");
      setArchivo(null);
      return;
    }
    setArchivo(file);
    if (file && !titulo.trim()) setTitulo(file.name.replace(/\.[^.]+$/, "").slice(0, 200));
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!archivo || !titulo.trim()) return;
    setError(null);
    setSubiendo(true);
    setProgreso({ cargado: 0, total: archivo.size });

    try {
      await enviarVideo(archivo, titulo.trim(), (cargado, total) => setProgreso({ cargado, total }), xhrRef);
      toast({ title: "Video subido", description: "Se está procesando. El código aparece cuando esté listo." });
      reiniciar();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo subir el video");
      setProgreso(null);
    } finally {
      xhrRef.current = null;
      setSubiendo(false);
      onSubido();
    }
  }

  const porcentaje = progreso ? Math.round((progreso.cargado / Math.max(progreso.total, 1)) * 100) : 0;
  const guardando = subiendo && porcentaje >= 100;

  return (
    <Dialog open={abierto} onOpenChange={cambiarAbierto}>
      <DialogContent className="max-w-lg">
        <form onSubmit={enviar} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Subir video</DialogTitle>
            <DialogDescription>
              Máximo 1 GB. Se convierte automáticamente para que se reproduzca en cualquier navegador.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2">
            <Label htmlFor="video-archivo">Archivo de video</Label>
            <Input
              id="video-archivo"
              ref={inputArchivo}
              type="file"
              accept="video/*"
              disabled={subiendo}
              onChange={(e) => elegirArchivo(e.target.files?.[0] ?? null)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="video-titulo">Título</Label>
            <Input
              id="video-titulo"
              value={titulo}
              maxLength={200}
              disabled={subiendo}
              placeholder="Ej. Accidente en el bulevar del norte"
              onChange={(e) => setTitulo(e.target.value)}
            />
          </div>

          {progreso && (
            <div className="grid gap-1">
              <Progress value={porcentaje} />
              <p className="text-xs text-muted-foreground">
                {guardando
                  ? "Guardando el video…"
                  : `Subiendo… ${porcentaje}% (${formatoTamano(progreso.cargado)} de ${formatoTamano(progreso.total)})`}
              </p>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => cambiarAbierto(false)}>
              {subiendo ? "Cancelar subida" : "Cerrar"}
            </Button>
            <Button type="submit" disabled={subiendo || !archivo || !titulo.trim()} className="gap-2">
              {subiendo && <Loader2 className="h-4 w-4 animate-spin" />}
              {subiendo ? "Subiendo…" : "Subir video"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
