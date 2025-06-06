"use client";

import { zodResolver } from "@hookform/resolvers/zod"; // Usamos el resolutor de Zod
import { useRouter } from "next/navigation";
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
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { postEstadoActivo, putEstadoActivo } from "../actions"; // Tu función para enviar datos
import { EstadoActivoSchema } from "../schema"; // Tu esquema de Zod para tipo de sección

export function EstadoActivoFormulario({
  isUpdate,
  initialData,
}: {
  isUpdate: boolean;
  initialData: z.infer<typeof EstadoActivoSchema>;
}) {
  const { toast } = useToast();
  const router = useRouter();

  // Usamos Zod para resolver la validación
  const form = useForm<z.infer<typeof EstadoActivoSchema>>({
    resolver: zodResolver(EstadoActivoSchema),
    defaultValues: initialData,
  });

  // Verificación de validez antes del submit
  // const { formState } = form;

  // //forma de saber si un form esta valido o no
  // const isValid = formState.errors;
  // console.log("🚀 ~ isValid:", isValid)
  async function onSubmit(data: z.infer<typeof EstadoActivoSchema>) {
    const estadoActivo = {
      estadoActivo: data,
    };


    try {
      if (isUpdate) {
        await putEstadoActivo(estadoActivo.estadoActivo); // Llamada a la API para actualizar
      } else {
        await postEstadoActivo(estadoActivo.estadoActivo); // Llamada a la API para crear un nuevo tipo de sección
      }

      // Notificación de éxito
      toast({
        title: isUpdate ? "Actualización Exitosa" : "Creación Exitosa",
        description: isUpdate
          ? "el estado de activo ha sido actualizado."
          : "el estado de activo ha sido creado.",
      });

      router.push("/inventario/estados-activos"); // Redirige después de la acción
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
          {" "}
          {/* Grid de 1 columna en móviles y 2 en pantallas más grandes */}
          {/* Nombre */}
          <FormField
            control={form.control}
            name="nombre"
            render={({ field }) => (
              <FormItem className="col-span-1 sm:col-span-1">
                {" "}
                {/* Asignamos el ancho adecuado */}
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input placeholder="Ingresa tu nombre" {...field} />
                </FormControl>
                <FormDescription>
                  Por favor ingresa el nombre de la categoria.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* Nombre */}
          <FormField
            control={form.control}
            name="descripcion"
            render={({ field }) => (
              <FormItem className="col-span-1 sm:col-span-1">
                {" "}
                {/* Asignamos el ancho adecuado */}
                <FormLabel>Descripción</FormLabel>
                <FormControl>
                  <Input placeholder="Ingresa tu nombre" {...field} />
                </FormControl>
                <FormDescription>
                  Por favor ingresa la descripción de la categoria.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
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
