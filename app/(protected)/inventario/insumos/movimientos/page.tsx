import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { Button } from "@/components/ui/button";
import { ArrowLeft, History } from "lucide-react";
import Link from "next/link";
import { getMovimientos } from "../actions";
import MovimientosList from "../components/movimientos-list";

export default async function MovimientosInsumoPage({
  searchParams,
}: {
  searchParams: { insumoId?: string; tipo?: string; desde?: string; hasta?: string };
}) {
  const permisos = await getSessionPermisos();

  if (!permisos?.includes("ver_movimientos_insumo")) {
    return <NoAcceso />;
  }

  const tipo =
    searchParams.tipo === "ENTRADA" || searchParams.tipo === "SALIDA"
      ? searchParams.tipo
      : undefined;

  const movimientos = await getMovimientos({
    insumoId: searchParams.insumoId,
    tipo,
    desde: searchParams.desde,
    hasta: searchParams.hasta,
  });

  return (
    <div className="container mx-auto py-2">
      <HeaderComponent
        Icon={History}
        description="Historial de entradas y salidas de insumos con su firma de respaldo."
        screenName="Movimientos de insumos"
      />

      <div className="mb-4">
        <Button variant="outline" asChild>
          <Link href="/inventario/insumos" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver a insumos
          </Link>
        </Button>
      </div>

      <MovimientosList movimientos={movimientos} />
    </div>
  );
}
