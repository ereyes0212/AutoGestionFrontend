import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { Pencil } from "lucide-react";
import { redirect } from "next/navigation";
import { getUnidadesInsumoActivas } from "../../../unidad-insumo/actions";
import { getInsumoById } from "../../actions";
import { InsumoFormulario } from "../../components/Form";

export default async function Edit({ params }: { params: { id: string } }) {
  const permisos = await getSessionPermisos();

  if (!permisos?.includes("editar_insumos")) {
    return <NoAcceso />;
  }

  const [insumo, unidades] = await Promise.all([
    getInsumoById(params.id),
    getUnidadesInsumoActivas(),
  ]);

  if (!insumo) {
    redirect("/inventario/insumos");
  }

  const insumoEdit = {
    id: insumo.id,
    nombre: insumo.nombre,
    descripcion: insumo.descripcion,
    unidadId: insumo.unidadId,
    unidadEmpaqueId: insumo.unidadEmpaqueId ?? "",
    cantidadPorEmpaque: insumo.cantidadPorEmpaque,
    stockMinimo: insumo.stockMinimo,
    activo: insumo.activo,
  };

  return (
    <div>
      <HeaderComponent
        Icon={Pencil}
        description="En este apartado podrá editar un insumo. El stock se modifica con entradas y salidas."
        screenName="Editar Insumo"
      />
      <InsumoFormulario isUpdate={true} initialData={insumoEdit} unidades={unidades} />
    </div>
  );
}
