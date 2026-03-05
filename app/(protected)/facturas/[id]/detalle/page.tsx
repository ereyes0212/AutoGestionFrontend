import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {evento.archivos.map((archivo) => {
          const isImage = archivo.archivoTipo.startsWith("image/");
          const previewUrl = `/api/facturas/archivo/${archivo.id}`;

          return (
            <Card key={archivo.id}>
              <CardHeader>
                <CardTitle className="text-base break-all">{archivo.archivoNombre}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewUrl}
                    alt={archivo.archivoNombre}
                    className="w-full max-h-80 object-contain rounded border"
                  />
                ) : (
                  <iframe
                    src={previewUrl}
                    title={archivo.archivoNombre}
                    className="w-full h-[28rem] rounded border"
                  />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
