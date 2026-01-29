"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useRef, useState } from "react";
import { agregarFirma, actualizarFirma, eliminarFirma } from "../actions";

interface FirmaManagerProps {
  firmaActual: string | null;
}

export default function FirmaManager({ firmaActual }: FirmaManagerProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [firma, setFirma] = useState<string | null>(firmaActual);
  const [preview, setPreview] = useState<string | null>(firmaActual);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar que sea una imagen
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "Por favor selecciona un archivo de imagen válido.",
        variant: "destructive",
      });
      return;
    }

    // Convertir a base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setPreview(base64String);
      setFirma(base64String);
      setHasChanges(true);
    };
    reader.readAsDataURL(file);
  };

  // Inicializar canvas cuando se abre el diálogo o cuando hay una firma previa
  const initializeCanvas = (imageSrc?: string | null) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Configurar estilo del lápiz
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Si hay una imagen previa, cargarla
    if (imageSrc) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = imageSrc;
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  // Efecto para inicializar el canvas cuando se abre
  React.useEffect(() => {
    if (open && canvasRef.current) {
      initializeCanvas(firmaActual);
    }
  }, [open]);

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();

    // Actualizar firma en tiempo real
    const base64 = canvas.toDataURL();
    setPreview(base64);
    setFirma(base64);
    setHasChanges(true);
  };

  const handleCanvasMouseUp = () => {
    if (!isDrawing) return;

    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const base64 = canvas.toDataURL();
    setPreview(base64);
    setFirma(base64);
    setHasChanges(true);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setPreview(null);
    setFirma(null);
    setHasChanges(true);
    initializeCanvas();
  };

  const handleSave = async () => {
    if (!firma) {
      toast({
        title: "Error",
        description: "Por favor agrega una firma antes de guardar.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (firmaActual) {
        await actualizarFirma(firma);
        toast({
          title: "Éxito",
          description: "Firma actualizada correctamente.",
          variant: "default",
        });
      } else {
        await agregarFirma(firma);
        toast({
          title: "Éxito",
          description: "Firma guardada correctamente.",
          variant: "default",
        });
      }
      setOpen(false);
      setHasChanges(false);
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al guardar la firma.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!firmaActual) {
      toast({
        title: "Error",
        description: "No hay firma para eliminar.",
        variant: "destructive",
      });
      return;
    }

    try {
      await eliminarFirma();
      setFirma(null);
      setPreview(null);
      setHasChanges(false);
      toast({
        title: "Éxito",
        description: "Firma eliminada correctamente.",
        variant: "default",
      });
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al eliminar la firma.",
        variant: "destructive",
      });
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && hasChanges) {
      // Resetear cambios si se cierra sin guardar
      setFirma(firmaActual);
      setPreview(firmaActual);
      setHasChanges(false);
      // Limpiar canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
    }
    setOpen(open);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Firma</Label>
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button variant={firmaActual ? "outline" : "default"} size="sm">
              {firmaActual ? (
                <>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar Firma
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Agregar Firma
                </>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {firmaActual ? "Editar Firma" : "Agregar Firma"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Subir Imagen
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={clearCanvas}
                  disabled={!preview}
                >
                  <X className="mr-2 h-4 w-4" />
                  Limpiar
                </Button>
                {firmaActual && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDelete}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar
                  </Button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              <div className="border rounded-lg p-4 bg-gray-50">
                <Label className="text-sm text-muted-foreground mb-2 block">
                  Dibuja tu firma o sube una imagen
                </Label>
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={200}
                  className="border rounded bg-white cursor-crosshair"
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onMouseLeave={handleCanvasMouseUp}
                />
              </div>

              {preview && (
                <div className="space-y-2">
                  <Label>Vista previa:</Label>
                  <div className="border rounded p-2 bg-white">
                    <img
                      src={preview}
                      alt="Vista previa de la firma"
                      className="max-h-32 mx-auto"
                    />
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={!firma || !hasChanges}>
                Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {firmaActual && (
        <div className="border rounded-lg p-4 bg-white">
          <Label className="text-sm text-muted-foreground mb-2 block">
            Firma actual:
          </Label>
          <img
            src={firmaActual}
            alt="Firma del empleado"
            className="max-h-32 mx-auto"
          />
        </div>
      )}
    </div>
  );
}

