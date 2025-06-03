"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { z } from "zod";

import { postAjuste, putAjuste } from "../actions"; // Nuevas funciones
import { AjusteTipoSchema } from "../schema"; // Nuevo esquema de Zod

export function AjusteTipoFormulario({
  isUpdate,
  initialData,
}: {
  isUpdate: boolean;
  initialData: z.infer<typeof AjusteTipoSchema>;
}) {
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof AjusteTipoSchema>>({
    resolver: zodResolver(AjusteTipoSchema),
    defaultValues: initialData,
  });

  async function onSubmit(data: z.infer<typeof AjusteTipoSchema>) {
    try {
      if (isUpdate) {
        await putAjuste(data);
      } else {
        await postAjuste(data);
      }

      toast({
        title: isUpdate ? "Actualización Exitosa" : "Creación Exitosa",
        description: isUpdate
          ? "El ajuste ha sido actualizado."
          : "El ajuste ha sido creado.",
      });

      router.push("/contabilidad/tipo-deducciones");
      router.refresh();
    } catch (error) {
      console.error("Error en la operación:", error);
      toast({
        title: "Error",
        description: `Hubo un problema: ${error}`,
      });
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8 border rounded-md p-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Nombre */}
          <FormField
            control={form.control}
            name="nombre"
            render={({ field }) => (
              <FormItem className="col-span-1">
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input placeholder="Ej. Seguro Social" {...field} />
                </FormControl>
                <FormDescription>
                  Ingresa el nombre del ajuste.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Descripción */}
          <FormField
            control={form.control}
            name="descripcion"
            render={({ field }) => (
              <FormItem className="col-span-1">
                <FormLabel>Descripción</FormLabel>
                <FormControl>
                  <Input placeholder="Descripción del ajuste" {...field} />
                </FormControl>
                <FormDescription>
                  Breve descripción del ajuste.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Categoría */}
          <FormField
            control={form.control}
            name="categoria"
            render={({ field }) => (
              <FormItem className="col-span-1">
                <FormLabel>Categoría</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DEDUCCION">Deducción</SelectItem>
                      <SelectItem value="BONO">Bono</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormDescription>
                  Especifica si es deducción o bono.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Monto por defecto */}
          <FormField
            control={form.control}
            name="montoPorDefecto"
            render={({ field }) => (
              <FormItem className="col-span-1">
                <FormLabel>Monto por Defecto</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Ej. 100.00"
                    value={field.value ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      // Si la cadena está vacía, pasamos undefined para que no rompa
                      field.onChange(val === "" ? undefined : parseFloat(val));
                    }}
                    onBlur={field.onBlur}
                  />
                </FormControl>
                <FormDescription>
                  El monto base para este ajuste.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

        </div>

        {/* Estado Activo (solo si es actualización) */}
        {isUpdate && (
          <FormField
            control={form.control}
            name="activo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={(value) => field.onChange(value === "true")}
                    defaultValue={field.value ? "true" : "false"}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Activo</SelectItem>
                      <SelectItem value="false">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormDescription>
                  Define si el ajuste está activo o inactivo.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

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
