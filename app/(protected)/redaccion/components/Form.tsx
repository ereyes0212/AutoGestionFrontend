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
import { Select } from "@radix-ui/react-select";
import { aprobarNota, createNota, finalizarNota, tomarNota } from "../actions";
import { NotaSchema } from "../schema";

export function NotaFormulario({
  isUpdate,
  initialData,
  permiso,
  currentUserEmpleadoId,
}: {
  isUpdate: boolean;
  permiso: string;
  initialData: z.infer<typeof NotaSchema>;
  currentUserEmpleadoId: string;
}) {
  const { toast } = useToast();
  const router = useRouter();
  const [extraTitles, setExtraTitles] = useState<string[]>([]);

  const form = useForm<z.infer<typeof NotaSchema>>({
    resolver: zodResolver(NotaSchema),
    defaultValues: initialData,
  });

  const canChangeEstado = permiso === "cambiar_estado_notas";

  function handleAddTitle() {
    setExtraTitles((s) => [...s, ""]);
  }

  function handleRemoveExtra(index: number) {
    setExtraTitles((s) => s.filter((_, i) => i !== index));
  }

  function handleChangeExtra(index: number, value: string) {
    setExtraTitles((s) => s.map((v, i) => (i === index ? value : v)));
  }

  async function onSubmit(data: z.infer<typeof NotaSchema>) {
    const allTitles = [data.titulo, ...extraTitles].map((t) => t?.trim()).filter(Boolean);

    if (allTitles.length === 0) {
      toast({ title: "Error", description: "Debes enviar al menos un título." });
      return;
    }

    try {
      if (isUpdate) {
        if (!data.id) {
          toast({ title: "Error", description: "Falta el identificador de la nota." });
          return;
        }

        if (canChangeEstado) {
          // Jefe aprueba/rechaza
          await aprobarNota(data.id, data.estado, data.fellback || null);
          toast({ title: "Actualización Exitosa", description: "La nota ha sido aprobada." });
          router.push("/redaccion");
          router.refresh();
        } else {
          // Redactor acciona
          if (data.estado === "APROBADA") {
            await finalizarNota(data.id);
            toast({ title: "Actualización Exitosa", description: "La nota ha sido finalizada." });
            router.push("/redaccion");
            router.refresh();
          } else if (data.estado === "PENDIENTE") {
            await tomarNota(data.id);
            toast({ title: "Actualización Exitosa", description: "Has tomado la nota." });
            router.push("/redaccion");
            router.refresh();
          }
        }
      } else {
        // Crear nota(s)
        await Promise.all(
          allTitles.map((titulo) =>
            createNota({
              ...data,
              titulo,
            })
          )
        );
        toast({ title: "Creación Exitosa", description: `Se crearon ${allTitles.length} nota(s).` });
      }

      router.push("/redaccion");
      router.refresh();
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

        <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
          <FormField
            control={form.control}
            name="titulo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Título</FormLabel>
                <FormControl>
                  <Input placeholder="Ingresa el título de la nota" {...field} />
                </FormControl>
                <FormDescription>Por favor ingresa el título.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="col-span-1 sm:col-span-2">
            {extraTitles.map((val, idx) => (
              <div key={idx} className="flex items-center gap-2 mb-2">
                <Input
                  value={val}
                  onChange={(e) => handleChangeExtra(idx, e.target.value)}
                  placeholder={`Título adicional #${idx + 1}`}
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => handleRemoveExtra(idx)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {isUpdate && (
          <>
            {/* Estado */}
            <FormField
              control={form.control}
              name="estado"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value as string}
                      disabled={!canChangeEstado} // 👈 redactor lo ve bloqueado
                    >
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

            {/* Fellback */}
            <FormField
              control={form.control}
              name="fellback"
              render={({ field }) => (
                <FormItem className="mt-2">
                  <FormLabel>Fellback</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Observación/rechazo"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                      disabled={!canChangeEstado} // 👈 redactor lo ve bloqueado
                    />
                  </FormControl>
                  <FormDescription>Texto de observación/rechazo.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        {/* Botones solo para redactores */}
        {!canChangeEstado && isUpdate && (
          <div className="flex gap-2 mt-4">
            {form.getValues("estado") === "PENDIENTE" &&
              !form.getValues("asignadoEmpleadoId") && (
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
                      router.replace("/redaccion"); // 👈 reemplaza y refresca la página
                    } catch (err) {
                      toast({ title: "Error", description: String(err) });
                    }
                  }}
                >
                  Tomar nota
                </Button>

              )}

            {form.getValues("estado") === "APROBADA" &&
              form.getValues("asignadoEmpleadoId") === currentUserEmpleadoId && (
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
                      router.replace("/redaccion"); // 👈 reemplaza y refresca la página
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
          <Button type="submit" disabled={form.formState.isSubmitting}>
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
