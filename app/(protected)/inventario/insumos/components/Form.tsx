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
import { UnidadInsumo } from "../../unidad-insumo/types";
import { postInsumo, putInsumo } from "../actions";
import { InsumoFormValues, InsumoSchema } from "../schema";
import { contenidoEmpaqueLabel, formatCantidad } from "../utils";

/** Radix no acepta SelectItem con value vacío */
const SIN_EMPAQUE = "SIN_EMPAQUE";

export function InsumoFormulario({
  isUpdate,
  initialData,
  unidades,
}: {
  isUpdate: boolean;
  initialData: InsumoFormValues;
  unidades: UnidadInsumo[];
}) {
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<InsumoFormValues>({
    resolver: zodResolver(InsumoSchema),
    defaultValues: initialData,
  });

  const unidadId = form.watch("unidadId");
  const unidadEmpaqueId = form.watch("unidadEmpaqueId");
  const cantidadPorEmpaque = Number(form.watch("cantidadPorEmpaque")) || 1;
  const stockInicial = Number(form.watch("stockInicial")) || 0;
  const stockInicialEnEmpaques = form.watch("stockInicialEnEmpaques");

  const unidadNombre = unidades.find((u) => u.id === unidadId)?.nombre ?? "";
  const empaqueNombre = unidades.find((u) => u.id === unidadEmpaqueId)?.nombre ?? null;
  const manejaEmpaque = !!unidadEmpaqueId;

  const equivalencia = contenidoEmpaqueLabel(cantidadPorEmpaque, unidadNombre, empaqueNombre);

  async function onSubmit(data: InsumoFormValues) {
    try {
      if (isUpdate) {
        await putInsumo({
          id: data.id,
          nombre: data.nombre,
          descripcion: data.descripcion,
          unidadId: data.unidadId,
          unidadEmpaqueId: data.unidadEmpaqueId || null,
          cantidadPorEmpaque: data.cantidadPorEmpaque,
          stockMinimo: data.stockMinimo,
          stockActual: 0,
          activo: data.activo,
        });
      } else {
        await postInsumo({
          nombre: data.nombre,
          descripcion: data.descripcion,
          unidadId: data.unidadId,
          unidadEmpaqueId: data.unidadEmpaqueId || null,
          cantidadPorEmpaque: data.cantidadPorEmpaque,
          stockMinimo: data.stockMinimo,
          stockActual: 0,
          stockInicial: data.stockInicial ?? 0,
          stockInicialEnEmpaques: data.stockInicialEnEmpaques ?? false,
          activo: data.activo ?? true,
        });
      }

      toast({
        title: isUpdate ? "Actualización Exitosa" : "Creación Exitosa",
        description: isUpdate
          ? "El insumo ha sido actualizado."
          : "El insumo ha sido creado.",
      });

      router.push("/inventario/insumos");
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
                  <Input placeholder="Papel higiénico, jabón, clips..." {...field} />
                </FormControl>
                <FormDescription>Nombre del insumo o producto consumible.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="descripcion"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción</FormLabel>
                <FormControl>
                  <Input placeholder="Descripción del insumo" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="unidadId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unidad de consumo</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una unidad" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {unidades.map((unidad) => (
                      <SelectItem key={unidad.id} value={unidad.id!}>
                        {unidad.nombre}
                        {unidad.abreviatura ? ` (${unidad.abreviatura})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  En esta unidad se lleva el stock y se registran las salidas (unidad, rollo,
                  bote).
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="unidadEmpaqueId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unidad de empaque (opcional)</FormLabel>
                <Select
                  value={field.value || SIN_EMPAQUE}
                  onValueChange={(valor) => {
                    const nuevo = valor === SIN_EMPAQUE ? "" : valor;
                    field.onChange(nuevo);
                    if (!nuevo) {
                      form.setValue("cantidadPorEmpaque", 1);
                      form.setValue("stockInicialEnEmpaques", false);
                    }
                  }}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sin empaque" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={SIN_EMPAQUE}>Sin empaque</SelectItem>
                    {unidades
                      .filter((unidad) => unidad.id !== unidadId)
                      .map((unidad) => (
                        <SelectItem key={unidad.id} value={unidad.id!}>
                          {unidad.nombre}
                          {unidad.abreviatura ? ` (${unidad.abreviatura})` : ""}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Cómo se compra el insumo (caja, fardo). Déjelo en blanco si se compra suelto.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {manejaEmpaque && (
            <FormField
              control={form.control}
              name="cantidadPorEmpaque"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contenido por empaque</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} placeholder="6" {...field} />
                  </FormControl>
                  <FormDescription>
                    {equivalencia ??
                      "Cuántas unidades de consumo trae cada empaque (una caja de 6 jabones = 6)."}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="stockMinimo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stock mínimo</FormLabel>
                <FormControl>
                  <Input type="number" min={0} placeholder="0" {...field} />
                </FormControl>
                <FormDescription>
                  En unidades de consumo{unidadNombre ? ` (${unidadNombre.toLowerCase()})` : ""}.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {!isUpdate && (
            <>
              <FormField
                control={form.control}
                name="stockInicial"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock inicial</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} placeholder="0" {...field} />
                    </FormControl>
                    <FormDescription>
                      Se registrará como una entrada en el historial.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {manejaEmpaque && (
                <FormField
                  control={form.control}
                  name="stockInicialEnEmpaques"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>El stock inicial está en</FormLabel>
                      <Select
                        value={field.value ? "EMPAQUES" : "UNIDADES"}
                        onValueChange={(valor) => field.onChange(valor === "EMPAQUES")}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="UNIDADES">
                            {unidadNombre || "Unidades de consumo"}
                          </SelectItem>
                          <SelectItem value="EMPAQUES">{empaqueNombre}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {stockInicialEnEmpaques && stockInicial > 0
                          ? `Ingresarán ${formatCantidad(
                              stockInicial * cantidadPorEmpaque,
                              unidadNombre
                            )} al stock.`
                          : "Elija si la cantidad de arriba está en empaques o en unidades."}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </>
          )}
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
                  Define si el insumo está activo o inactivo.
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
