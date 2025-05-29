import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { PlusCircle } from "lucide-react";
import { getEmpleadosSinUsuario } from "../../empleados/actions";
import { getRolesPermisosActivos } from "../../roles/actions";
import { Formulario } from "../components/Form";

export default async function Create() {



  const permisos = await getSessionPermisos();
  if (!permisos?.includes("crear_usuario")) {
    return <NoAcceso />;
  }

  const initialData = {
    usuario: "",
    contrasena: "",
    empleado_id: "",
    rol_id: "",
    activo: true,
  };
  const empleados = await getEmpleadosSinUsuario();
  const roles = await getRolesPermisosActivos();

  return (
    <div>
      <HeaderComponent
        Icon={PlusCircle}
        description="En este apartado podrás crear un nuevo usuario"
        screenName="Usuarios"
      />
      <Formulario isUpdate={false} initialData={initialData} empleados={empleados} roles={roles} />
    </div>
  );
}
