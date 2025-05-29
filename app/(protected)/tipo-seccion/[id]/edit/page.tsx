
import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { Pencil } from "lucide-react";
import { redirect } from "next/navigation";
import { getTipoSeccionById } from "../../actions";
import { TipoSeccionFormulario } from "../../components/Form";

export default async function Edit({ params }: { params: { id: string } }) {
  // Verificar si hay una sesión activa

  const permisos = await getSessionPermisos();

  if (!permisos?.includes("editar_tipo_seccion")) {
    return <NoAcceso />;
  }

  // Obtener el cliente por su ID
  const tipoSeccion = await getTipoSeccionById(params.id);
  if (!tipoSeccion) {
    redirect("/tipo-seccion"); // Redirige si no se encuentra el cliente
  }
  const puestoCreate = {
    id: tipoSeccion.id,
    nombre: tipoSeccion.nombre,
    activo: tipoSeccion.activo,
    descripcion: tipoSeccion.descripcion
  };


  return (
    <div>
      <HeaderComponent
        Icon={Pencil}
        description="En este apartado podrá editar un puesto."
        screenName="Editar Puesto"
      />
      <TipoSeccionFormulario
        isUpdate={true}
        initialData={puestoCreate} // Pasamos los datos del cliente al formulario
      />
    </div>
  );
}
