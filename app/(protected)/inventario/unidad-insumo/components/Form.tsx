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
import { postUnidadInsumo, putUnidadInsumo } from "../actions";
import { UnidadInsumoSchema } from "../schema";

export function UnidadInsumoFormulario({
  isUpdate,
  initialData,
}: {
  isUpdate: boolean;
  initialData: z.infer<typeof UnidadInsumoSchema>;
}) {
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof UnidadInsumoSchema>>({
    resolver: zodResolver(UnidadInsumoSchema),
    defaultValues: initialData,
  });

  async function onSubmit(data: z.infer<typeof UnidadInsumoSchema>) {
    try {
      if (isUpdate) {
        await putUnidadInsumo(data);
      } else {
        await postUnidadInsumo(data);
      }

      toast({
        title: isUpdate ? "Actualización Exitosa" : "Creación Exitosa",
        description: isUpdate
          ? "La unidad de medida ha sido actualizada."
          : "La unidad de medida ha sido creada.",
      });

      router.push("/inventario/unidad-insumo");
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
          <FormField
            control={form.control}
            name="nombre"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input placeholder="Caja, Unidad, Bote..." {...field} />
                </FormControl>
                <FormDescription>
                  Por favor ingresa el nombre de la unidad de medida.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="abreviatura"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Abreviatura</FormLabel>
                <FormControl>
                  <Input placeholder="cja, und, bte..." {...field} />
                </FormControl>
                <FormDescription>
                  Abreviatura que se mostrará junto al stock (opcional).
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="descripcion"
            render={({ field }) => (
              <FormItem className="col-span-1 sm:col-span-2">
                <FormLabel>Descripción</FormLabel>
                <FormControl>
                  <Input placeholder="Descripción de la unidad" {...field} />
                </FormControl>
                <FormDescription>
                  Por favor ingresa la descripción de la unidad de medida.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
                  Define si el registro está activo o inactivo.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

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
