
import HeaderComponent from "@/components/HeaderComponent";
import { Pencil } from "lucide-react";
import {  getSessionPermisos } from "@/auth";
import { redirect } from "next/navigation";
import { PuestoFormulario } from "../../components/Form";
import { getPuestoId } from "../../actions";
import NoAcceso from "@/components/noAccess";

export default async function Edit({ params }: { params: { id: string } }) {
  // Verificar si hay una sesión activa

  const permisos = await getSessionPermisos();
  
  if (!permisos?.includes("editar_puestos")) {
    return <NoAcceso />;
  }
  
  // Obtener el cliente por su ID
  const puesto = await getPuestoId(params.id);
  if (!puesto) {
    redirect("/puestos"); // Redirige si no se encuentra el cliente
  }
  const puestoCreate = {
    id: puesto.id,
    nombre: puesto.nombre,
    activo: puesto.activo,
    descripcion: puesto.descripcion
  };
  

  return (
    <div>
      <HeaderComponent
        Icon={Pencil}
        description="En este apartado podrá editar un puesto."
        screenName="Editar Puesto"
      />
      <PuestoFormulario
        isUpdate={true}
        initialData={puestoCreate} // Pasamos los datos del cliente al formulario
      />
    </div>
  );
}
