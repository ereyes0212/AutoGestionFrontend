"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Loader2, Plus, Trash2, Wand2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Ciudad, Insumo } from "../../types";
import { crearPedido, getSugerenciasPedido } from "../actions";

type LineaPedido = {
  clave: string;
  insumoId: string;
  cantidad: number;
  enEmpaques: boolean;
  observacion: string;
};

function lineaNueva(): LineaPedido {
  return {
    clave: Math.random().toString(36).slice(2),
    insumoId: "",
    cantidad: 1,
    enEmpaques: false,
    observacion: "",
  };
}

export default function PedidoForm({
  insumos,
  ciudades,
}: {
  insumos: Insumo[];
  ciudades: Ciudad[];
}) {
  const { toast } = useToast();
  const router = useRouter();

  const [ciudadId, setCiudadId] = useState(ciudades[0]?.id ?? "");
  const [observaciones, setObservaciones] = useState("");
  const [lineas, setLineas] = useState<LineaPedido[]>([lineaNueva()]);
  const [guardando, setGuardando] = useState(false);
  const [sugiriendo, setSugiriendo] = useState(false);

  const actualizar = (clave: string, cambios: Partial<LineaPedido>) => {
    setLineas((previas) =>
      previas.map((linea) => (linea.clave === clave ? { ...linea, ...cambios } : linea))
    );
  };

  const quitar = (clave: string) => {
    setLineas((previas) =>
      previas.length === 1 ? previas : previas.filter((linea) => linea.clave !== clave)
    );
  };

  /** Carga los insumos que están en o por debajo del mínimo en la ciudad */
  const sugerir = async () => {
    if (!ciudadId) return;

    setSugiriendo(true);
    const sugerencias = await getSugerenciasPedido(ciudadId);
    setSugiriendo(false);

    if (sugerencias.length === 0) {
      toast({
        title: "Sin faltantes",
        description: "Ningún insumo está por debajo del mínimo en esta ciudad.",
      });
      return;
    }

    setLineas(
      sugerencias.map((sugerencia) => ({
        clave: Math.random().toString(36).slice(2),
        insumoId: sugerencia.insumoId,
        // Se propone reponer al menos lo que falta para el mínimo
        cantidad: Math.max(1, sugerencia.faltante),
        enEmpaques: false,
        observacion: `Stock ${sugerencia.stockActual} / mínimo ${sugerencia.stockMinimo}`,
      }))
    );

    toast({
      title: `${sugerencias.length} insumos por debajo del mínimo`,
      description: "Revise las cantidades antes de guardar el pedido.",
    });
  };

  const guardar = async () => {
    setGuardando(true);
    const resultado = await crearPedido({
      ciudadId,
      observaciones,
      detalles: lineas
        .filter((linea) => linea.insumoId && linea.cantidad > 0)
        .map((linea) => ({
          insumoId: linea.insumoId,
          cantidad: Number(linea.cantidad),
          enEmpaques: linea.enEmpaques,
          observacion: linea.observacion,
        })),
    });
    setGuardando(false);

    if (!resultado.success) {
      toast({
        title: "Error",
        description: resultado.error,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: `Pedido #${resultado.numero} creado`,
      description: "Ya puede imprimirlo para enviarlo a autorización.",
    });

    router.push(`/inventario/insumos/pedidos/${resultado.pedidoId}`);
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="grid grid-cols-1 gap-3 p-4 md:grid-cols-3">
          <div className="space-y-1">
            <Label>Ciudad</Label>
            <Select value={ciudadId} onValueChange={setCiudadId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona la ciudad" />
              </SelectTrigger>
              <SelectContent>
                {ciudades.map((ciudad) => (
                  <SelectItem key={ciudad.id} value={ciudad.id}>
                    {ciudad.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1 md:col-span-2">
            <Label>Observaciones</Label>
            <Input
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Notas para quien autoriza la compra (opcional)"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={sugerir} disabled={sugiriendo}>
          {sugiriendo ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Wand2 className="mr-2 h-4 w-4" />
          )}
          Cargar faltantes
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setLineas((previas) => [...previas, lineaNueva()])}
        >
          <Plus className="mr-2 h-4 w-4" />
          Agregar insumo
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[220px]">Insumo</TableHead>
              <TableHead className="w-[120px]">Cantidad</TableHead>
              <TableHead className="w-[150px]">Unidad</TableHead>
              <TableHead>Observación</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lineas.map((linea) => {
              const insumo = insumos.find((i) => i.id === linea.insumoId);
              const existencia = insumo?.existencias.find((e) => e.ciudadId === ciudadId);
              const manejaEmpaque = !!insumo?.unidadEmpaqueId;

              return (
                <TableRow key={linea.clave}>
                  <TableCell>
                    <Select
                      value={linea.insumoId}
                      onValueChange={(valor) =>
                        actualizar(linea.clave, { insumoId: valor, enEmpaques: false })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un insumo" />
                      </SelectTrigger>
                      <SelectContent>
                        {insumos.map((opcion) => (
                          <SelectItem key={opcion.id} value={opcion.id!}>
                            {opcion.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {existencia && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        {existencia.bajoStock && (
                          <AlertTriangle className="h-3 w-3 text-destructive" />
                        )}
                        Stock {existencia.stockActual} / mínimo {existencia.stockMinimo}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={1}
                      value={linea.cantidad}
                      onChange={(e) =>
                        actualizar(linea.clave, { cantidad: Number(e.target.value) })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    {manejaEmpaque ? (
                      <Select
                        value={linea.enEmpaques ? "EMPAQUES" : "UNIDADES"}
                        onValueChange={(valor) =>
                          actualizar(linea.clave, { enEmpaques: valor === "EMPAQUES" })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UNIDADES">{insumo?.unidadNombre}</SelectItem>
                          <SelectItem value="EMPAQUES">
                            {insumo?.unidadEmpaqueNombre}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        {insumo?.unidadNombre ?? "-"}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Input
                      value={linea.observacion}
                      onChange={(e) =>
                        actualizar(linea.clave, { observacion: e.target.value })
                      }
                      placeholder="Opcional"
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => quitar(linea.clave)}
                      disabled={lineas.length === 1}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => router.push("/inventario/insumos/pedidos")}>
          Cancelar
        </Button>
        <Button onClick={guardar} disabled={guardando}>
          {guardando ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            "Crear pedido"
          )}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        El pedido se crea en estado pendiente y no mueve stock. El stock entra cuando se marca
        como recibido.
      </p>
    </div>
  );
}
