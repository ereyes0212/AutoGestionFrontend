"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Loader2 } from "lucide-react";

import { z } from "zod";
import { Puesto } from "../../puestos/types";
import { createEmpleado, updateEmpleado } from "../actions";
import { EmpleadoSchema } from "../schema";
import { Empleado as EmpleadoModel } from "../type";

export function EmpleadoFormulario({
  isUpdate,
  initialData,
  puestos,
  jefe,
}: {
  isUpdate: boolean;
  initialData?: z.infer<typeof EmpleadoSchema>;
  puestos: Puesto[];
  jefe: EmpleadoModel[];
}) {
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof EmpleadoSchema>>({
    resolver: zodResolver(EmpleadoSchema),
    defaultValues: initialData || {},
  });

  const { formState } = form;

  //forma de saber si un form esta valido o no
  const isValid = formState.errors;
  console.log("isValid");
  console.log(isValid);
  async function onSubmit(data: z.infer<typeof EmpleadoSchema>) {
    // Verificación de validez antes del submit
    const empleadoData = {
      id: initialData?.id,
      empleado: data,
    };

    try {
      if (isUpdate) {
        await updateEmpleado(empleadoData.id!, empleadoData.empleado);
      } else {
        await createEmpleado(empleadoData.empleado);
      }

      toast({
        title: isUpdate ? "Actualización Exitosa" : "Creación Exitosa",
        description: isUpdate
          ? "El empleado ha sido actualizado."
          : "El empleado ha sido creado.",
      });

      router.push("/empleados");
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
                  <Input placeholder="Ingresa tu nombre" {...field} />
                </FormControl>
                <FormDescription>Por favor ingresa tu nombre completo.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* Apellido */}
          <FormField
            control={form.control}
            name="apellido"
            render={({ field }) => (
              <FormItem className="col-span-1">
                <FormLabel>Apellido</FormLabel>
                <FormControl>
                  <Input placeholder="Ingresa tu apellido" {...field} />
                </FormControl>
                <FormDescription>Por favor ingresa tu apellido.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Número de Identificación */}
          <FormField
            control={form.control}
            name="numeroIdentificacion"
            render={({ field }) => (
              <FormItem className="col-span-1">
                <FormLabel>Número de Identificación</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ej. 0801-1999-00001"
                    {...field}
                  />
                </FormControl>
                <FormDescription>Documento o cédula del empleado.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Correo */}
          <FormField
            control={form.control}
            name="correo"
            render={({ field }) => (
              <FormItem className="col-span-1">
                <FormLabel>Correo electrónico</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="Ingresa tu correo" {...field} />
                </FormControl>
                <FormDescription>Debe ser un correo válido.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Fecha de Nacimiento */}
          <FormField
            control={form.control}
            name="fechaNacimiento"
            render={({ field }) => (
              <FormItem className="flex flex-col col-span-1">
                <FormLabel>Fecha de nacimiento</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-[240px] pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP", { locale: es })
                        ) : (
                          <span>Selecciona una fecha</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>Fecha de nacimiento del empleado.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Fecha de Ingreso */}
          <FormField
            control={form.control}
            name="fechaIngreso"
            render={({ field }) => (
              <FormItem className="flex flex-col col-span-1">
                <FormLabel>Fecha de ingreso</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-[240px] pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP", { locale: es })
                        ) : (
                          <span>Selecciona una fecha</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>Fecha en que ingresó a la empresa.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Departamento de Domicilio */}
          <FormField
            control={form.control}
            name="departamentoDomicilio"
            render={({ field }) => (
              <FormItem className="col-span-1">
                <FormLabel>Departamento de domicilio</FormLabel>
                <FormControl>
                  <Input placeholder="Ingresa el departamento" {...field} />
                </FormControl>
                <FormDescription>Departamento de residencia.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Ciudad de Domicilio */}
          <FormField
            control={form.control}
            name="ciudadDomicilio"
            render={({ field }) => (
              <FormItem className="col-span-1">
                <FormLabel>Ciudad de domicilio</FormLabel>
                <FormControl>
                  <Input placeholder="Ingresa la ciudad" {...field} />
                </FormControl>
                <FormDescription>Ciudad de residencia.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Colonia */}
          <FormField
            control={form.control}
            name="colonia"
            render={({ field }) => (
              <FormItem className="col-span-1">
                <FormLabel>Colonia/Barrio</FormLabel>
                <FormControl>
                  <Input placeholder="Ingresa la colonia" {...field} />
                </FormControl>
                <FormDescription>Colonia o barrio de residencia.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Teléfono */}
          <FormField
            control={form.control}
            name="telefono"
            render={({ field }) => (
              <FormItem className="col-span-1">
                <FormLabel>Teléfono</FormLabel>
                <FormControl>
                  <Input placeholder="Ej. 9999-9999" {...field} />
                </FormControl>
                <FormDescription>Número de teléfono móvil o fijo.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Profesión */}
          <FormField
            control={form.control}
            name="profesion"
            render={({ field }) => (
              <FormItem className="col-span-1">
                <FormLabel>Profesión u oficio</FormLabel>
                <FormControl>
                  <Input placeholder="Ingresa la profesión" {...field} />
                </FormControl>
                <FormDescription>Profesión del empleado.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Vacaciones */}
          <FormField
            control={form.control}
            name="vacaciones"
            render={({ field }) => (
              <FormItem className="col-span-1">
                <FormLabel>Días de vacaciones</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    placeholder="0"
                    {...field}
                    onChange={(e) => {
                      // Convertimos el string a número antes de pasarlo a Zod
                      const val = e.target.value;
                      field.onChange(val === "" ? undefined : Number(val));
                    }}
                  />
                </FormControl>
                <FormDescription>Cantidad de días de vacaciones.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Género */}
          <FormField
            control={form.control}
            name="genero"
            render={({ field }) => (
              <FormItem className="col-span-1">
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

          {/* Puesto */}
          <FormField
            control={form.control}
            name="puesto_id"
            render={({ field }) => (
              <FormItem className="col-span-1">
                <FormLabel>Puesto</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un puesto" />
                    </SelectTrigger>
                    <SelectContent>
                      {puestos.map((puestoItem) => (
                        <SelectItem key={puestoItem.id} value={puestoItem.id || ""}>
                          {puestoItem.nombre}
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

          {/* Jefe */}
          <FormField
            control={form.control}
            name="jefe_id"
            render={({ field }) => (
              <FormItem className="col-span-1">
                <FormLabel>Jefe</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un jefe" />
                    </SelectTrigger>
                    <SelectContent>
                      {jefe.map((j) => (
                        <SelectItem key={j.id} value={j.id!}>
                          {j.nombre} {j.apellido}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormDescription>Selecciona el jefe directo.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Estado Activo (solo actualización) */}
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
                  Define si el empleado está activo o inactivo.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Botón Enviar */}
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
