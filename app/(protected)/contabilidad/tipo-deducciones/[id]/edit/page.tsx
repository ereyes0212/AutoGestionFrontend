
import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { Pencil } from "lucide-react";
import { redirect } from "next/navigation";
import { getTipoDeduccionById } from "../../actions";
import { TipoDeduccionFormulario } from "../../components/Form";

export default async function Edit({ params }: { params: { id: string } }) {
  // Verificar si hay una sesión activa

  const permisos = await getSessionPermisos();

  if (!permisos?.includes("editar_tipodeducciones")) {
    return <NoAcceso />;
  }

  // Obtener el cliente por su ID
  const tipoDeduccion = await getTipoDeduccionById(params.id);
  if (!tipoDeduccion) {
    redirect("/tipo-deducciones"); // Redirige si no se encuentra el cliente
  }
  const puestoCreate = {
    id: tipoDeduccion.id,
    nombre: tipoDeduccion.nombre,
    activo: tipoDeduccion.activo,
    descripcion: tipoDeduccion.descripcion
  };


  return (
    <div>
      <HeaderComponent
        Icon={Pencil}
        description="En este apartado podrá editar un puesto."
        screenName="Editar Puesto"
      />
      <TipoDeduccionFormulario
        isUpdate={true}
        initialData={puestoCreate} // Pasamos los datos del cliente al formulario
      />
    </div>
  );
}
