import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { PlusCircle } from "lucide-react";
import { getNotasEmpleadoActual } from "../actions";
import FormEventoFactura from "../components/FormEventoFactura";

export default async function CreateFacturaPage() {
  const permisos = await getSessionPermisos();
  if (!permisos?.includes("crear_facturas")) {
    return <NoAcceso />;
  }

  const notas = await getNotasEmpleadoActual();

  return (
    <div className="container mx-auto py-2 space-y-4">
      <HeaderComponent
        Icon={PlusCircle}
        screenName="Crear evento de factura"
        description="Registra un nuevo evento y adjunta las facturas en imagen o PDF."
      />
      <FormEventoFactura notas={notas} isUpdate={false} />
    </div>
  );
}
