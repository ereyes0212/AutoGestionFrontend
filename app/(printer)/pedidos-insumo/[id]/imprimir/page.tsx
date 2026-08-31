import { getPedidoById } from "@/app/(protected)/inventario/insumos/pedidos/actions";
import { getSessionPermisos } from "@/auth";
import { Inbox } from "lucide-react";
import PedidoPrint from "./pedido-print";

export const dynamic = "force-dynamic";

export default async function ImprimirPedidoPage({ params }: { params: { id: string } }) {
  const permisos = await getSessionPermisos();

  if (!permisos?.includes("ver_pedidos_insumo")) {
    return (
      <div style={{ textAlign: "center", marginTop: "2rem" }}>
        <Inbox size={50} color="red" />
        <p>No tienes permiso para imprimir pedidos</p>
      </div>
    );
  }

  const pedido = await getPedidoById(params.id);

  if (!pedido) {
    return (
      <div style={{ textAlign: "center", marginTop: "2rem" }}>
        <Inbox size={50} color="red" />
        <p>No se encuentra el pedido</p>
      </div>
    );
  }

  return <PedidoPrint pedido={pedido} />;
}
