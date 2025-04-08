
import HeaderComponent from "@/components/HeaderComponent";
import { Pencil } from "lucide-react";
import { getSession, getSessionPermisos } from "@/auth";
import { redirect } from "next/navigation";
import { EmpleadoFormulario } from "../../components/Form";
import { getEmpleadoId } from "../../actions";
import NoAcceso from "@/components/noAccess";

export default async function Edit({ params }: { params: { id: string } }) {
  // Verificar si hay una sesión activa

  const permisos = await getSessionPermisos();

  if (!permisos?.includes("editar_empleado")) {
    return <NoAcceso />;
  }

  // Obtener el cliente por su ID
  const empleado = await getEmpleadoId(params.id);
  if (!empleado) {
    redirect("/empleados"); // Redirige si no se encuentra el cliente
  }


  return (
    <div>
      <HeaderComponent
        Icon={Pencil}
        description="En este apartado podrá editar un empleado"
        screenName="Editar Empleado"
      />
      <EmpleadoFormulario
        isUpdate={true}
        initialData={empleado} // Pasamos los datos del cliente al formulario
      />
    </div>
  );
}
