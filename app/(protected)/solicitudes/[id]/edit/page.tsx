
import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { Pencil } from "lucide-react";
import { redirect } from "next/navigation";
import { getSolicitudesById } from "../../actions";
import { EmpleadoFormulario } from "../../components/Form";

export default async function Edit({ params }: { params: { id: string } }) {
    // Verificar si hay una sesión activa

    const permisos = await getSessionPermisos();

    if (!permisos?.includes("ver_solicitudes")) {
        return <NoAcceso />;
    }

    // Obtener el cliente por su ID
    const solicitud = await getSolicitudesById(params.id);
    if (!solicitud) {
        redirect("/puestos"); // Redirige si no se encuentra el cliente
    }
    const solicitudEdit = {
        id: solicitud.id,
        fechaInicio: new Date(solicitud.fechaInicio),
        fechaFin: new Date(solicitud.fechaFin),
        descripcion: solicitud.descripcion
    };


    return (
        <div>
            <HeaderComponent
                Icon={Pencil}
                description="En este apartado podrá editar un puesto."
                screenName="Editar Puesto"
            />
            <EmpleadoFormulario
                isUpdate={true}
                initialData={solicitudEdit} // Pasamos los datos del cliente al formulario
            />
        </div>
    );
}
