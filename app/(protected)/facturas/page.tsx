import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { ReceiptText } from "lucide-react";
import { getEmpleadosParaFiltro, getEventosFactura, getNotasEmpleadoActual } from "./actions";
import FormEventoFactura from "./components/FormEventoFactura";
import FiltrosFacturas from "./components/filtros";
import { columns } from "./components/columns";
import { DataTable } from "./components/data-table";

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

  const [notas, eventos, empleados] = await Promise.all([
    getNotasEmpleadoActual(),
    getEventosFactura({
      desde: searchParams?.desde,
      hasta: searchParams?.hasta,
      empleadoId: searchParams?.empleadoId,
    }),
    puedeVerTodas ? getEmpleadosParaFiltro() : Promise.resolve([]),
  ]);

  return (
    <div className="container mx-auto py-2 space-y-4">
      <HeaderComponent
        Icon={ReceiptText}
        screenName="Facturas de combustible"
        description="Crea eventos, sube la factura a S3 y vincúlala con una nota."
      />

      {puedeCrear && <FormEventoFactura notas={notas} />}

      {puedeVerTodas && <FiltrosFacturas empleados={empleados} />}

      <DataTable columns={columns} data={eventos} />
    </div>
  );
}
