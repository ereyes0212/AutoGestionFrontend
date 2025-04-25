import { File, Inbox } from "lucide-react";
import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import SolicitudAprobaciones from "../../components/aprobaciones";
import { getSolicitudesAprobacionesHistorico } from "../../actions";

export default async function Empleados() {
    const permisos = await getSessionPermisos();

    if (!permisos?.includes("ver_empleados")) {
        return <NoAcceso />;
    }

    const aprobacionesPendientes = await getSolicitudesAprobacionesHistorico();

    return (
        <div className="container mx-auto py-2 relative">
            <HeaderComponent
                Icon={File}
                description="En este apartado podrá ver todas las solicitudes"
                screenName="Solicitudes"
            />

            {aprobacionesPendientes.length > 0 ? (
                <SolicitudAprobaciones solicitudes={aprobacionesPendientes} />
            ) : (
                <div className="flex flex-col items-center justify-center mt-10">
                    <Inbox className="w-16 h-16 text-gray-400" />
                    <p className="text-gray-500 mt-4">No hay solicitudes disponibles.</p>
                </div>
            )}
        </div>
    );
}
