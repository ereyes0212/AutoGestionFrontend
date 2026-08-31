import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ClipboardList, Plus } from "lucide-react";
import Link from "next/link";
import { getCiudades } from "../actions";
import CiudadFiltro from "../components/ciudad-filtro";
import { getPedidos } from "./actions";
import PedidosList from "./components/pedidos-list";
import { EstadoPedidoInsumo } from "./types";

export default async function PedidosPage({
  searchParams,
}: {
  searchParams: { ciudadId?: string; estado?: string };
}) {
  const permisos = await getSessionPermisos();

  if (!permisos?.includes("ver_pedidos_insumo")) {
    return <NoAcceso />;
  }

  const estado = ["PENDIENTE", "RECIBIDO", "CANCELADO"].includes(searchParams.estado ?? "")
    ? (searchParams.estado as EstadoPedidoInsumo)
    : undefined;

  const [pedidos, ciudades] = await Promise.all([
    getPedidos({ ciudadId: searchParams.ciudadId, estado }),
    getCiudades(),
  ]);

  return (
    <div className="container mx-auto py-2">
      <HeaderComponent
        Icon={ClipboardList}
        description="Pedidos de compra de insumos. Al recibirlos, el stock de la ciudad se actualiza solo."
        screenName="Pedidos de insumos"
      />

      <div className="mb-4 space-y-3">
        <CiudadFiltro
          ciudades={ciudades}
          ciudadId={searchParams.ciudadId}
          basePath="/inventario/insumos/pedidos"
        />

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button variant="outline" asChild>
            <Link href="/inventario/insumos" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Volver a insumos
            </Link>
          </Button>
          {permisos.includes("crear_pedidos_insumo") && (
            <Button asChild>
              <Link
                href="/inventario/insumos/pedidos/create"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Nuevo pedido
              </Link>
            </Button>
          )}
        </div>
      </div>

      <PedidosList pedidos={pedidos} />
    </div>
  );
}
