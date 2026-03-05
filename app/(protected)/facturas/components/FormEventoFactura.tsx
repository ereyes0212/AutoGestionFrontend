"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { postEventoFactura } from "../actions";

export default function FormEventoFactura({
  notas,
}: {
  notas: { id: string; titulo: string }[];
}) {
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fechaEvento, setFechaEvento] = useState("");
  const [notaId, setNotaId] = useState<string>("none");
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

    if (!files.length) {
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
        }))
      );

      await postEventoFactura({
        titulo,
        descripcion,
        fechaEvento,
        notaId: notaId === "none" ? "" : notaId,
        files: encodedFiles,
      });

      toast({ title: "Facturas guardadas", description: "El evento y sus facturas fueron registrados correctamente." });
      router.refresh();
      setTitulo("");
      setDescripcion("");
      setFechaEvento("");
      setNotaId("none");
      setFiles([]);
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
        <Select value={notaId} onValueChange={setNotaId}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona una nota" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sin nota</SelectItem>
            {notas.map((nota) => (
              <SelectItem key={nota.id} value={nota.id}>{nota.titulo}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Facturas (puedes adjuntar varias: imagen o PDF)</Label>
        <Input
          type="file"
          accept="image/*,application/pdf"
          multiple
          onChange={(e) => setFiles(Array.from(e.target.files || []))}
          required
        />
        {files.length > 0 && (
          <p className="text-sm text-muted-foreground mt-2">{files.length} archivo(s) seleccionado(s)</p>
        )}
      </div>

      <Button type="submit" disabled={loading}>{loading ? "Guardando..." : "Guardar evento"}</Button>
    </form>
  );
}
