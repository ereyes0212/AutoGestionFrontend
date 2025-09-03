import { getSession, getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { Edit3 } from "lucide-react";
import { getNotaById } from "../../actions";
import { NotaFormulario } from "../../components/Form";

interface EditPageProps {
    params: { id: string };
}

export default async function Edit({ params }: EditPageProps) {
    const { id } = params;
    const session = await getSession();
    const permisos = await getSessionPermisos();

    if (!session) return <NoAcceso />;

    // Verifica permisos para crear notas o cambiar estado
    if (!permisos?.includes("crear_notas") && !permisos?.includes("cambiar_estado_notas")) {
        return <NoAcceso />;
    }

    const nota = await getNotaById(id);

    if (!nota) return <div>Nota no encontrada o no estas asignado a esa nota</div>;

    return (
        <div>
            <HeaderComponent
                Icon={Edit3}
                description="En este apartado podrá editar una nota existente."
                screenName="Editar Nota"
            />
            <NotaFormulario
                permiso={permisos.includes("cambiar_estado_notas") ? "cambiar_estado_notas" : ""}
                isUpdate={true}
                initialData={nota}
                currentUserEmpleadoId={session?.IdEmpleado || ""} // Pasamos el IdEmpleado del usuario actual
            />
        </div>
    );
}
