import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { Button } from "@/components/ui/button";
import { FileBarChart, History, ShoppingBasket } from "lucide-react";
import Link from "next/link";
import { getEmpleados } from "../../empleados/actions";
import { getInsumos } from "./actions";
import { columns } from "./components/columns";
import { DataTable } from "./components/data-table";
import InsumoListMobile from "./components/insumo-list-mobile";
import MovimientoDialog from "./components/movimiento-dialog";

export default async function InsumosPage() {
  const permisos = await getSessionPermisos();

  if (!permisos?.includes("ver_insumos")) {
    return <NoAcceso />;
  }

  const puedeRegistrar = permisos.includes("crear_movimiento_insumo");

  const [insumos, empleados] = await Promise.all([
    getInsumos(),
    puedeRegistrar ? getEmpleados() : Promise.resolve([]),
  ]);

  const insumosActivos = insumos.filter((insumo) => insumo.activo);
  const empleadosOpciones = empleados
    .filter((empleado) => empleado.activo)
    .map((empleado) => ({
      id: String(empleado.id),
      nombre: empleado.nombre,
      apellido: empleado.apellido,
    }));

  return (
    <div className="container mx-auto py-2">
      <HeaderComponent
        Icon={ShoppingBasket}
        description="En este apartado podrá administrar los insumos, su stock y las entradas y salidas."
        screenName="Insumos"
      />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {puedeRegistrar && (
          <>
            <MovimientoDialog
              tipo="ENTRADA"
              insumos={insumosActivos}
              empleados={empleadosOpciones}
            />
            <MovimientoDialog
              tipo="SALIDA"
              insumos={insumosActivos}
              empleados={empleadosOpciones}
            />
          </>
        )}
        {permisos.includes("ver_movimientos_insumo") && (
          <Button variant="outline" asChild>
            <Link href="/inventario/insumos/movimientos" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Ver movimientos
            </Link>
          </Button>
        )}
        {(permisos.includes("ver_reportes_insumo") ||
          permisos.includes("ver_movimientos_insumo")) && (
          <Button variant="outline" asChild>
            <Link href="/inventario/insumos/reportes" className="flex items-center gap-2">
              <FileBarChart className="h-4 w-4" />
              Reportes
            </Link>
          </Button>
        )}
      </div>

      <div className="hidden md:block">
        <DataTable columns={columns} data={insumos} />
      </div>
      <div className="block md:hidden">
        <InsumoListMobile insumos={insumos} />
      </div>
    </div>
  );
}
