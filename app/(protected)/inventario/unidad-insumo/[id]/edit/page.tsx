import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { Pencil } from "lucide-react";
import { redirect } from "next/navigation";
import { getUnidadInsumoById } from "../../actions";
import { UnidadInsumoFormulario } from "../../components/Form";

export default async function Edit({ params }: { params: { id: string } }) {
  const permisos = await getSessionPermisos();

  if (!permisos?.includes("editar_unidad_insumo")) {
    return <NoAcceso />;
  }

  const unidad = await getUnidadInsumoById(params.id);
  if (!unidad) {
    redirect("/inventario/unidad-insumo");
  }

  const unidadEdit = {
    id: unidad.id,
    nombre: unidad.nombre,
    abreviatura: unidad.abreviatura,
    descripcion: unidad.descripcion,
    activo: unidad.activo,
  };

  return (
    <div>
      <HeaderComponent
        Icon={Pencil}
        description="En este apartado podrá editar una unidad de medida de insumos."
        screenName="Editar Unidad de Medida"
      />
      <UnidadInsumoFormulario isUpdate={true} initialData={unidadEdit} />
    </div>
  );
}
