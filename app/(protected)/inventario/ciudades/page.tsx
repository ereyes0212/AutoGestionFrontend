import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Pencil, Plus } from "lucide-react";
import Link from "next/link";
import { getCiudadesAdmin } from "./actions";

export default async function CiudadesPage() {
  const permisos = await getSessionPermisos();

  if (!permisos?.includes("ver_ciudades")) {
    return <NoAcceso />;
  }

  const ciudades = await getCiudadesAdmin();

  return (
    <div className="container mx-auto py-2">
      <HeaderComponent
        Icon={Building2}
        description="Bodegas donde se lleva inventario de insumos."
        screenName="Ciudades"
      />

      {permisos.includes("crear_ciudades") && (
        <div className="mb-4">
          <Button asChild>
            <Link href="/inventario/ciudades/create" className="flex items-center gap-2">
              Nueva ciudad
              <Plus className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      )}

      <div className="space-y-3">
        {ciudades.map((ciudad) => (
          <div
            key={ciudad.id}
            className="flex items-center justify-between rounded-lg border p-4 shadow-sm"
          >
            <div>
              <h3 className="text-base font-semibold">{ciudad.nombre}</h3>
              <Badge variant={ciudad.activo ? "default" : "destructive"}>
                {ciudad.activo ? "Activo" : "Inactivo"}
              </Badge>
            </div>
            {permisos.includes("crear_ciudades") && (
              <Button variant="ghost" size="icon" asChild>
                <Link href={`/inventario/ciudades/${ciudad.id}/edit`}>
                  <Pencil className="h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        ))}
        {ciudades.length === 0 && (
          <p className="text-center text-gray-500">No hay ciudades registradas.</p>
        )}
      </div>
    </div>
  );
}
