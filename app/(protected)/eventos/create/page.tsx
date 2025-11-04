import { getSession, getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { PlusCircle } from "lucide-react";
import { redirect } from "next/navigation";
import { EventoForm } from "../components/Form";

export default async function Create() {
    const permisos = await getSessionPermisos();
    const sesion = await getSession();

    // Redirige si no hay sesión
    if (!sesion) {
        redirect("/login");
    }

    // Verifica permisos para crear empleados
    if (!permisos?.includes("crear_eventos")) {
        return <NoAcceso />;
    }

    const initialData = {
        titulo: "",
        descripcion: "",
        fecha: new Date(),
        ubicacion: "",
        empleadoId: "",
        facturaAdjunta: "",
        notaEnlace: "",
        monto: 0,
    };




    return (
        <div>
            <HeaderComponent
                Icon={PlusCircle}
                description="En este apartado podrá crear un nuevo empleado."
                screenName="Crear Empleado" // Cambié la pantalla a "Crear Empleado"
            />
            <EventoForm initialData={initialData} isUpdate={false} />
        </div>
    );
}
