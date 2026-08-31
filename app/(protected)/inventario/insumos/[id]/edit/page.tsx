import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { Pencil } from "lucide-react";
import { redirect } from "next/navigation";
import { getUnidadesInsumoActivas } from "../../../unidad-insumo/actions";
import { getCiudades, getInsumoById } from "../../actions";
import { InsumoFormulario } from "../../components/Form";

export default async function Edit({ params }: { params: { id: string } }) {
  const permisos = await getSessionPermisos();

  if (!permisos?.includes("editar_insumos")) {
    return <NoAcceso />;
  }

  const [insumo, unidades, ciudades] = await Promise.all([
    getInsumoById(params.id),
    getUnidadesInsumoActivas(),
    getCiudades(),
  ]);

  if (!insumo) {
    redirect("/inventario/insumos");
  }

  // Se listan todas las ciudades, aunque el insumo todavía no tenga stock en alguna
  const existencias = ciudades.map((ciudad) => {
    const existencia = insumo.existencias.find((e) => e.ciudadId === ciudad.id);
    return {
      ciudadId: ciudad.id,
      ciudadNombre: ciudad.nombre,
      stockMinimo: existencia?.stockMinimo ?? 0,
    };
  });

  const insumoEdit = {
    id: insumo.id,
    nombre: insumo.nombre,
    descripcion: insumo.descripcion,
    unidadId: insumo.unidadId,
    unidadEmpaqueId: insumo.unidadEmpaqueId ?? "",
    cantidadPorEmpaque: insumo.cantidadPorEmpaque,
    activo: insumo.activo,
    existencias,
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
