import { getSession, getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { Calendar } from "lucide-react";
import { getEmpleados } from "../empleados/actions";
import { getTareasByEmpleado } from "./actions";
import CalendarWithSheet from "./components/calendar";


export default async function CalendarioPage() {
    // Trae tus tareas desde la DB aquí en el Server Component
    // IMPORTANTE: al serializar, Date -> string. El componente cliente se normaliza.
    const sesion = await getSession();
    const tareas = await getTareasByEmpleado(sesion!.IdEmpleado)
    const empleados = await getEmpleados();
    const empleadosfiltrados = empleados.map(e => ({ id: e.id!, nombre: e.nombre }));

    const permisos = await getSessionPermisos();
    if (!permisos?.includes("ver_tareas")) return <NoAcceso />;

    return (
        <div className="p-4">
            <HeaderComponent
                Icon={Calendar}
                description="En este apartado podrá ver todas las tareas asignadas."
                screenName="Tareas"
            />
            <div className="border rounded-lg p-4 mt-4">

                <CalendarWithSheet idEmpleado={sesion?.IdEmpleado!} empleados={empleadosfiltrados} tareas={tareas} />
            </div>
        </div>
    );
}