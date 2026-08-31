"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";

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
import { contenidoEmpaqueLabel } from "../utils";

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

  const { fields } = useFieldArray({ control: form.control, name: "existencias" });

  const unidadId = form.watch("unidadId");
  const unidadEmpaqueId = form.watch("unidadEmpaqueId");
  const cantidadPorEmpaque = Number(form.watch("cantidadPorEmpaque")) || 1;

  const unidadNombre = unidades.find((u) => u.id === unidadId)?.nombre ?? "";
  const empaqueNombre = unidades.find((u) => u.id === unidadEmpaqueId)?.nombre ?? null;
  const manejaEmpaque = !!unidadEmpaqueId;

  const equivalencia = contenidoEmpaqueLabel(cantidadPorEmpaque, unidadNombre, empaqueNombre);

  async function onSubmit(data: InsumoFormValues) {
    const payload = {
      id: data.id,
      nombre: data.nombre,
      descripcion: data.descripcion,
      unidadId: data.unidadId,
      unidadEmpaqueId: data.unidadEmpaqueId || null,
      cantidadPorEmpaque: data.cantidadPorEmpaque,
      activo: data.activo ?? true,
      existencias: data.existencias.map((existencia) => ({
        ciudadId: existencia.ciudadId,
        stockMinimo: existencia.stockMinimo,
        stockInicial: existencia.stockInicial ?? 0,
        stockInicialEnEmpaques: existencia.stockInicialEnEmpaques ?? false,
      })),
    };

    try {
      if (isUpdate) {
        await putInsumo(payload);
      } else {
        await postInsumo(payload);
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
                  En esta unidad se lleva el stock y se registran las salidas.
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
                    if (!nuevo) form.setValue("cantidadPorEmpaque", 1);
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
        </div>

        {/* Existencias por ciudad */}
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold">Existencias por ciudad</h3>
            <p className="text-xs text-muted-foreground">
              Cada bodega lleva su propio stock mínimo
              {!isUpdate ? " y su stock inicial" : ""}.
            </p>
          </div>

          <div className="space-y-3">
            {fields.map((campo, indice) => (
              <div
                key={campo.id}
                className="grid grid-cols-1 gap-3 rounded-md border p-3 sm:grid-cols-4"
              >
                <div className="flex items-end">
                  <span className="text-sm font-medium">
                    {form.getValues(`existencias.${indice}.ciudadNombre`)}
                  </span>
                </div>

                <FormField
                  control={form.control}
                  name={`existencias.${indice}.stockMinimo`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock mínimo</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {!isUpdate && (
                  <>
                    <FormField
                      control={form.control}
                      name={`existencias.${indice}.stockInicial`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stock inicial</FormLabel>
                          <FormControl>
                            <Input type="number" min={0} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {manejaEmpaque && (
                      <FormField
                        control={form.control}
                        name={`existencias.${indice}.stockInicialEnEmpaques`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>El inicial está en</FormLabel>
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
                                  {unidadNombre || "Unidades"}
                                </SelectItem>
                                <SelectItem value="EMPAQUES">{empaqueNombre}</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
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
