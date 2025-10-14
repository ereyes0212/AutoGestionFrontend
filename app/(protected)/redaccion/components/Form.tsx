"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash } from "lucide-react";
import { z } from "zod";

import { SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@radix-ui/react-select";
import { aprobarNota, createNota, finalizarNota, tomarNota, updateNota } from "../actions";
import { NotaSchema } from "../schema";

type NotaFormValues = z.infer<typeof NotaSchema>;

export function NotaFormulario({
  isUpdate,
  initialData,
  permiso,
  currentUserEmpleadoId,
}: {
  isUpdate: boolean;
  permiso: string;
  initialData: NotaFormValues;
  currentUserEmpleadoId: string;
}) {
  const { toast } = useToast();
  const router = useRouter();
  // ahora cada extra tiene título + descripción
  const [extraTitles, setExtraTitles] = useState<{ titulo: string; descripcion: string }[]>([]);
  const form = useForm<NotaFormValues>({
    resolver: zodResolver(NotaSchema),
    defaultValues: initialData,
  });
  const estado = form.watch("estado");

  const canChangeEstado = permiso === "cambiar_estado_notas";

  function handleAddTitle() {
    setExtraTitles((s) => [...s, { titulo: "", descripcion: "" }]);
  }

  function handleRemoveExtra(index: number) {
    setExtraTitles((s) => s.filter((_, i) => i !== index));
  }

  function handleChangeExtraTitle(index: number, value: string) {
    setExtraTitles((s) => s.map((v, i) => (i === index ? { ...v, titulo: value } : v)));
  }

  function handleChangeExtraDescription(index: number, value: string) {
    setExtraTitles((s) => s.map((v, i) => (i === index ? { ...v, descripcion: value } : v)));
  }

  async function onSubmit(data: NotaFormValues) {
    // construimos arrays paralelos de títulos y descripciones
    const mainTitle = data.titulo?.trim();
    const mainDescription = (data as any).descripcion?.trim() ?? "";

    const extraTitulos = extraTitles.map((e) => e.titulo?.trim()).filter(Boolean);
    const extraDescripciones = extraTitles.map((e) => e.descripcion?.trim() ?? "");

    const allTitles = [mainTitle, ...extraTitulos].map((t) => String(t).trim()).filter(Boolean);
    const allDescriptions = [mainDescription, ...extraDescripciones].slice(0, allTitles.length);

    if (allTitles.length === 0) {
      toast({ title: "Error", description: "Debes enviar al menos un título." });
      return;
    }

    try {
      if (isUpdate) {
        // update single nota
        if (!data.id) {
          toast({ title: "Error", description: "Falta el identificador de la nota." });
          return;
        }

        if (canChangeEstado) {
          // JEFE: cambia estado/fellback y luego actualiza título/descripcion si hace falta
          await aprobarNota(data.id, data.estado, data.fellback || null);

          // Actualizar título/descripcion si cambiaron (evita sobreescribir campos nulos)
          const tituloParaActualizar = data.titulo?.trim();
          const descripcionParaActualizar = (data as any).descripcion;
          const fuenteParaActualizar = data.fuente?.trim();
          if (tituloParaActualizar !== undefined || descripcionParaActualizar !== undefined) {
            await updateNota(data.id, {
              ...(tituloParaActualizar !== undefined ? { titulo: tituloParaActualizar } : {}),
              ...(fuenteParaActualizar !== undefined ? { fuente: fuenteParaActualizar ?? null } : {}),
              ...(descripcionParaActualizar !== undefined ? { descripcion: descripcionParaActualizar ?? null } : {}),
            });
          }

          toast({ title: "Actualización Exitosa", description: "La nota ha sido actualizada." });
          router.push("/redaccion");
          router.refresh();
        } else {
          // REDACTOR: el submit solo actualiza título/descripcion (no toca estado).
          const tituloParaActualizar = data.titulo?.trim();
          const descripcionParaActualizar = (data as any).descripcion;

          // Si no hay cambios en título/descripcion, solo mostramos mensaje y salimos
          if (tituloParaActualizar === undefined && descripcionParaActualizar === undefined) {
            toast({ title: "Sin cambios", description: "No hay cambios para guardar." });
            return;
          }

          await updateNota(data.id, {
            ...(tituloParaActualizar !== undefined ? { titulo: tituloParaActualizar } : {}),
            ...(descripcionParaActualizar !== undefined ? { descripcion: descripcionParaActualizar ?? null } : {}),
          });

          toast({ title: "Actualización Exitosa", description: "La nota ha sido actualizada." });
          router.push("/redaccion");
          router.refresh();
        }
      } else {
        // CREACIÓN: crear una nota por cada título+descripción
        if (!data.creadorEmpleadoId) {
          toast({ title: "Error", description: "Falta el creador (sesión inválida)." });
          return;
        }

        await Promise.all(
          allTitles.map((titulo, i) =>
            createNota({
              creadorEmpleadoId: data.creadorEmpleadoId,
              titulo,
              descripcion: allDescriptions[i] ?? "",
              fuente: data.fuente?.trim() || '',
            })
          )
        );

        toast({ title: "Creación Exitosa", description: `Se crearon ${allTitles.length} nota(s).` });
        router.push("/redaccion");
        router.refresh();
      }
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: `Hubo un problema: ${String(error)}` });
    }
  }


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 border rounded-md p-4">
        {!isUpdate && (
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Titulares</h3>
            <Button type="button" variant="secondary" onClick={handleAddTitle}>
              <Plus className="mr-2 h-4 w-4" />
              Agregar título
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          {/* Título principal */}
          <div className="col-span-1 sm:col-span-2">
            <FormField
              control={form.control}
              name="titulo"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ingresa el título de la nota"
                      {...field}
                      disabled={
                        !canChangeEstado &&
                        (estado === "APROBADA" || estado === "FINALIZADA" || estado === "RECHAZADA")
                      }
                    />
                  </FormControl>
                  <FormDescription>Por favor ingresa el título.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fuente"
              render={({ field }) => (
                <FormItem className="w-full mt-2">
                  <FormLabel>Fuente</FormLabel>
                  <FormControl>
                    <Input
                      required={false}
                      placeholder="Ingresa la fuente de la información"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                      disabled={
                        !canChangeEstado &&
                        (estado === "APROBADA" || estado === "FINALIZADA" || estado === "RECHAZADA")
                      }
                    />
                  </FormControl>
                  <FormDescription>Fuente de la información.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}

            />

            {/* Descripción principal — queda debajo porque está dentro del mismo bloque que hace span en sm */}
            <FormField
              control={form.control}
              name="descripcion"
              render={({ field }) => (
                <FormItem className="w-full mt-2">
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      disabled={
                        !canChangeEstado &&
                        (estado === "APROBADA" || estado === "FINALIZADA" || estado === "RECHAZADA")
                      }
                      placeholder="Ingresa una descripción" {...field} />
                  </FormControl>
                  <FormDescription>Descripción asociada al título.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>


          {/* Extras: títulos + descripciones (descripcion abajo) */}
          <div className="col-span-1 sm:col-span-2">
            {extraTitles.map((et, idx) => (
              <div key={idx} className="mb-3 space-y-2 border p-3 rounded">
                {/* fila superior: título (full) + trash */}
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <Input
                      value={et.titulo}
                      onChange={(e) => handleChangeExtraTitle(idx, e.target.value)}
                      placeholder={`Título adicional #${idx + 1}`}
                    />
                  </div>
                  <div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => handleRemoveExtra(idx)}
                      aria-label={`Eliminar título adicional ${idx + 1}`}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>


                {/* descripción (debajo, full width) */}
                <div>
                  <Textarea
                    value={et.descripcion}
                    onChange={(e) => handleChangeExtraDescription(idx, e.target.value)}
                    placeholder={`Descripción para título adicional #${idx + 1}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Campos visibles en update (estado + fellback) — siempre visibles pero deshabilitados para redactores */}
        {isUpdate && (
          <>
            <FormField
              control={form.control}
              name="estado"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value as string} disabled={!canChangeEstado}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecciona un estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDIENTE">PENDIENTE</SelectItem>
                        <SelectItem value="APROBADA">APROBADA</SelectItem>
                        <SelectItem value="FINALIZADA">FINALIZADA</SelectItem>
                        <SelectItem value="RECHAZADA">RECHAZADA</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormDescription>Selecciona el estado de la nota.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fellback"
              render={({ field }) => (
                <FormItem className="mt-2">
                  <FormLabel>Fellback</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Observación / motivo (opcional)"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                      disabled={!canChangeEstado}
                    />
                  </FormControl>
                  <FormDescription>Texto de observación/rechazo.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        {/* Botones solo para redactores cuando corresponde */}
        {!canChangeEstado && isUpdate && (
          <div className="flex gap-2 mt-4">
            {form.getValues("estado") === "PENDIENTE" && !form.getValues("asignadoEmpleadoId") && (
              <Button
                type="button"
                onClick={async () => {
                  const notaId = form.getValues("id");
                  if (!notaId) {
                    toast({ title: "Error", description: "Falta el ID de la nota" });
                    return;
                  }
                  try {
                    await tomarNota(notaId);
                    toast({ title: "Nota tomada", description: "Ahora puedes editar la nota." });
                    router.replace("/redaccion");
                  } catch (err) {
                    toast({ title: "Error", description: String(err) });
                  }
                }}
              >
                Tomar nota
              </Button>
            )}

            {form.getValues("estado") === "APROBADA" && form.getValues("asignadoEmpleadoId") === currentUserEmpleadoId && (
              <Button
                type="button"
                onClick={async () => {
                  const notaId = form.getValues("id");
                  if (!notaId) {
                    toast({ title: "Error", description: "Falta el ID de la nota" });
                    return;
                  }
                  try {
                    await finalizarNota(notaId);
                    toast({ title: "Nota finalizada", description: "La nota ha sido finalizada." });
                    router.replace("/redaccion");
                  } catch (err) {
                    toast({ title: "Error", description: String(err) });
                  }
                }}
              >
                Finalizar nota
              </Button>
            )}
          </div>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={form.formState.isSubmitting} >
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cargando...
              </>
            ) : isUpdate ? "Actualizar" : "Crear"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
