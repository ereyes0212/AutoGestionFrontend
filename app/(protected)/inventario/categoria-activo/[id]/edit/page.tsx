
import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { Pencil } from "lucide-react";
import { redirect } from "next/navigation";
import { getCategoriaActivoById } from "../../actions";
import { CategoriaActivoFormulario } from "../../components/Form";

export default async function Edit({ params }: { params: { id: string } }) {
  // Verificar si hay una sesión activa

  const permisos = await getSessionPermisos();

  if (!permisos?.includes("editar_categoria_activo")) {
    return <NoAcceso />;
  }

  // Obtener el cliente por su ID
  const categoriaActivo = await getCategoriaActivoById(params.id);
  if (!categoriaActivo) {
    redirect("/inventario/categoria-activo"); // Redirige si no se encuentra el cliente
  }
  const categoriaActivoCreate = {
    id: categoriaActivo.id,
    nombre: categoriaActivo.nombre,
    activo: categoriaActivo.activo,
    descripcion: categoriaActivo.descripcion
  };


  return (
    <div>
      <HeaderComponent
        Icon={Pencil}
        description="En este apartado podrá editar una categoria de activos."
        screenName="Editar categoria activo" // Cambié la pantalla a "Editar Categoria Activo"
      />
      <CategoriaActivoFormulario
        isUpdate={true}
        initialData={categoriaActivoCreate} // Pasamos los datos del cliente al formulario
      />
    </div>
  );
}
