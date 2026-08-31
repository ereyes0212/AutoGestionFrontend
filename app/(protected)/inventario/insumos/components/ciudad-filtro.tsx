import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Ciudad } from "../types";

interface CiudadFiltroProps {
  ciudades: Ciudad[];
  /** Ciudad activa; sin valor, se muestran todas las bodegas consolidadas */
  ciudadId?: string;
  /** Ruta sobre la que se arma el enlace, por ejemplo /inventario/insumos */
  basePath: string;
}

/**
 * Filtro de bodega. Son enlaces con query param para que la página siga
 * siendo un server component.
 */
export default function CiudadFiltro({ ciudades, ciudadId, basePath }: CiudadFiltroProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">Ciudad:</span>
      <Button variant={!ciudadId ? "default" : "outline"} size="sm" asChild>
        <Link href={basePath}>Todas</Link>
      </Button>
      {ciudades.map((ciudad) => (
        <Button
          key={ciudad.id}
          variant={ciudadId === ciudad.id ? "default" : "outline"}
          size="sm"
          asChild
        >
          <Link href={`${basePath}?ciudadId=${ciudad.id}`}>{ciudad.nombre}</Link>
        </Button>
      ))}
    </div>
  );
}
