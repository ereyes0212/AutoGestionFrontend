import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { ListCheck } from "lucide-react";
import { getReportesDiseño } from "./actions";
import { columns } from "./components/columns";
import { DataTable } from "./components/data-table";
import DownloadReportePorDia from "./components/download-reporte-por-dia";
import ReportListMobile from "./components/usuario-list-mobile";

export default async function EstadoServicio() {



  const permisos = await getSessionPermisos();

  if (!permisos?.includes("ver_reporte_diseno")) {
    return <NoAcceso />;
  }

  const data = await getReportesDiseño();
  return (
    <div className="container mx-auto py-2">
      <HeaderComponent
        Icon={ListCheck}
        description="En este apartado podrá ver todos los reportes de diseño generados por los usuarios."
        screenName="Reporte de diseño"
      />
      <section className="mb-6">
        <DownloadReportePorDia />
      </section>
      <div className="hidden md:block">
        <DataTable columns={columns} data={data} />
      </div>
      <div className="block md:hidden">
        <ReportListMobile reportes={data} />
      </div>

    </div>
  );
}
