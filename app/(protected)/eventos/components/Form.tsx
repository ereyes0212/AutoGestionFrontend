"use client"

import type React from "react"

import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { CreateEvento } from "../actions"
import { EventoFromSchema, EventoSchema } from "../schema"

interface EventoFormProps {
  isUpdate: boolean
  initialData: Partial<EventoFromSchema>
}

export function EventoForm({ isUpdate, initialData }: EventoFormProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [fileName, setFileName] = useState<string>(initialData?.facturaAdjunta || "")

  const form = useForm<EventoFromSchema>({
    resolver: zodResolver(EventoSchema),
    defaultValues: {
      ...initialData,
      titulo: initialData?.titulo || "",
      descripcion: initialData?.descripcion || "",
      fecha: initialData?.fecha || new Date(),
      ubicacion: initialData?.ubicacion || "",
      facturaAdjunta: initialData?.facturaAdjunta || "", // guardaremos solo el nombre
      notaEnlace: initialData?.notaEnlace || "",
      monto: initialData?.monto || 0,
    },
  })

  // Solo guardamos el nombre del archivo (simulación)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, field: any) => {
    const file = e.target.files?.[0]
    if (!file) return

    // guardamos solo el nombre del fichero
    setFileName(file.name)
    field.onChange(file.name)
  }

  async function onSubmit(data: EventoFromSchema) {
    try {
      const eventoData = {
        ...data,
        fecha: data.fecha.toISOString(),
        facturaAdjunta: data.facturaAdjunta ?? "",
      }

      if (isUpdate) {
        // await updateEvento(eventoData.id!, eventoData)
        console.log("Update evento (simulado):", eventoData)
      } else {
        // await CreateEvento(eventoData)
        console.log("Create evento (simulado):", eventoData)
        await CreateEvento(eventoData)
      }

      toast({
        title: isUpdate ? "Actualización Exitosa" : "Creación Exitosa",
        description: isUpdate ? "El evento ha sido actualizado." : "El evento ha sido creado.",
      })

      router.push("/eventos")
      router.refresh()
    } catch (error) {
      console.error("Error en la operación:", error)
      toast({
        title: "Error",
        description: `Hubo un problema: ${error}`,
        variant: "destructive",
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 border rounded-md p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="titulo"
            render={({ field }) => (
              <FormItem className="col-span-1 sm:col-span-1">
                <FormLabel>Título</FormLabel>
                <FormControl>
                  <Input placeholder="Ingrese el título del evento" {...field} />
                </FormControl>
                <FormDescription>Por favor ingresa el título del evento.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="ubicacion"
            render={({ field }) => (
              <FormItem className="col-span-1 sm:col-span-1">
                <FormLabel>Ubicación</FormLabel>
                <FormControl>
                  <Input placeholder="Ingrese la ubicación" {...field} />
                </FormControl>
                <FormDescription>Por favor ingresa la ubicación del evento.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="descripcion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Ingrese la descripción del evento"
                  className="min-h-[100px] resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>Por favor ingresa la descripción del evento.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="fecha"
            render={({ field }) => (
              <FormItem className="flex flex-col col-span-1 sm:col-span-1">
                <FormLabel>Fecha</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !field.value && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(field.value, "PPP", { locale: es }) : <span>Seleccione una fecha</span>}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus locale={es} />
                  </PopoverContent>
                </Popover>
                <FormDescription>Selecciona la fecha del evento.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="monto"
            render={({ field }) => (
              <FormItem className="col-span-1 sm:col-span-1">
                <FormLabel>Monto</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...field}
                    onChange={(e) => field.onChange(Number.parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormDescription>Ingrese el monto en formato numérico.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="facturaAdjunta"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Factura Adjunta</FormLabel>
              <FormControl>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange(e, field)}
                    className="cursor-pointer"
                  />
                  {fileName && <span className="text-sm text-muted-foreground">{fileName}</span>}
                </div>
              </FormControl>
              <FormDescription>Sube el archivo de la factura (PDF, JPG, PNG). (Simulado: guardamos solo el nombre)</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notaEnlace"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Enlace de la Nota</FormLabel>
              <FormControl>
                <Input placeholder="https://ejemplo.com/nota" {...field} />
              </FormControl>
              <FormDescription>Ingresa el enlace de la nota relacionada.</FormDescription>
            </FormItem>
          )}
        />

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
  )
}
