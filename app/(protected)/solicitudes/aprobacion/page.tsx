import { File, Inbox } from "lucide-react";
import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import SolicitudAprobaciones from "../components/aprobaciones";
import { getSolicitudesAprobaciones } from "../actions";

export default async function Empleados() {
    const permisos = await getSessionPermisos();

    if (!permisos?.includes("ver_empleados")) {
        return <NoAcceso />;
    }

    const aprobacionesPendientes = await getSolicitudesAprobaciones();

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
                <div className="flex flex-col items-center justify-center h-64 text-center text-gray-500">
                    <Inbox className="w-16 h-16 mb-4" />
                    <p className="text-lg font-semibold">No hay solicitudes pendientes</p>
                </div>
            )}
        </div>
    );
}
