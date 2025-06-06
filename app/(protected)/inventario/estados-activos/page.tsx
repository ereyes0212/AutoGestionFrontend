import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { List } from "lucide-react";
import { getEstadoActivo } from "./actions";
import { columns } from "./components/columns";
import { DataTable } from "./components/data-table";
import EstadoActivoListMobile from "./components/tipoSeccion-list-mobile";

export default async function TipoSeccion() {

  const permisos = await getSessionPermisos();


  const data = await getEstadoActivo();
  if (!permisos?.includes("ver_estados_activo")) {
    return <NoAcceso />;
  }

  return (
    <div className="container mx-auto py-2">
      <HeaderComponent
        Icon={List}
        description="En este apartado podrá ver todas los diferentes estados de activos."
        screenName="Estados de activos"
      />

      <div className="hidden md:block">
        <DataTable columns={columns} data={data} />
      </div>
      <div className="block md:hidden">
        <EstadoActivoListMobile estadoActivo={data} />
      </div>
    </div>
  );
}
