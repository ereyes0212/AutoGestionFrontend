"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form"; // Importamos useForm
import { zodResolver } from "@hookform/resolvers/zod"; // Usamos el resolutor de Zod
import { z } from "zod";
import { RolSchema } from "../schema"; // Tu esquema de Zod
import { postRol, putRol } from "../actions"; // Funciones para enviar datos
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
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PermisosRol } from "@/lib/Types";
import { CheckboxPermisos } from "./checkboxForm";
import { Loader2 } from "lucide-react";

export function FormularioRol({
  isUpdate,
  initialData,
  permisos,
}: {
  isUpdate: boolean;
  initialData?: z.infer<typeof RolSchema>;
  permisos: PermisosRol[]; // Lista de permisos
}) {
  const { toast } = useToast();
  const router = useRouter();

 
  const form = useForm<z.infer<typeof RolSchema>>({
    resolver: zodResolver(RolSchema), 
    defaultValues: initialData || { permisosRol: [] },
  });

  async function onSubmit(data: z.infer<typeof RolSchema>) {
    const rolData = {
      rol: data,
      permisosRol: data.permisosRol.map((permiso: PermisosRol) => permiso.id),
    };

    try {
      if (isUpdate) {
        await putRol(rolData);

      } else {
        await postRol(rolData);
      }

      // Notificación de éxito
      toast({
        title: isUpdate ? "Actualización Exitosa" : "Creación Exitosa",
        description: isUpdate
          ? "El rol ha sido actualizado."
          : "El rol ha sido creado.",
      });

      router.push("/roles"); // Redirige después de la acción
      router.refresh();
    } catch (error) {
      // Manejo de error
      console.error("Error en la operación:", error);
      toast({
        title: "Error",
        description: `Hubo un problema:`,
      });
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8 border rounded-md p-4"
      >
        {/* Nombre del Rol */}
        <FormField
          control={form.control}
          name="nombre"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del Rol</FormLabel>
              <FormControl>
                <Input placeholder="Ingresa el nombre del rol" {...field} />
              </FormControl>
              <FormDescription>
                Por favor ingresa el nombre del rol.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Descripción del Rol */}
        <FormField
          control={form.control}
          name="descripcion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Input placeholder="Ingresa la descripción" {...field} />
              </FormControl>
              <FormDescription>
                Proporciona una breve descripción del rol.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Checkbox de permisos */}
        <FormField
          control={form.control}
          name="permisosRol"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Permisos del Rol</FormLabel>
              <FormControl>
                <CheckboxPermisos
                  permisos={permisos} // Pasa todos los permisos
                  selectedPermisos={
                    field.value?.map((permiso: PermisosRol) => permiso.id) || []
                  } // Solo pasamos los IDs de los permisos
                  onChange={(selected) => {
                    // Convertimos los IDs seleccionados a un array de objetos PermisosRol
                    const selectedPermisosRol = permisos.filter((permiso) =>
                      selected.includes(permiso.id)
                    );
                    field.onChange(selectedPermisosRol); // Pasamos los permisos completos al formulario
                  }}
                />
              </FormControl>
              <FormDescription>
                Selecciona los permisos asociados a este rol.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

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
                  Define si el rol está activo o inactivo.
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
