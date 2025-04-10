// /pages/usuarios/[id]/editar/page.tsx
import { redirect } from "next/navigation";
import { Formulario } from "../../components/Form";
import { getUsuarioById } from "../../actions";
import { Pencil } from "lucide-react";
import NoAcceso from "@/components/noAccess";
import { getSession, getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import {
  getEmpleadoId,
  getEmpleados,
  getEmpleadosSinUsuario,
} from "@/app/(protected)/empleados/actions";
import { getRolsActivos } from "@/app/(protected)/roles/actions";
import { getEmpresasActivas } from "@/app/(protected)/empresas/actions";

export default async function Edit({ params }: { params: { id: string } }) {



  const permisos = await getSessionPermisos();
  if (!permisos?.includes("editar_usuario")) {

    return <NoAcceso />;
  }

  const usuario = await getUsuarioById(params.id);
  const empleados = await getEmpleadosSinUsuario();
  const roles = await getRolsActivos();
  const empresas = await getEmpresasActivas();
  const empleadoAsignado = await getEmpleadoId(usuario?.empleado_id ?? "");


  if (!usuario) {
    redirect("/usuarios");
  }
  const initialData = {
    id : usuario.id,
    usuario: usuario.usuario ?? "",
    contrasena: "",
    empleado_id: usuario.empleado_id ?? "",
    rol_id: usuario.rol_id,
    activo: usuario.activo,
    empresa_id: usuario.empresa_id

  };

  return (
    <div>
      <HeaderComponent
        Icon={Pencil}
        description="En este apartado podrás editar un usuario"
        screenName="Editar Usuario"
      />
      <Formulario
        empresas={empresas}
        isUpdate={true}
        initialData={initialData}
        empleados={empleados}
        roles={roles}
        empleadoAsignado={empleadoAsignado}
      />
    </div>
  );
}
