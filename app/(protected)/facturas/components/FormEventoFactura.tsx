"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { postEventoFactura, updateEventoFactura } from "../actions";

type NotaOption = { id: string; titulo: string };

type Props = {
  notas: NotaOption[];
  isUpdate?: boolean;
  eventoId?: string;
  initialData?: {
    titulo: string;
    descripcion?: string | null;
    fechaEvento: string;
    notaId?: string | null;
  };
};

export default function FormEventoFactura({ notas, isUpdate = false, eventoId, initialData }: Props) {
  const [titulo, setTitulo] = useState(initialData?.titulo ?? "");
  const [descripcion, setDescripcion] = useState(initialData?.descripcion ?? "");
  const [fechaEvento, setFechaEvento] = useState(
    initialData?.fechaEvento ? initialData.fechaEvento.slice(0, 16) : "",
  );
  const [notaId, setNotaId] = useState<string>(initialData?.notaId ?? "none");
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const toBase64 = (f: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(f);
      reader.onload = () => resolve(String(reader.result).split(",")[1]);
      reader.onerror = reject;
    });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isUpdate && !files.length) {
      toast({ title: "Archivo requerido", description: "Debes adjuntar al menos una factura en imagen o PDF." });
      return;
    }

    setLoading(true);
    try {
      const encodedFiles = await Promise.all(
        files.map(async (file) => ({
          fileBase64: await toBase64(file),
          fileName: file.name,
          fileType: file.type || "application/octet-stream",
        })),
      );

      const payload = {
        titulo,
        descripcion,
        fechaEvento,
        notaId: notaId === "none" ? "" : notaId,
        files: encodedFiles,
      };

      if (isUpdate) {
        if (!eventoId) throw new Error("Falta el id del evento para actualizar");
        await updateEventoFactura(eventoId, payload);
      } else {
        await postEventoFactura(payload);
      }

      toast({
        title: isUpdate ? "Evento actualizado" : "Facturas guardadas",
        description: isUpdate
          ? "El evento fue actualizado correctamente."
          : "El evento y sus facturas fueron registrados correctamente.",
      });

      router.push("/facturas");
      router.refresh();
    } catch (error) {
      toast({ title: "Error", description: `No se pudo guardar: ${error}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 border rounded-md p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Título</Label>
          <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
        </div>
        <div>
          <Label>Fecha y hora del evento</Label>
          <Input type="datetime-local" value={fechaEvento} onChange={(e) => setFechaEvento(e.target.value)} required />
        </div>
      </div>

      <div>
        <Label>Descripción</Label>
        <Textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Detalle del evento" />
      </div>

      <div>
        <Label>Vincular con nota (opcional)</Label>
        <Select value={notaId || "none"} onValueChange={setNotaId}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona una nota" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sin nota</SelectItem>
            {notas.map((nota) => (
              <SelectItem key={nota.id} value={nota.id}>
                {nota.titulo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>{isUpdate ? "Adjuntar nuevas facturas (opcional)" : "Facturas (imagen o PDF)"}</Label>
        <Input
          type="file"
          accept="image/*,application/pdf"
          multiple
          onChange={(e) => setFiles(Array.from(e.target.files || []))}
          required={!isUpdate}
        />
        {files.length > 0 && (
          <p className="text-sm text-muted-foreground mt-2">{files.length} archivo(s) seleccionado(s)</p>
        )}
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? "Guardando..." : isUpdate ? "Actualizar evento" : "Guardar evento"}
      </Button>
    </form>
  );
}
