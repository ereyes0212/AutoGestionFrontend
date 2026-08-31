import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { PlusCircle } from "lucide-react";
import { CiudadFormulario } from "../components/Form";

export default async function Create() {
  const permisos = await getSessionPermisos();

  if (!permisos?.includes("crear_ciudades")) {
    return <NoAcceso />;
  }

  return (
    <div>
      <HeaderComponent
        Icon={PlusCircle}
        description="Registre una nueva ciudad con inventario propio."
        screenName="Crear Ciudad"
      />
      <CiudadFormulario isUpdate={false} initialData={{ nombre: "", activo: true }} />
    </div>
  );
}
