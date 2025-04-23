
import HeaderComponent from "@/components/HeaderComponent";
import { File, Pencil } from "lucide-react";
import { getSession, getSessionPermisos } from "@/auth";
import { redirect } from "next/navigation";
import { EmpleadoFormulario } from "../../components/Form";
import {  getSolicitudesById } from "../../actions";
import NoAcceso from "@/components/noAccess";
import {  getPuestosActivas } from "@/app/(protected)/puestos/actions";
import SolicitudPermisoCard from "../../components/solicitudpermiso";

export default async function Detalle({ params }: { params: { id: string } }) {
  // Verificar si hay una sesión activa

  const permisos = await getSessionPermisos();
  const sesion = await getSession();
  if (!permisos?.includes("editar_empleado")) {
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
