"use client";

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
import { Rol } from "@/lib/Types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Empleado } from "../../empleados/type";
import { createUsuario, updateUsuario } from "../actions";
import { UsuarioSchema } from "../schema";
import { UsuarioCreate, UsuarioUpdate } from "../type";

export function Formulario({
  isUpdate,
  initialData,
  empleados, // Lista de empleados sin usuario asignado
  roles, // Lista de roles
  empleadoAsignado, // Empleado asignado, si existe
}: {
  isUpdate: boolean;
  initialData?: z.infer<typeof UsuarioSchema>;
  empleados: Empleado[]; // Lista de empleados sin usuario asignado
  roles: Rol[]; // Lista de roles
  empleadoAsignado?: Empleado | null; // Empleado asignado, si es actualización
}) {
  const { toast } = useToast();
  const router = useRouter();

  // Usamos Zod para resolver la validación
  const form = useForm<z.infer<typeof UsuarioSchema>>({
    resolver: zodResolver(UsuarioSchema), // Pasamos el esquema Zod al resolver
    defaultValues: initialData || {},
  });

  async function onSubmit(data: z.infer<typeof UsuarioSchema>) {
    const usuarioData = {
      usuario: data.usuario,
      empleado_id: data.empleado_id,
      rol_id: data.rol_id,
      activo: isUpdate ? data.activo : undefined,
      id: isUpdate ? data.id : undefined,
    };

    try {
      if (isUpdate) {
        await updateUsuario(usuarioData as UsuarioUpdate);
      } else {
        await createUsuario(usuarioData as UsuarioCreate);
      }

      toast({
        title: isUpdate ? "Actualización Exitosa" : "Creación Exitosa",
        description: isUpdate
          ? "El usuario ha sido actualizado."
          : "El usuario ha sido creado.",
      });

      router.push("/usuarios");
      router.refresh();
    } catch (error) {
      console.error("Error en la operación:", error);
      toast({
        title: "Error",
        description: `Hubo un problema:`,
      });
    }
  }

  // Combina la lista de empleados sin usuario asignado con el empleado asignado
  const empleadosFinales = empleadoAsignado
    ? [empleadoAsignado, ...empleados]
    : empleados;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8 border rounded-md p-4"
      >
        {/* Usuario */}
        <FormField
          control={form.control}
          name="usuario"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Usuario</FormLabel>
              <FormControl>
                <Input placeholder="Ingresa el nombre de usuario" {...field} />
              </FormControl>
              <FormDescription>Por favor ingresa el nombre de usuario.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />



        {/* Empleado */}
        <FormField
          control={form.control}
          name="empleado_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Empleado</FormLabel>
              <FormControl>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un empleado" />
                  </SelectTrigger>
                  <SelectContent>
                    {empleadosFinales.map((empleado) => (
                      <SelectItem key={empleado.id} value={empleado.id || ''}>
                        {empleado.nombre} {empleado.apellido}
                        {empleadoAsignado?.id === empleado.id && " (Asignado)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormDescription>Selecciona un empleado de la lista.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Rol */}
        <FormField
          control={form.control}
          name="rol_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rol</FormLabel>
              <FormControl>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((rol) => (
                      <SelectItem key={rol.id} value={rol.id || ''}>
                        {rol.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormDescription>Selecciona el rol del usuario.</FormDescription>
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
                  Define si el registro está activo o inactivo.
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
