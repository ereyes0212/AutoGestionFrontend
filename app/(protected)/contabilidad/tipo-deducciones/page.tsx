import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { CircleDollarSignIcon } from "lucide-react";
import { getAjustes } from "./actions";
import { columns } from "./components/columns";
import { DataTable } from "./components/data-table";
import TipoDeduccionesListMobile from "./components/tipoDeduccion-list-mobile";

export default async function TipoDeduccion() {

  const permisos = await getSessionPermisos();


  const data = await getAjustes();
  if (!permisos?.includes("ver_tipodeducciones")) {
    return <NoAcceso />;
  }

  return (
    <div className="container mx-auto py-2">
      <HeaderComponent
        Icon={CircleDollarSignIcon}
        description="En este apartado podrá ver todas las diferentes deducciones de planilla."
        screenName="Tipo de deducciones"
      />

      <div className="hidden md:block">
        <DataTable columns={columns} data={data} />
      </div>
      <div className="block md:hidden">
        <TipoDeduccionesListMobile tipoDeduccion={data} />
      </div>
    </div>
  );
}
