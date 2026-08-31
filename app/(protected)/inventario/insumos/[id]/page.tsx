import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, ArrowLeft, Package } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getEmpleados } from "../../../empleados/actions";
import { getCiudades, getInsumoById, getMovimientosByInsumo } from "../actions";
import CiudadFiltro from "../components/ciudad-filtro";
import MovimientoDialog from "../components/movimiento-dialog";
import MovimientosList from "../components/movimientos-list";

export default async function InsumoDetalle({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { ciudadId?: string };
}) {
  const permisos = await getSessionPermisos();

  if (!permisos?.includes("ver_insumos")) {
    return <NoAcceso />;
  }

  const puedeRegistrar = permisos.includes("crear_movimiento_insumo");
  const ciudadId = searchParams.ciudadId;

  const [insumo, movimientos, ciudades, empleados] = await Promise.all([
    getInsumoById(params.id, ciudadId),
    getMovimientosByInsumo(params.id, ciudadId),
    getCiudades(),
    puedeRegistrar ? getEmpleados() : Promise.resolve([]),
  ]);

  if (!insumo) {
    redirect("/inventario/insumos");
  }

  const empleadosOpciones = empleados
    .filter((empleado) => empleado.activo)
    .map((empleado) => ({
      id: String(empleado.id),
      nombre: empleado.nombre,
      apellido: empleado.apellido,
    }));

  const existenciasVisibles = ciudadId
    ? insumo.existencias.filter((e) => e.ciudadId === ciudadId)
    : insumo.existencias;

  return (
    <div className="container mx-auto py-2">
      <HeaderComponent
        Icon={Package}
        description="Detalle del insumo, existencias por ciudad e historial de entradas y salidas."
        screenName={insumo.nombre}
      />

      <div className="mb-4 space-y-3">
        <CiudadFiltro
          ciudades={ciudades}
          ciudadId={ciudadId}
          basePath={`/inventario/insumos/${insumo.id}`}
        />

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button variant="outline" asChild>
            <Link href="/inventario/insumos" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Link>
          </Button>
          {puedeRegistrar && (
            <>
              <MovimientoDialog
                tipo="ENTRADA"
                insumos={[insumo]}
                ciudades={ciudades}
                empleados={empleadosOpciones}
                insumoFijoId={insumo.id}
                ciudadInicialId={ciudadId}
              />
              <MovimientoDialog
                tipo="SALIDA"
                insumos={[insumo]}
                ciudades={ciudades}
                empleados={empleadosOpciones}
                insumoFijoId={insumo.id}
                ciudadInicialId={ciudadId}
              />
            </>
          )}
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {existenciasVisibles.map((existencia) => (
          <Card key={existencia.ciudadId}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {existencia.ciudadNombre}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{existencia.stockActual}</span>
                <span className="text-sm text-muted-foreground">{insumo.unidadNombre}</span>
              </div>
              {existencia.equivalenciaStock && (
                <p className="mt-1 text-sm text-muted-foreground">
                  ≈ {existencia.equivalenciaStock}
                </p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                Mínimo: {existencia.stockMinimo}
              </p>
              {existencia.bajoStock && (
                <Badge variant="destructive" className="mt-2 flex w-fit items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Bajo stock
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unidad de consumo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-lg font-semibold">{insumo.unidadNombre}</span>
            {insumo.contenidoLabel && (
              <p className="mt-1 text-sm text-muted-foreground">{insumo.contenidoLabel}</p>
            )}
            {insumo.descripcion && (
              <p className="mt-1 text-sm text-muted-foreground">{insumo.descripcion}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <MovimientosList
        movimientos={movimientos}
        mostrarInsumo={false}
        puedeCancelar={puedeRegistrar}
      />
    </div>
  );
}
