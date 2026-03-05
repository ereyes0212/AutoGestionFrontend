import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { Pencil } from "lucide-react";
import { redirect } from "next/navigation";
import { getEventoFacturaById, getNotasEmpleadoActual } from "../../actions";
import FormEventoFactura from "../../components/FormEventoFactura";

export default async function EditFacturaPage({ params }: { params: { id: string } }) {
  const permisos = await getSessionPermisos();
  if (!permisos?.includes("crear_facturas")) {
    return <NoAcceso />;
  }

  const [evento, notas] = await Promise.all([getEventoFacturaById(params.id), getNotasEmpleadoActual()]);

  if (!evento) {
    redirect("/facturas");
  }

  return (
    <div className="container mx-auto py-2 space-y-4">
      <HeaderComponent
        Icon={Pencil}
        screenName="Editar evento de factura"
        description="Actualiza los datos del evento y adjunta nuevas facturas si lo necesitas."
      />
      <FormEventoFactura
        notas={notas}
        isUpdate
        eventoId={evento.id}
        initialData={{
          titulo: evento.titulo,
          descripcion: evento.descripcion,
          fechaEvento: evento.fechaEvento,
          notaId: evento.notaId,
        }}
      />
    </div>
  );
}
