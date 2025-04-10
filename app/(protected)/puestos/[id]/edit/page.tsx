
import HeaderComponent from "@/components/HeaderComponent";
import { Pencil } from "lucide-react";
import { getSession, getSessionPermisos } from "@/auth";
import { redirect } from "next/navigation";
import { PuestoFormulario } from "../../components/Form";
import { getPuestoId } from "../../actions";
import NoAcceso from "@/components/noAccess";
import { getEmpresasActivas } from "@/app/(protected)/empresas/actions";

export default async function Edit({ params }: { params: { id: string } }) {
  // Verificar si hay una sesión activa

  const permisos = await getSessionPermisos();
  
  if (!permisos?.includes("editar_puestos")) {
    return <NoAcceso />;
  }
  
  const empresas = await getEmpresasActivas();
  // Obtener el cliente por su ID
  const puesto = await getPuestoId(params.id);
  if (!puesto) {
    redirect("/puestos"); // Redirige si no se encuentra el cliente
  }
  const puestoCreate = {
    id: puesto.id,
    nombre: puesto.nombre,
    activo: puesto.activo,
    empresa_id: puesto.empresa_id,
    descripcion: puesto.descripcion,
    empresa: puesto.empresa,
  };
  

  return (
    <div>
      <HeaderComponent
        Icon={Pencil}
        description="En este apartado podrá editar un puesto."
        screenName="Editar Puesto"
      />
      <PuestoFormulario
        empresas={empresas}
        isUpdate={true}
        initialData={puestoCreate} // Pasamos los datos del cliente al formulario
      />
    </div>
  );
}
