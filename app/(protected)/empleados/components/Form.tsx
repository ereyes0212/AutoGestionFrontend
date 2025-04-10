"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form"; // Importamos useForm
import { zodResolver } from "@hookform/resolvers/zod"; // Usamos el resolutor de Zod

import { z } from "zod";
import { Empleado, EmpleadoSchema } from "../schema"; // Tu esquema de Zod para empleados
import { postEmpleado, putEmpleado } from "../actions"; // Tu función para enviar datos
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
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Empresa } from "@/lib/Types";
import { Puesto } from "../../puestos/types";
import { Empleado as EmpleadoModel } from "../type";
import { CheckboxEmpresas } from "./ComboBox";

export function EmpleadoFormulario({
  isUpdate,
  initialData,
  empresas,
  puestos,
  jefe,
  empresaSeleccionada,
}: {
  isUpdate: boolean;
  initialData?: z.infer<typeof EmpleadoSchema>;
  empresas: Empresa[];
  puestos: Puesto[];
  jefe: EmpleadoModel[];
  empresaSeleccionada?: Empresa;
}) {
  const { toast } = useToast();
  const router = useRouter();

  // Usamos Zod para resolver la validación
  const form = useForm<z.infer<typeof EmpleadoSchema>>({
    resolver: zodResolver(EmpleadoSchema), // Pasamos el esquema Zod al resolver
    defaultValues: initialData || {}, // Valores iniciales si es actualización
  });

  // Verificación de validez antes del submit
  // const { formState } = form;
  //forma de saber si un form esta valido o no
  // const isValid = formState.errors;
  // console.log("isValid");
  // console.log(isValid);
  async function onSubmit(data: z.infer<typeof EmpleadoSchema>) {

    const empleadoData = {
      id: initialData?.id, // Aquí pasamos el ID si es actualización
      empleado: data,
    };


    try {
      if (isUpdate) {
        await putEmpleado(empleadoData); // Llamada a la API para actualizar
      } else {
        await postEmpleado(empleadoData); // Llamada a la API para crear un nuevo empleado
      }

      // Notificación de éxito
      toast({
        title: isUpdate ? "Actualización Exitosa" : "Creación Exitosa",
        description: isUpdate
          ? "El empleado ha sido actualizado."
          : "El empleado ha sido creado.",
      });

      router.push("/empleados"); // Redirige después de la acción
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
                  Por favor ingresa tu nombre completo.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* Apellido */}
          <FormField
            control={form.control}
            name="apellido"
            render={({ field }) => (
              <FormItem className="col-span-1 sm:col-span-1">
                {" "}
                {/* Asignamos el ancho adecuado */}
                <FormLabel>Apellido</FormLabel>
                <FormControl>
                  <Input placeholder="Ingresa tu apellido" {...field} />
                </FormControl>
                <FormDescription>
                  Por favor ingresa tu apellido.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* Edad */}
          <FormField
            control={form.control}
            name="edad"
            render={({ field }) => (
              <FormItem className="col-span-1 sm:col-span-1">
                {" "}
                {/* Asignamos el ancho adecuado */}
                <FormLabel>Edad</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    value={field.value}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
                <FormDescription>Por favor ingresa tu edad.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* Género */}
          <FormField
            control={form.control}
            name="genero"
            render={({ field }) => (
              <FormItem className="col-span-1 sm:col-span-1">
                {" "}
                {/* Asignamos el ancho adecuado */}
                <FormLabel>Género</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un género" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Masculino">Masculino</SelectItem>
                      <SelectItem value="Femenino">Femenino</SelectItem>
                      <SelectItem value="Otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormDescription>Indica tu género.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
             <FormField
              control={form.control}
              name="empresas"
              render={({ field }) => {
                const clientesIniciales = empresaSeleccionada
                  ? [{ id: empresaSeleccionada.id, nombre: empresaSeleccionada.nombre }]
                  : empresas;

                return (
                  <FormItem>
                    <FormLabel>Selecciona Clientes</FormLabel>
                    <FormControl>
                      {empresaSeleccionada ? (
                        <Input value={empresaSeleccionada.nombre} disabled />
                      ) : (
                        <CheckboxEmpresas
                          clientes={clientesIniciales}
                          selectedClientes={field.value?.map((cliente) => cliente.id) || []}
                          onChange={(selected) => {
                            const selectedClientes = empresas.filter((c) => selected.includes(c.id || ""));
                            field.onChange(selectedClientes);
                          }}
                        />
                      )}
                    </FormControl>
                    <FormDescription>Selecciona los clientes que deseas asignar.</FormDescription>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

          <FormField
            control={form.control}
            name="puesto_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Puestos</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un puesto" />
                    </SelectTrigger>
                    <SelectContent>
                      {puestos.map((puesto) => (
                        <SelectItem key={puesto.id} value={puesto.id || ''} >
                          {puesto.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormDescription>Selecciona el puesto del empleado.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="jefe_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Jefe</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un jefe" />
                    </SelectTrigger>
                    <SelectContent>
                      {jefe.map((jefeSelected) => (
                        <SelectItem key={jefeSelected.id} value={jefeSelected.id || ''} >
                          {jefeSelected.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormDescription>Selecciona el jefe directo del empleado.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Correo */}
        <FormField
          control={form.control}
          name="correo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Correo electrónico</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="Ingresa tu correo electrónico"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Debes ingresar un correo electrónico válido.
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
