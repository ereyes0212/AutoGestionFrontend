"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { postEventoFactura, updateEventoFactura } from "../actions";

type NotaOption = { id: string; titulo: string; createAt: Date | string };
type ExistingArchivo = { id: string; archivoNombre: string; archivoTipo: string };

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
  existingArchivos?: ExistingArchivo[];
};

function formatDay(value: Date | string) {
  return new Date(value).toISOString().slice(0, 10);
}

export default function FormEventoFactura({
  notas,
  isUpdate = false,
  eventoId,
  initialData,
  existingArchivos = [],
}: Props) {
  const [titulo, setTitulo] = useState(initialData?.titulo ?? "");
  const [descripcion, setDescripcion] = useState(initialData?.descripcion ?? "");
  const [fechaEvento, setFechaEvento] = useState(
    initialData?.fechaEvento ? initialData.fechaEvento.slice(0, 16) : "",
  );
  const [notaDia, setNotaDia] = useState("");
  const [notaId, setNotaId] = useState<string>(initialData?.notaId ?? "none");
  const [files, setFiles] = useState<File[]>([]);
  const [replacementFiles, setReplacementFiles] = useState<Record<string, File | undefined>>({});
  const [deleteArchivoIds, setDeleteArchivoIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const notasFiltradas = useMemo(() => {
    if (!notaDia) return notas;
    return notas.filter((nota) => formatDay(nota.createAt) === notaDia);
  }, [notaDia, notas]);

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

      const replacements = await Promise.all(
        Object.entries(replacementFiles)
          .filter(([archivoId, file]) => !!file && !deleteArchivoIds.includes(archivoId))
          .map(async ([archivoId, file]) => ({
            archivoId,
            file: {
              fileBase64: await toBase64(file as File),
              fileName: (file as File).name,
              fileType: (file as File).type || "application/octet-stream",
            },
          })),
      );

      const payload = {
        titulo,
        descripcion,
        fechaEvento,
        notaId: notaId === "none" ? "" : notaId,
        files: encodedFiles,
        replacements,
        deleteArchivoIds,
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

      router.push(`/facturas${isUpdate && eventoId ? `/${eventoId}/detalle` : ""}`);
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Día de la nota</Label>
          <Input type="date" value={notaDia} onChange={(e) => setNotaDia(e.target.value)} />
        </div>
        <div>
          <Label>Vincular con nota (opcional)</Label>
          <Select value={notaId || "none"} onValueChange={setNotaId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una nota" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sin nota</SelectItem>
              {notasFiltradas.map((nota) => (
                <SelectItem key={nota.id} value={nota.id}>
                  {nota.titulo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isUpdate && existingArchivos.length > 0 && (
        <div className="space-y-3">
          <Label>Archivos actuales (puedes reemplazar o eliminar)</Label>
          <div className="space-y-3">
            {existingArchivos.map((archivo) => (
              <div key={archivo.id} className="border rounded p-3 space-y-2">
                <p className="text-sm font-medium break-all">{archivo.archivoNombre}</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {archivo.archivoTipo.startsWith("image/") ? (
                  <img
                    src={`/api/facturas/archivo/${archivo.id}`}
                    alt={archivo.archivoNombre}
                    className="h-28 object-contain rounded border"
                  />
                ) : (
                  <p className="text-xs text-muted-foreground">PDF actual cargado</p>
                )}

                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`delete-${archivo.id}`}
                    checked={deleteArchivoIds.includes(archivo.id)}
                    onCheckedChange={(checked) => {
                      setDeleteArchivoIds((prev) =>
                        checked ? [...prev, archivo.id] : prev.filter((id) => id !== archivo.id),
                      );
                    }}
                  />
                  <Label htmlFor={`delete-${archivo.id}`}>Eliminar archivo</Label>
                </div>

                <Input
                  type="file"
                  accept="image/*,application/pdf"
                  disabled={deleteArchivoIds.includes(archivo.id)}
                  onChange={(e) =>
                    setReplacementFiles((prev) => ({
                      ...prev,
                      [archivo.id]: e.target.files?.[0],
                    }))
                  }
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <Label>{isUpdate ? "Agregar nuevas facturas (opcional)" : "Facturas (imagen o PDF)"}</Label>
        <Input
          type="file"
          accept="image/*,application/pdf"
          multiple
          onChange={(e) => setFiles(Array.from(e.target.files || []))}
          required={!isUpdate}
        />
        {files.length > 0 && (
          <p className="text-sm text-muted-foreground mt-2">{files.length} archivo(s) nuevo(s) seleccionado(s)</p>
        )}
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? "Guardando..." : isUpdate ? "Actualizar evento" : "Guardar evento"}
      </Button>
    </form>
  );
}
