import { getSession, getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { PlusCircle } from "lucide-react";
import { NotaFormulario } from "../components/Form";

export default async function Create() {
  const session = await getSession();
  const permisos = await getSessionPermisos();

  // Redirige si no hay sesión
  if (!session) {
    return <NoAcceso />;
  }

  // Verifica permisos para crear notas
  if (!permisos?.includes("crear_notas")) {
    return <NoAcceso />;
  }

  // Datos iniciales para crear una nueva nota
  const initialData = {
    id: "",
    titulo: "",
    descripcion: "",
    estado: "PENDIENTE" as const,
    creadorEmpleadoId: session?.IdEmpleado || "",
    asignadoEmpleadoId: null,
    aprobadorEmpleadoId: null,
  };


  return (
    <div>
      <HeaderComponent
        Icon={PlusCircle}
        description="En este apartado podrá crear una nota."
        screenName="Crear Nota"
      />
      <NotaFormulario
        permiso="" // No se requiere permiso extra al crear
        isUpdate={false} // Indicamos que es creación
        initialData={initialData}
        currentUserEmpleadoId={session?.IdEmpleado || ""} // Pasamos el IdEmpleado del usuario actual
      />

    </div>
  );
}
