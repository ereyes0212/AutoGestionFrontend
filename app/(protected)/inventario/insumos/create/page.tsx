import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { PlusCircle } from "lucide-react";
import { getUnidadesInsumoActivas } from "../../unidad-insumo/actions";
import { getCiudades } from "../actions";
import { InsumoFormulario } from "../components/Form";

export default async function Create() {
  const permisos = await getSessionPermisos();

  if (!permisos?.includes("crear_insumos")) {
    return <NoAcceso />;
  }

  const [unidades, ciudades] = await Promise.all([getUnidadesInsumoActivas(), getCiudades()]);

  const initialData = {
    id: "",
    nombre: "",
    descripcion: "",
    unidadId: "",
    unidadEmpaqueId: "",
    cantidadPorEmpaque: 1,
    activo: true,
    existencias: ciudades.map((ciudad) => ({
      ciudadId: ciudad.id,
      ciudadNombre: ciudad.nombre,
      stockMinimo: 0,
      stockInicial: 0,
      stockInicialEnEmpaques: false,
    })),
  };

  return (
    <div>
      <HeaderComponent
        Icon={PlusCircle}
        description="En este apartado podrá crear un nuevo insumo y definir su stock por ciudad."
        screenName="Crear Insumo"
      />
      {unidades.length === 0 || ciudades.length === 0 ? (
        <p className="rounded-md border p-4 text-sm text-muted-foreground">
          {unidades.length === 0
            ? "Primero debe crear al menos una unidad de medida en Inventario / Unidades de medida."
            : "Primero debe registrar al menos una ciudad en Inventario / Ciudades."}
        </p>
      ) : (
        <InsumoFormulario isUpdate={false} initialData={initialData} unidades={unidades} />
      )}
    </div>
  );
}
