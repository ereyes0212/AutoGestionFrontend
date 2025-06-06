
import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { Pencil } from "lucide-react";
import { redirect } from "next/navigation";
import { getEstadoActivoById } from "../../actions";
import { EstadoActivoFormulario } from "../../components/Form";

export default async function Edit({ params }: { params: { id: string } }) {
  // Verificar si hay una sesión activa

  const permisos = await getSessionPermisos();

  if (!permisos?.includes("editar_estados_activo")) {
    return <NoAcceso />;
  }

  // Obtener el cliente por su ID
  const categoriaActivo = await getEstadoActivoById(params.id);
  if (!categoriaActivo) {
    redirect("/inventario/estados-activos"); // Redirige si no se encuentra el cliente
  }
  const categoriaActivoCreate = {
    id: categoriaActivo.id,
    nombre: categoriaActivo.nombre,
    descripcion: categoriaActivo.descripcion
  };


  return (
    <div>
      <HeaderComponent
        Icon={Pencil}
        description="En este apartado podrá editar un estado de activos."
        screenName="Editar estado activo" // Cambié la pantalla a "Editar Categoria Activo"
      />
      <EstadoActivoFormulario
        isUpdate={true}
        initialData={categoriaActivoCreate} // Pasamos los datos del cliente al formulario
      />
    </div>
  );
}
