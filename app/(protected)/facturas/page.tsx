import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ReceiptText } from "lucide-react";
import Link from "next/link";
import { getEmpleadosParaFiltro, getEventosFactura } from "./actions";
import { columns } from "./components/columns";
import { DataTable } from "./components/data-table";
import FiltrosFacturas from "./components/filtros";

export default async function FacturasPage({
  searchParams,
}: {
  searchParams?: Record<string, string>;
}) {
  const permisos = await getSessionPermisos();
  const puedeVerPropias = permisos?.includes("ver_facturas");
  const puedeVerTodas = permisos?.includes("ver_facturas_jefe");
  const puedeCrear = permisos?.includes("crear_facturas");

  if (!puedeVerPropias && !puedeVerTodas) return <NoAcceso />;

  const [eventos, empleados] = await Promise.all([
    getEventosFactura({
      desde: searchParams?.desde,
      hasta: searchParams?.hasta,
      empleadoId: searchParams?.empleadoId,
    }),
    puedeVerTodas
      ? getEmpleadosParaFiltro({
          desde: searchParams?.desde,
          hasta: searchParams?.hasta,
        })
      : Promise.resolve([]),
  ]);

  return (
    <div className="container mx-auto py-2 space-y-4">
      <HeaderComponent
        Icon={ReceiptText}
        screenName="Facturas de combustible"
        description="Consulta los eventos y visualiza sus archivos adjuntos."
      />

      {puedeCrear && (
        <div className="flex justify-end">
          <Link href="/facturas/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Crear evento de factura
            </Button>
          </Link>
        </div>
      )}

      {puedeVerTodas && <FiltrosFacturas empleados={empleados} />}

      <DataTable columns={columns} data={eventos} />
    </div>
  );
}
