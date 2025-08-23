"use client";

import { zodResolver } from "@hookform/resolvers/zod"; // Usamos el resolutor de Zod
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form"; // Importamos useForm

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
import { postNota } from "../actions";
import { NotaSchema } from "../schema"; // Tu esquema de Zod para puesto

export function PuestoFormulario({
  isUpdate,
  initialData,
}: {
  isUpdate: boolean;
  initialData: z.infer<typeof NotaSchema>;
}) {
  const { toast } = useToast();
  const router = useRouter();

  // Estado local para inputs extra (titulos adicionales)
  const [extraTitles, setExtraTitles] = useState<string[]>([]);

  // Usamos Zod para resolver la validación
  const form = useForm<z.infer<typeof NotaSchema>>({
    resolver: zodResolver(NotaSchema),
    defaultValues: initialData,
  });

  const { formState, register } = form;

  // Agrega un input extra vacío
  function handleAddTitle() {
    setExtraTitles((s) => [...s, ""]);
  }

  // Elimina un input extra por índice
  function handleRemoveExtra(index: number) {
    setExtraTitles((s) => s.filter((_, i) => i !== index));
  }

  // Actualiza el valor de un input extra
  function handleChangeExtra(index: number, value: string) {
    setExtraTitles((s) => s.map((v, i) => (i === index ? value : v)));
  }

  async function onSubmit(data: z.infer<typeof NotaSchema>) {
    // Construimos la lista de títulos: el principal + los extras no vacíos
    const allTitles = [data.titulo, ...extraTitles].map((t) => t?.trim()).filter(Boolean);

    if (allTitles.length === 0) {
      toast({ title: "Error", description: "Debes enviar al menos un título." });
      return;
    }

    try {
      // Crear una nota por cada título
      await Promise.all(
        allTitles.map((titulo) => {
          const notaPayload = {
            ...data,
            titulo,
          };
          // Envolver en la propiedad 'nota' como espera tu action
          return postNota({ nota: notaPayload as any });
        })
      );

      toast({
        title: isUpdate ? "Actualización Exitosa" : "Creación Exitosa",
        description: isUpdate
          ? "La(s) nota(s) han sido actualizadas."
          : `Se crearon ${allTitles.length} nota(s).`,
      });

      router.push("/redaccion"); // Redirige después de la acción
      router.refresh();
    } catch (error) {
      console.error("Error en la operación:", error);
      toast({
        title: "Error",
        description: `Hubo un problema: ${String(error)}`,
      });
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8 border rounded-md p-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Titulares</h3>
          <Button type="button" variant={"secondary"} onClick={handleAddTitle}>
            <Plus className="mr-2 h-4 w-4" />
            Agregar título
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
          {/* Título principal (form hook) */}
          <FormField
            control={form.control}
            name="titulo"
            render={({ field }) => (
              <FormItem className="col-span-1 sm:col-span-1">
                <FormLabel>Titulo</FormLabel>
                <FormControl>
                  <Input placeholder="Ingresa el titulo de la nota" {...field} />
                </FormControl>
                <FormDescription>Por favor ingresa el titulo.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Campos adicionales simples (state-driven) */}
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

        {/* Enviar */}
        <div className="flex justify-end">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cargando...
              </>
            ) : isUpdate ? (
              "Actualizar"
            ) : (
              "Crear"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
