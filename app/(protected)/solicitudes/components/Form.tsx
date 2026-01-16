"use client";;
import { zodResolver } from "@hookform/resolvers/zod"; // Usamos el resolutor de Zod
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form"; // Importamos useForm

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
import { postSolicitud, putSolicitud } from "../actions"; // Tu función para enviar datos
import { SolicitudSchema } from "../schema"; // Tu esquema de Zod para empleados
export function EmpleadoFormulario({
  isUpdate,
  initialData,
}: {
  isUpdate: boolean;
  initialData?: z.infer<typeof SolicitudSchema>;
}) {
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof SolicitudSchema>>({
    resolver: zodResolver(SolicitudSchema),
    defaultValues: initialData || { tipoSolicitud: "VACACION" },
  });

  async function onSubmit(data: z.infer<typeof SolicitudSchema>) {

    const solicitudData = {
      id: initialData?.id, // Aquí pasamos el ID si es actualización
      solicitud: data,
    };


    try {
      if (isUpdate) {
        await putSolicitud({
          solicitud: {
            ...solicitudData.solicitud,
            descripcion: solicitudData.solicitud.descripcion,
            fechaInicio: solicitudData.solicitud.fechaInicio.toISOString(),
            fechaFin: solicitudData.solicitud.fechaFin.toISOString(),
            tipoSolicitud: solicitudData.solicitud.tipoSolicitud,
          },
        }); // Llamada a la API para actualizar
      } else {
        // Validar que fechaInicio y fechaFin existen antes de enviar
        if (!solicitudData.solicitud.fechaInicio || !solicitudData.solicitud.fechaFin) {
          toast({
            title: "Error",
            description: "Debes seleccionar ambas fechas: inicio y fin.",
          });
          return;
        }
        await postSolicitud({
          Solicitud: {
            ...solicitudData.solicitud,
            fechaInicio: solicitudData.solicitud.fechaInicio.toISOString(),
            fechaFin: solicitudData.solicitud.fechaFin.toISOString(),
            tipoSolicitud: solicitudData.solicitud.tipoSolicitud,
          },
        }); // Llamada a la API para crear un nuevo empleado
      }

      // Notificación de éxito
      toast({
        title: isUpdate ? "Actualización Exitosa" : "Creación Exitosa",
        description: isUpdate
          ? "El empleado ha sido actualizado."
          : "El empleado ha sido creado.",
      });

      router.push("/solicitudes"); // Redirige después de la acción
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
            name="descripcion"
            render={({ field }) => (
              <FormItem className="col-span-1 sm:col-span-1">
                {" "}
                {/* Asignamos el ancho adecuado */}
                <FormLabel>Descripción</FormLabel>
                <FormControl>
                  <Input placeholder="Ingresa una descripción" {...field} />
                </FormControl>
                <FormDescription>
                  Por favor ingresa una descripción.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="tipoSolicitud"
            render={({ field }) => (
              <FormItem className="col-span-1 sm:col-span-1">
                <FormLabel>Tipo de solicitud</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={(val) => field.onChange(val)}
                    value={field.value || "VACACION"}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VACACION">Vacación</SelectItem>
                      <SelectItem value="DIACOMPENSATORIO">Día compensatorio</SelectItem>
                      <SelectItem value="MIXTO">Mixto</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormDescription>Selecciona el tipo de solicitud.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* Edad */}
          <FormField
            control={form.control}
            name="fechaInicio"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Fecha de inicio</FormLabel>
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
                      startMonth={new Date(2024, 0)}
                      endMonth={new Date(2040, 0)}
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < new Date("1900-01-01")
                      }
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  Fecha de inicio de solicitud.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* Edad */}
          <FormField
            control={form.control}
            name="fechaFin"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Fecha de finalización</FormLabel>
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
                      startMonth={new Date(2024, 0)}
                      endMonth={new Date(2040, 0)}
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < new Date("1900-01-01")
                      }
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  Fecha de fin de solicitud.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
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
