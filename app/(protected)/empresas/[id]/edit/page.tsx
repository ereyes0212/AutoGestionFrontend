
import HeaderComponent from "@/components/HeaderComponent";
import { Pencil } from "lucide-react";
import { getSession, getSessionPermisos } from "@/auth";
import { redirect } from "next/navigation";
import { EmpresaFormulario } from "../../components/Form";
import { getEmpresaId } from "../../actions";
import NoAcceso from "@/components/noAccess";

export default async function Edit({ params }: { params: { id: string } }) {
  // Verificar si hay una sesión activa

  const permisos = await getSessionPermisos();

  if (!permisos?.includes("editar_empleado")) {
    return <NoAcceso />;
  }

  // Obtener el cliente por su ID
  const empresa = await getEmpresaId(params.id);
  if (!empresa) {
    redirect("/empresas"); // Redirige si no se encuentra el cliente
  }


  return (
    <div>
      <HeaderComponent
        Icon={Pencil}
        description="En este apartado podrá editar una empresa"
        screenName="Editar Empresa"
      />
      <EmpresaFormulario
        isUpdate={true}
        initialData={empresa} // Pasamos los datos del cliente al formulario
      />
    </div>
  );
}
