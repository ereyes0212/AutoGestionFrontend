import { getSession, getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { PlusCircle } from "lucide-react";
import { redirect } from "next/navigation";
import { EmpleadoFormulario } from "../components/Form"; // Asegúrate de que el formulario sea para Empleados

export default async function Create() {
  const permisos = await getSessionPermisos();
  const sesion = await getSession();

  // Redirige si no hay sesión
  if (!sesion) {
    redirect("/login");
  }

  // Verifica permisos para crear empleados
  if (!permisos?.includes("crear_solicitudes")) {
    return <NoAcceso />;
  }



  const initialData: {
    id: string;
    fechaInicio: Date;
    fechaFin: Date;
    descripcion: string;
    tipoSolicitud: "VACACION" | "DIACOMPENSATORIO" | "MIXTO";
  } = {
    id: "",
    fechaInicio: new Date(),
    fechaFin: new Date(),
    descripcion: "",
    tipoSolicitud: "VACACION"
  };

  return (
    <div>
      <HeaderComponent
        Icon={PlusCircle}
        description="En ese modulo podrá crear solicitudes de vacaciones."
        screenName="Crear Solicitud de vacaciones" // Cambié la pantalla a "Crear Empleado"
      />
      <EmpleadoFormulario
        isUpdate={false} // Esto es para indicar que estamos creando, no actualizando
        initialData={initialData} // Datos iniciales para crear un nuevo empleado
      />
    </div>
  );
}
