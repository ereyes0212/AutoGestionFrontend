import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { PlusCircle } from "lucide-react";
import { UnidadInsumoFormulario } from "../components/Form";

export default async function Create() {
  const permisos = await getSessionPermisos();

  if (!permisos?.includes("crear_unidad_insumo")) {
    return <NoAcceso />;
  }

  const initialData = {
    id: "",
    nombre: "",
    abreviatura: "",
    descripcion: "",
    activo: true,
  };

  return (
    <div>
      <HeaderComponent
        Icon={PlusCircle}
        description="En este apartado podrá crear una nueva unidad de medida para los insumos."
        screenName="Crear Unidad de Medida"
      />
      <UnidadInsumoFormulario isUpdate={false} initialData={initialData} />
    </div>
  );
}
