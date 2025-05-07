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
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { TipoSeccion } from "../../tipo-seccion/types";
import { postReporteDiseño, putReporteDiseño } from "../actions";
import { ReporteDisenoDTOSchema } from "../schema";

type ReporteFormValues = z.infer<typeof ReporteDisenoDTOSchema>;

interface FormularioReporteProps {
  isUpdate: boolean;
  initialData?: Partial<ReporteFormValues> & { id?: string };
  tipoSecciones: TipoSeccion[];
}

export function FormularioReporte({
  isUpdate,
  initialData,
  tipoSecciones,
}: FormularioReporteProps) {
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<ReporteFormValues>({
    resolver: zodResolver(ReporteDisenoDTOSchema),
    defaultValues: {
      SeccionId: initialData?.SeccionId ?? "",
      PaginaInicio: initialData?.PaginaInicio?.toString() ?? "",
      PaginaFin: initialData?.PaginaFin?.toString() ?? "",
      HoraInicio: initialData?.HoraInicio ?? "08:00:00",
      HoraFin: initialData?.HoraFin ?? "09:00:00",
      Observacion: initialData?.Observacion ?? "",
    },
  });

  const onSubmit = async (data: ReporteFormValues) => {
    try {
      if (isUpdate && initialData?.id) {
        await putReporteDiseño({ reporte: { id: initialData.id, ...data } });
        toast({
          title: "Reporte actualizado",
          description: "El reporte de diseño se actualizó correctamente",
        });
      } else {
        await postReporteDiseño({ reporte: data });
        toast({
          title: "Reporte creado",
          description: "El reporte de diseño se creó correctamente",
        });
      }
      router.push("/reporte-diseno");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Ocurrió un error al guardar el reporte" });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-4 border rounded">
        {/* Tipo Sección */}
        <FormField
          control={form.control}
          name="SeccionId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sección</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    {/* Aquí indicamos que muestre el valor actual */}
                    <SelectValue placeholder="Selecciona una sección" />
                  </SelectTrigger>
                  <SelectContent>
                    {tipoSecciones.map((ts) => (
                      <SelectItem key={ts.id} value={ts.id || ""}>
                        {ts.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormDescription>Elige la sección del reporte</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Páginas */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="PaginaInicio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Página Inicio</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="PaginaFin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Página Fin</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Horario */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="HoraInicio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hora Inicio</FormLabel>
                <FormControl>
                  <Input type="time" step={1} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="HoraFin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hora Fin</FormLabel>
                <FormControl>
                  <Input type="time" step={1} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Observación */}
        <FormField
          control={form.control}
          name="Observacion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observación</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>Notas adicionales (opcional)</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Botón */}
        <div className="flex justify-end">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
