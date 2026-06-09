import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { Button } from "@/components/ui/button";
import { File } from "lucide-react";
import Link from "next/link";
import { getSolicitudesAprobaciones, getSolicitudesAprobacionesHistorico, getSolicitudesByEmpleado, isCurrentUserGerenteRH } from "./actions";
import { columns } from "./components/columns";
import { DataTable } from "./components/data-table";
import SolicitudesListMobile from "./components/employee-list-mobile";

export default async function Empleados() {
  const permisos = await getSessionPermisos();
  const data = await getSolicitudesByEmpleado();

  if (!permisos?.includes("ver_solicitudes")) {
    return <NoAcceso />;
  }

  const aprobacionesPendientes = await getSolicitudesAprobaciones();
  const aprobacionesPendientesHistorico = await getSolicitudesAprobacionesHistorico();
  const esGerenteRH = await isCurrentUserGerenteRH();

  return (
    <div className="container mx-auto py-2 relative">
      <HeaderComponent
        Icon={File}
        description="En este apartado podrá ver todas las solicitudes"
        screenName="Solicitudes"
      />

      <div className="my-4 flex flex-wrap gap-2 justify-between">
        {esGerenteRH && (
          <Link href="/solicitudes/rh" className="w-full md:w-auto">
            <Button variant="secondary">
              Solicitudes de Recursos Humanos
            </Button>
          </Link>
        )}
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
