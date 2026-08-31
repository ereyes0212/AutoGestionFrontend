import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { PlusCircle } from "lucide-react";
import { getCiudades, getInsumosActivos } from "../../actions";
import PedidoForm from "../components/pedido-form";

export default async function CrearPedidoPage() {
  const permisos = await getSessionPermisos();

  if (!permisos?.includes("crear_pedidos_insumo")) {
    return <NoAcceso />;
  }

  const [insumos, ciudades] = await Promise.all([getInsumosActivos(), getCiudades()]);

  return (
    <div className="container mx-auto py-2">
      <HeaderComponent
        Icon={PlusCircle}
        description="Arme el pedido con los insumos que se necesitan comprar. Queda pendiente hasta que llegue el producto."
        screenName="Nuevo pedido de insumos"
      />

      {insumos.length === 0 || ciudades.length === 0 ? (
        <p className="rounded-md border p-4 text-sm text-muted-foreground">
          Necesita al menos un insumo activo y una ciudad registrada para crear un pedido.
        </p>
      ) : (
        <PedidoForm insumos={insumos} ciudades={ciudades} />
      )}
    </div>
  );
}
