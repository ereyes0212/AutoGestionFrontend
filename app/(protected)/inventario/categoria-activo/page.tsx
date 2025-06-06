import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { List } from "lucide-react";
import { getCategoriaActivo } from "./actions";
import { columns } from "./components/columns";
import { DataTable } from "./components/data-table";
import CategoriaActivoListMobile from "./components/tipoSeccion-list-mobile";

export default async function TipoSeccion() {

  const permisos = await getSessionPermisos();


  const data = await getCategoriaActivo();
  if (!permisos?.includes("ver_categoria_activo")) {
    return <NoAcceso />;
  }

  return (
    <div className="container mx-auto py-2">
      <HeaderComponent
        Icon={List}
        description="En este apartado podrá ver todas las diferentes categorias de activos."
        screenName="Categoria de activos"
      />

      <div className="hidden md:block">
        <DataTable columns={columns} data={data} />
      </div>
      <div className="block md:hidden">
        <CategoriaActivoListMobile categoriaActivo={data} />
      </div>
    </div>
  );
}
