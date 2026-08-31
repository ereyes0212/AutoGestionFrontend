import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, ClipboardList, Printer } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getPedidoById } from "../actions";
import CancelarPedidoDialog from "../components/cancelar-pedido-dialog";
import RecibirPedidoDialog from "../components/recibir-pedido-dialog";

export default async function PedidoDetalle({ params }: { params: { id: string } }) {
  const permisos = await getSessionPermisos();

  if (!permisos?.includes("ver_pedidos_insumo")) {
    return <NoAcceso />;
  }

  const pedido = await getPedidoById(params.id);
  if (!pedido) {
    redirect("/inventario/insumos/pedidos");
  }

  const estadoBadge =
    pedido.estado === "RECIBIDO"
      ? { etiqueta: "Recibido", variant: "default" as const }
      : pedido.estado === "CANCELADO"
        ? { etiqueta: "Cancelado", variant: "outline" as const }
        : { etiqueta: "Pendiente", variant: "secondary" as const };

  return (
    <div className="container mx-auto py-2">
      <HeaderComponent
        Icon={ClipboardList}
        description={`${pedido.ciudadNombre} · solicitado el ${pedido.fechaSolicitudLabel} por ${pedido.solicitadoPor}`}
        screenName={`Pedido #${pedido.numero}`}
      />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <Button variant="outline" asChild>
          <Link href="/inventario/insumos/pedidos" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
        </Button>

        <Button variant="outline" asChild>
          <Link
            href={`/pedidos-insumo/${pedido.id}/imprimir`}
            target="_blank"
            className="flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            Imprimir
          </Link>
        </Button>

        {pedido.estado === "PENDIENTE" && permisos.includes("recibir_pedidos_insumo") && (
          <RecibirPedidoDialog pedido={pedido} />
        )}

        {pedido.estado === "PENDIENTE" && permisos.includes("crear_pedidos_insumo") && (
          <CancelarPedidoDialog pedidoId={pedido.id} numero={pedido.numero} />
        )}

        <Badge variant={estadoBadge.variant} className="ml-auto">
          {estadoBadge.etiqueta}
        </Badge>
      </div>

      {(pedido.observaciones || pedido.motivoCancelacion || pedido.recibidoPor) && (
        <Card className="mb-4">
          <CardContent className="space-y-1 p-4 text-sm">
            {pedido.observaciones && (
              <p>
                <span className="text-muted-foreground">Observaciones: </span>
                {pedido.observaciones}
              </p>
            )}
            {pedido.recibidoPor && (
              <p>
                <span className="text-muted-foreground">Recibido por: </span>
                {pedido.recibidoPor} · {pedido.fechaRecepcionLabel}
              </p>
            )}
            {pedido.motivoCancelacion && (
              <p>
                <span className="text-muted-foreground">Motivo de cancelación: </span>
                {pedido.motivoCancelacion}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Insumo</TableHead>
                <TableHead>Solicitado</TableHead>
                <TableHead>Recibido</TableHead>
                <TableHead>Stock actual</TableHead>
                <TableHead>Duró</TableHead>
                <TableHead>Observación</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pedido.detalles.map((detalle) => (
                <TableRow key={detalle.id}>
                  <TableCell className="font-medium">{detalle.insumoNombre}</TableCell>
                  <TableCell className="whitespace-nowrap">{detalle.cantidadLabel}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {detalle.cantidadRecibidaLabel ?? (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {detalle.stockActual}
                    <span className="block text-xs text-muted-foreground">
                      mínimo {detalle.stockMinimo}
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {detalle.diasDesdePedidoAnterior !== null ? (
                      <>
                        {detalle.diasDesdePedidoAnterior}{" "}
                        {detalle.diasDesdePedidoAnterior === 1 ? "día" : "días"}
                        <span className="block text-xs text-muted-foreground">
                          desde pedido #{detalle.pedidoAnteriorNumero} (
                          {detalle.pedidoAnteriorFechaLabel})
                        </span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">Primera compra</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {detalle.observacion || "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
