import HeaderComponent from "@/components/HeaderComponent";
import { PlusCircle } from "lucide-react";
import { getSession, getSessionPermisos } from "@/auth";
import { redirect } from "next/navigation";
import { FormularioRol } from "../components/Formulario"; // Asegúrate de que el formulario sea para Empleados
import NoAcceso from "@/components/noAccess";
import { getPermisosActivos } from "../../permisos/actions";

export default async function Create() {

  
  // Redirige si no hay sesión
  
  // Verifica permisos para crear empleados
  const permisos = await getSessionPermisos();
  if (!permisos?.includes("crear_roles")) {
    return <NoAcceso />;
  }
  
  const permisosData = await getPermisosActivos();
  // Inicializamos con un valor específico para genero
  const initialData = {
    nombre: "",
    descripcion: "",
    activo: true,
    permisosRol: []  // Cambié "permisoRol" a "permisosRol"
  };
  

  return (
    <div>
      <HeaderComponent
        Icon={PlusCircle}
        description="En este apartado podrá crear un rol y asignarle permisos."
        screenName="Crear Rol" // Cambié la pantalla a "Crear Empleado"
      />
      <FormularioRol
        isUpdate={false} // Esto es para indicar que estamos creando, no actualizando
        initialData={initialData} // Datos iniciales para crear un nuevo empleado
        permisos={permisosData}
      />
    </div>
  );
}
