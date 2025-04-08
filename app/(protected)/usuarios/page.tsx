import { ListCheck, Users } from "lucide-react";
import { getSession, getSessionPermisos } from "@/auth";
import { redirect } from "next/navigation";
import { getUsuarios } from "./actions";
import { DataTable } from "./components/data-table";
import { columns } from "./components/columns";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import UserListMobile from "./components/usuario-list-mobile";

export default async function EstadoServicio() {

  
  
  const permisos = await getSessionPermisos();
  
  if (!permisos?.includes("ver_usuarios")) {
    return <NoAcceso />;
  }
  
  const data = await getUsuarios();
  return (
    <div className="container mx-auto py-2">
      <HeaderComponent
        Icon={ListCheck}
        description="En este apartado podrá ver todos los usuarios"
        screenName="Usuarios"
      />
      <div className="hidden md:block">
        <DataTable columns={columns} data={data} />
      </div>
      <div className="block md:hidden">
        <UserListMobile usuarios={data} />
      </div>

    </div>
  );
}
