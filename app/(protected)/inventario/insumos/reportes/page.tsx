import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileBarChart } from "lucide-react";
import Link from "next/link";
import { getCiudades, getInsumos } from "../actions";
import ReporteInsumosComponent from "./components/reporte-insumos";

export default async function ReportesInsumosPage() {
  const permisos = await getSessionPermisos();

  if (
    !permisos?.includes("ver_reportes_insumo") &&
    !permisos?.includes("ver_movimientos_insumo")
  ) {
    return <NoAcceso />;
  }

  const [insumos, ciudades] = await Promise.all([getInsumos(), getCiudades()]);

  return (
    <div className="container mx-auto py-2">
      <HeaderComponent
        Icon={FileBarChart}
        description="Genere reportes de insumos por fecha, por producto o el reporte general de existencias."
        screenName="Reportes de insumos"
      />

      <div className="mb-4">
        <Button variant="outline" asChild>
          <Link href="/inventario/insumos" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver a insumos
          </Link>
        </Button>
      </div>

      <ReporteInsumosComponent insumos={insumos} ciudades={ciudades} />
    </div>
  );
}
