import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { Ruler } from "lucide-react";
import { getUnidadesInsumo } from "./actions";
import { columns } from "./components/columns";
import { DataTable } from "./components/data-table";
import UnidadInsumoListMobile from "./components/unidad-list-mobile";

export default async function UnidadInsumoPage() {
  const permisos = await getSessionPermisos();

  if (!permisos?.includes("ver_unidad_insumo")) {
    return <NoAcceso />;
  }

  const data = await getUnidadesInsumo();

  return (
    <div className="container mx-auto py-2">
      <HeaderComponent
        Icon={Ruler}
        description="En este apartado podrá ver las unidades de medida de los insumos (caja, unidad, bote, etc.)."
        screenName="Unidades de medida"
      />

      <div className="hidden md:block">
        <DataTable columns={columns} data={data} />
      </div>
      <div className="block md:hidden">
        <UnidadInsumoListMobile unidades={data} />
      </div>
    </div>
  );
}
