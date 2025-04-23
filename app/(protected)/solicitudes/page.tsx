import { File } from "lucide-react";
import { getSession, getSessionPermisos } from "@/auth";
import { redirect } from "next/navigation";
import {  getSolicitudesByEmpleado } from "./actions";
import { DataTable } from "./components/data-table";
import { columns } from "./components/columns";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import SolicitudesListMobile from "./components/employee-list-mobile";

export default async function Empleados() {

  const permisos = await getSessionPermisos();


  const data = await getSolicitudesByEmpleado();

  if (!permisos?.includes("ver_empleados")) {
    return <NoAcceso />;
  }

  return (
    <div className="container mx-auto py-2">
      <HeaderComponent
        Icon={File}
        description="En este apartado podrá ver todas las solicitudes"
        screenName="Solicitudes"
      />

      <div className="hidden md:block">
        <DataTable columns={columns} data={data} />
      </div>
      <div className="block md:hidden">
        <SolicitudesListMobile empleados={data} />
      </div>
    </div>
  );
}
