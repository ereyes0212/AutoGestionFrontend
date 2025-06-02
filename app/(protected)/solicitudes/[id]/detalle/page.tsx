
import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { File } from "lucide-react";
import { getSolicitudesById } from "../../actions";
import SolicitudPermisoCard from "../../components/solicitudpermiso";

export default async function Detalle({ params }: { params: { id: string } }) {
  // Verificar si hay una sesión activa

  const permisos = await getSessionPermisos();
  if (!permisos?.includes("ver_detalles_solicitudes")) {
    return <NoAcceso />;
  }
  const solicitud = await getSolicitudesById(params.id);

  return (
    <div>
      <HeaderComponent
        Icon={File}
        description="En este apartado podrá ver el detalle de una solicitud"
        screenName="Detalle Solicitud"
      />
      {solicitud ? (
        <SolicitudPermisoCard solicitud={solicitud} />
      ) : (
        <p>La solicitud no existe.</p>
      )}
    </div>
  );
}
