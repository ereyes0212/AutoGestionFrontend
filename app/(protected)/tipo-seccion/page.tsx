import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { Check } from "lucide-react";
import { getTipoSeccion } from "./actions";
import { columns } from "./components/columns";
import { DataTable } from "./components/data-table";
import TipoSeccionListMobile from "./components/tipoSeccion-list-mobile";

export default async function TipoSeccion() {

  const permisos = await getSessionPermisos();


  const data = await getTipoSeccion();
  if (!permisos?.includes("ver_tipo_seccion")) {
    return <NoAcceso />;
  }

  return (
    <div className="container mx-auto py-2">
      <HeaderComponent
        Icon={Check}
        description="En este apartado podrá ver todas las diferentes secciónes de reporte."
        screenName="Tipo de Secciones de reporte"
      />

      <div className="hidden md:block">
        <DataTable columns={columns} data={data} />
      </div>
      <div className="block md:hidden">
        <TipoSeccionListMobile tipoSeccion={data} />
      </div>
    </div>
  );
}
