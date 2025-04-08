import { ListCheck, Users } from "lucide-react";
import { getSession, getSessionPermisos } from "@/auth";
import { redirect } from "next/navigation";
import { getRolesPermisos } from "./actions";
import { DataTable } from "./components/data-table";
import { columns } from "./components/columns";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import RoleListMobile from "./components/roles-list-mobile";

export default async function EstadoServicio() {



  const permisos = await getSessionPermisos();
  if (!permisos?.includes("ver_roles")) {
    return <NoAcceso />;
  }

  const data = await getRolesPermisos();
  return (
    <div className="container mx-auto py-2">
      <HeaderComponent
        Icon={ListCheck}
        description="En este apartado podrá ver todos los roles"
        screenName="Roles"
      />
      <div className="hidden md:block">
        <DataTable columns={columns} data={data} />
      </div>
      <div className="block md:hidden">
        <RoleListMobile roles={data} />
      </div>
    </div>
  );
}
