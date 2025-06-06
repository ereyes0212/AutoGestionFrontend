import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { PlusCircle } from "lucide-react";
import { CategoriaActivoFormulario } from "../components/Form";

export default async function Create() {

  const permisos = await getSessionPermisos();
  // Redirige si no hay sesión

  // Verifica permisos para crear empleados
  if (!permisos?.includes("crear_categoria_activo")) {
    return <NoAcceso />;
  }

  // Inicializamos con un valor específico para puesto
  const initialData = {
    nombre: "",
    descripcion: "",
    id: "",
    activo: true,
  };

  return (
    <div>
      <HeaderComponent
        Icon={PlusCircle}
        description="En este apartado podrá crear una nueva Categoria de activo."
        screenName="Crear Categoria Activo"  // Cambié la pantalla a "Crear Empleado"
      />
      <CategoriaActivoFormulario
        isUpdate={false}  // Esto es para indicar que estamos creando, no actualizando
        initialData={initialData}  // Datos iniciales para crear un nuevo empleado
      />
    </div>
  );
}
