// /pages/usuarios/create/page.tsx
import { redirect } from "next/navigation";
import { Formulario } from "../components/Form";
import { getSession, getSessionPermisos } from "@/auth";
import { PlusCircle } from "lucide-react";
import NoAcceso from "@/components/noAccess";
import HeaderComponent from "@/components/HeaderComponent";
import { getEmpleadosSinUsuario } from "../../empleados/actions";
import { getRolsActivos } from "../../roles/actions";
import { getEmpresasActivas } from "../../empresas/actions";

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
    empresa_id: ""
  };
  const empleados = await getEmpleadosSinUsuario();
  const empresas = await getEmpresasActivas();
  const roles = await getRolsActivos();

  return (
    <div>
      <HeaderComponent
        Icon={PlusCircle}
        description="En este apartado podrás crear un nuevo usuario"
        screenName="Usuarios"
      />
      <Formulario isUpdate={false} initialData={initialData} empleados={empleados} roles={roles} empresas={empresas} />
    </div>
  );
}
