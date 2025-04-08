import { ListCheck, Users } from "lucide-react";
import { getSession, getSessionPermisos } from "@/auth";
import { redirect } from "next/navigation";
import { getPermisos } from "./actions";
import { DataTable } from "./components/data-table";
import { columns } from "./components/columns";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import PermissionListMobile from "./components/permisos-list-mobile";
import { ScrollArea } from "@radix-ui/react-scroll-area";

export default async function EstadoServicio() {

  const permisos = await getSessionPermisos();


  const data = await getPermisos();

  if (!permisos?.includes("ver_permisos")) {
    return <NoAcceso />;
  }

  return (
    <div className="container mx-auto py-2">
      <HeaderComponent
        Icon={ListCheck}
        description="En este apartado podrá ver todos los permisos"
        screenName="Permisos"
      />

      <div className="hidden md:block">
        <DataTable columns={columns} data={data} />
      </div>
      <div className="block md:hidden">
        <PermissionListMobile permisos={data} />
      </div>
    </div>
  );
}
