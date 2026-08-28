import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { PlusCircle } from "lucide-react";
import { getUnidadesInsumoActivas } from "../../unidad-insumo/actions";
import { InsumoFormulario } from "../components/Form";

export default async function Create() {
  const permisos = await getSessionPermisos();

  if (!permisos?.includes("crear_insumos")) {
    return <NoAcceso />;
  }

  const unidades = await getUnidadesInsumoActivas();

  const initialData = {
    id: "",
    nombre: "",
    descripcion: "",
    unidadId: "",
    unidadEmpaqueId: "",
    cantidadPorEmpaque: 1,
    stockMinimo: 0,
    stockInicial: 0,
    stockInicialEnEmpaques: false,
    activo: true,
  };

  return (
    <div>
      <HeaderComponent
        Icon={PlusCircle}
        description="En este apartado podrá crear un nuevo insumo."
        screenName="Crear Insumo"
      />
      {unidades.length === 0 ? (
        <p className="rounded-md border p-4 text-sm text-muted-foreground">
          Primero debe crear al menos una unidad de medida en Inventario / Unidades de medida.
        </p>
      ) : (
        <InsumoFormulario isUpdate={false} initialData={initialData} unidades={unidades} />
      )}
    </div>
  );
}
