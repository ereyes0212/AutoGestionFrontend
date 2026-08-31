"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDownToLine, ArrowUpFromLine, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { registrarMovimiento } from "../actions";
import { MovimientoInsumoFormValues, MovimientoInsumoSchema } from "../schema";
import { Ciudad, Insumo, TipoMovimientoInsumo } from "../types";
import { formatCantidad } from "../utils";
import FirmaLink from "./firma-link";

export type EmpleadoOpcion = {
  id: string;
  nombre: string;
  apellido: string;
};

interface MovimientoDialogProps {
  tipo: TipoMovimientoInsumo;
  insumos: Insumo[];
  ciudades: Ciudad[];
  empleados: EmpleadoOpcion[];
  /** Cuando se abre desde el detalle de un insumo, el insumo queda fijo */
  insumoFijoId?: string;
  /** Ciudad preseleccionada (la del filtro de la pantalla) */
  ciudadInicialId?: string;
}

export default function MovimientoDialog({
  tipo,
  insumos,
  ciudades,
  empleados,
  insumoFijoId,
  ciudadInicialId,
}: MovimientoDialogProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [firmaUrl, setFirmaUrl] = useState<string | null>(null);

  const esSalida = tipo === "SALIDA";

  const valoresIniciales: MovimientoInsumoFormValues = {
    insumoId: insumoFijoId ?? "",
    ciudadId: ciudadInicialId ?? ciudades[0]?.id ?? "",
    tipo,
    cantidad: 1,
    enEmpaques: false,
    empleadoSolicitanteId: "",
    observaciones: "",
  };

  const form = useForm<MovimientoInsumoFormValues>({
    resolver: zodResolver(MovimientoInsumoSchema),
    defaultValues: valoresIniciales,
  });

  const insumoSeleccionado = insumos.find((i) => i.id === form.watch("insumoId"));
  const ciudadId = form.watch("ciudadId");
  const enEmpaques = form.watch("enEmpaques");
  const cantidad = Number(form.watch("cantidad")) || 0;

  const existencia = insumoSeleccionado?.existencias.find((e) => e.ciudadId === ciudadId);
  const stockCiudad = existencia?.stockActual ?? 0;

  const manejaEmpaque = !!insumoSeleccionado?.unidadEmpaqueId;
  const cantidadBase = enEmpaques
    ? cantidad * (insumoSeleccionado?.cantidadPorEmpaque ?? 1)
    : cantidad;

  async function onSubmit(data: MovimientoInsumoFormValues) {
    const resultado = await registrarMovimiento({
      insumoId: data.insumoId,
      ciudadId: data.ciudadId,
      tipo,
      cantidad: data.cantidad,
      enEmpaques: data.enEmpaques,
      empleadoSolicitanteId: esSalida ? data.empleadoSolicitanteId : undefined,
      observaciones: data.observaciones,
    });

    if (!resultado.success) {
      toast({
        title: "Error",
        description: resultado.error ?? "No se pudo registrar el movimiento.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: esSalida ? "Salida registrada" : "Entrada registrada",
      description: `Stock actualizado: ${formatCantidad(
        resultado.stockResultante ?? 0,
        insumoSeleccionado?.unidadNombre ?? ""
      )}`,
    });

    router.refresh();

    if (resultado.firmaUrl) {
      setFirmaUrl(resultado.firmaUrl);
    } else {
      cerrar(false);
    }
  }

  function cerrar(abierto: boolean) {
    if (!abierto) {
      form.reset(valoresIniciales);
      setFirmaUrl(null);
    }
    setOpen(abierto);
  }

  return (
    <Dialog open={open} onOpenChange={cerrar}>
      <DialogTrigger asChild>
        <Button variant={esSalida ? "secondary" : "default"} className="flex items-center gap-2">
          {esSalida ? (
            <ArrowUpFromLine className="h-4 w-4" />
          ) : (
            <ArrowDownToLine className="h-4 w-4" />
          )}
          {esSalida ? "Registrar salida" : "Registrar entrada"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{esSalida ? "Registrar salida" : "Registrar entrada"}</DialogTitle>
          <DialogDescription>
            {esSalida
              ? "La cantidad se restará automáticamente del stock de la ciudad."
              : "La cantidad se sumará al stock de la ciudad."}
          </DialogDescription>
        </DialogHeader>

        {firmaUrl ? (
          <div className="space-y-4">
            <FirmaLink url={firmaUrl} />
            <DialogFooter>
              <Button onClick={() => cerrar(false)}>Listo</Button>
            </DialogFooter>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="ciudadId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ciudad</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona la ciudad" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ciudades.map((ciudad) => (
                            <SelectItem key={ciudad.id} value={ciudad.id}>
                              {ciudad.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="insumoId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Insumo</FormLabel>
                      <Select
                        onValueChange={(valor) => {
                          field.onChange(valor);
                          form.setValue("enEmpaques", false);
                        }}
                        defaultValue={field.value}
                        disabled={!!insumoFijoId}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un insumo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {insumos.map((insumo) => (
                            <SelectItem key={insumo.id} value={insumo.id!}>
                              {insumo.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cantidad"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cantidad</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {manejaEmpaque && (
                  <FormField
                    control={form.control}
                    name="enEmpaques"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unidad del registro</FormLabel>
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
                              {insumoSeleccionado?.unidadNombre}
                            </SelectItem>
                            <SelectItem value="EMPAQUES">
                              {insumoSeleccionado?.unidadEmpaqueNombre}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {insumoSeleccionado && (
                <div className="rounded-md border bg-muted/40 p-3 text-sm">
                  {insumoSeleccionado.contenidoLabel && (
                    <p className="text-muted-foreground">{insumoSeleccionado.contenidoLabel}</p>
                  )}
                  <p>
                    <span className="text-muted-foreground">Movimiento: </span>
                    {esSalida ? "-" : "+"}
                    {formatCantidad(cantidadBase, insumoSeleccionado.unidadNombre ?? "")}
                    {enEmpaques && insumoSeleccionado.unidadEmpaqueNombre
                      ? ` (${cantidad} × ${insumoSeleccionado.cantidadPorEmpaque})`
                      : ""}
                  </p>
                  <p>
                    <span className="text-muted-foreground">
                      Stock en {existencia?.ciudadNombre ?? "la ciudad"}:{" "}
                    </span>
                    {formatCantidad(stockCiudad, insumoSeleccionado.unidadNombre ?? "")}
                    <span className="text-muted-foreground"> → quedaría: </span>
                    {formatCantidad(
                      esSalida ? stockCiudad - cantidadBase : stockCiudad + cantidadBase,
                      insumoSeleccionado.unidadNombre ?? ""
                    )}
                  </p>
                </div>
              )}

              {esSalida && (
                <FormField
                  control={form.control}
                  name="empleadoSolicitanteId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Empleado que solicitó</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un empleado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {empleados.map((empleado) => (
                            <SelectItem key={empleado.id} value={empleado.id}>
                              {empleado.nombre} {empleado.apellido}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="observaciones"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observaciones</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Observaciones del movimiento (opcional)"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => cerrar(false)}
                  disabled={form.formState.isSubmitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    "Registrar"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
