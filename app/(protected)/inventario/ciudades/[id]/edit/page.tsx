import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { Pencil } from "lucide-react";
import { redirect } from "next/navigation";
import { getCiudadById } from "../../actions";
import { CiudadFormulario } from "../../components/Form";

export default async function Edit({ params }: { params: { id: string } }) {
  const permisos = await getSessionPermisos();

  if (!permisos?.includes("crear_ciudades")) {
    return <NoAcceso />;
  }

  const ciudad = await getCiudadById(params.id);
  if (!ciudad) {
    redirect("/inventario/ciudades");
  }

  return (
    <div>
      <HeaderComponent
        Icon={Pencil}
        description="Edite el nombre o el estado de la ciudad."
        screenName="Editar Ciudad"
      />
      <CiudadFormulario isUpdate={true} initialData={ciudad} />
    </div>
  );
}
