import HeaderComponent from "@/components/HeaderComponent";
import { PlusCircle } from "lucide-react";
import { getSession, getSessionPermisos } from "@/auth";
import { redirect } from "next/navigation";
import { PuestoFormulario } from "../components/Form";  // Asegúrate de que el formulario sea para Empleados
import NoAcceso from "@/components/noAccess";
import { getEmpresasActivas } from "../../empresas/actions";

export default async function Create() {

  const permisos = await getSessionPermisos();
  const empresas = await getEmpresasActivas(); // Obtener empresas activas
  // Redirige si no hay sesión

  // Verifica permisos para crear empleados
  if (!permisos?.includes("crear_puestos")) {
    return <NoAcceso />;
  }

  // Inicializamos con un valor específico para puesto
  const initialData = {
    nombre: "",
    descripcion: "",
    id: "",
    activo: true,
    empresa_id: "",
    puesto: ""
  };

  return (
    <div>
      <HeaderComponent
        Icon={PlusCircle}
        description="En este apartado podrá crear un puesto."
        screenName="Crear Puesto"  // Cambié la pantalla a "Crear Empleado"
      />
      <PuestoFormulario
        empresas={empresas}
        isUpdate={false}  // Esto es para indicar que estamos creando, no actualizando
        initialData={initialData}  // Datos iniciales para crear un nuevo empleado
      />
    </div>
  );
}
