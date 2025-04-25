import { File } from "lucide-react";
import { getSession, getSessionPermisos } from "@/auth";
import { redirect } from "next/navigation";
import { getSolicitudesAprobaciones, getSolicitudesAprobacionesHistorico, getSolicitudesByEmpleado } from "./actions";
import { DataTable } from "./components/data-table";
import { columns } from "./components/columns";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import SolicitudesListMobile from "./components/employee-list-mobile";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function Empleados() {
  const permisos = await getSessionPermisos();
  const data = await getSolicitudesByEmpleado();

  if (!permisos?.includes("ver_empleados")) {
    return <NoAcceso />;
  }

  const aprobacionesPendientes = await getSolicitudesAprobaciones();
  const aprobacionesPendientesHistorico = await getSolicitudesAprobacionesHistorico();

  return (
    <div className="container mx-auto py-2 relative">
      <HeaderComponent
      Icon={File}
      description="En este apartado podrá ver todas las solicitudes"
      screenName="Solicitudes"
      />

      <div className="my-4 flex justify-between">
      {aprobacionesPendientes.length > 0 && (
        <Link href={`/solicitudes/aprobacion`} className="w-full md:w-auto">
        <Button>
          Solicitudes de Aprobación ({aprobacionesPendientes.length})
        </Button>
        </Link>
      )}
      {aprobacionesPendientesHistorico.length > 0 && (
        <Link href={`/solicitudes/aprobacion/historico`} className="w-full md:w-auto">
        <Button>
          Solicitudes de Aprobación Histórico ({aprobacionesPendientesHistorico.length})
        </Button>
        </Link>
      )}
      </div>

      <div className="hidden md:block">
      <DataTable columns={columns} data={data} />
      </div>
      <div className="block md:hidden">
      <SolicitudesListMobile empleados={data} />
      </div>
    </div>
  );
}
