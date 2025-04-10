import { Users } from "lucide-react";
import { getSessionPermisos } from "@/auth";
import { getPuestos } from "./actions";
import { DataTable } from "./components/data-table";
import { columns } from "./components/columns";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import EmpresaListMobile from "./components/puesto-list-mobile";

export default async function Puestos() {

  const permisos = await getSessionPermisos();


  const data = await getPuestos();
  console.log(data)
  if (!permisos?.includes("ver_puestos")) {
    return <NoAcceso />;
  }

  return (
    <div className="container mx-auto py-2">
      <HeaderComponent
        Icon={Users}
        description="En este apartado podrá ver todos los puestos de la empresa."
        screenName="Puestos"
      />

      <div className="hidden md:block">
        <DataTable columns={columns} data={data} />
      </div>
      <div className="block md:hidden">
        <EmpresaListMobile puesto={data} />
      </div>
    </div>
  );
}
