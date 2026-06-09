import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { File, Inbox } from "lucide-react";
import { getEmpleados } from "../../empleados/actions";
import { getAllSolicitudesForRH, isCurrentUserGerenteRH } from "../actions";
import SolicitudesRH from "../components/solicitudes-rh";

export default async function SolicitudesRHPage() {
    const permisos = await getSessionPermisos();
    const esGerenteRH = await isCurrentUserGerenteRH();

    if (!permisos?.includes("ver_solicitudes") || !esGerenteRH) {
        return <NoAcceso />;
    }

    const solicitudes = await getAllSolicitudesForRH();
    const empleados = await getEmpleados();

    return (
        <div className="container mx-auto py-2 relative">
            <HeaderComponent
                Icon={File}
                description="Consulte e imprima las solicitudes de permiso de todos los empleados"
                screenName="Solicitudes — Recursos Humanos"
            />

            {solicitudes.length > 0 ? (
                <SolicitudesRH solicitudes={solicitudes} empleados={empleados} />
            ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center text-gray-500">
                    <Inbox className="w-16 h-16 mb-4" />
                    <p className="text-lg font-semibold">No hay solicitudes registradas</p>
                </div>
            )}
        </div>
    );
}
