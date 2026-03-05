import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ArchivosPreviewGrid from "../../components/ArchivosPreviewGrid";
import { Pencil, ReceiptText } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";
import { getEventoFacturaById } from "../../actions";

export default async function DetalleEventoFacturaPage({
  params,
}: {
  params: { id: string };
}) {
  const permisos = await getSessionPermisos();
  if (!permisos?.includes("ver_facturas") && !permisos?.includes("ver_facturas_jefe")) {
    return <NoAcceso />;
  }

  const evento = await getEventoFacturaById(params.id);
  if (!evento) {
    redirect("/facturas");
  }

  return (
    <div className="container mx-auto py-2 space-y-4">
      <HeaderComponent
        Icon={ReceiptText}
        screenName="Detalle de evento de factura"
        description="Visualiza toda la información del evento y sus archivos adjuntos."
      />

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-2">
          <CardTitle>{evento.titulo}</CardTitle>
          <Link href={`/facturas/${evento.id}/editar`}>
            <Button variant="outline" size="sm">
              <Pencil className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><strong>Empleado:</strong> {evento.empleadoNombre}</p>
          <p><strong>Fecha:</strong> {evento.fechaEventoLabel}</p>
          <p><strong>Nota vinculada:</strong> {evento.notaTitulo ?? "Sin nota"}</p>
          <p><strong>Descripción:</strong> {evento.descripcion || "Sin descripción"}</p>
          <p><strong>Total facturas:</strong> {evento.totalFacturas}</p>
        </CardContent>
      </Card>

      <ArchivosPreviewGrid archivos={evento.archivos} />
    </div>
  );
}
