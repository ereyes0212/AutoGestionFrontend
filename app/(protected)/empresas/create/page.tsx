import HeaderComponent from "@/components/HeaderComponent";
import { PlusCircle } from "lucide-react";
import { getSession, getSessionPermisos } from "@/auth";
import { redirect } from "next/navigation";
import { EmpresaFormulario } from "../components/Form";  // Asegúrate de que el formulario sea para Empleados
import NoAcceso from "@/components/noAccess";

export default async function Create() {

  const permisos = await getSessionPermisos();

  // Redirige si no hay sesión

  // Verifica permisos para crear empleados
  if (!permisos?.includes("crear_empleados")) {
    return <NoAcceso />;
  }

  // Inicializamos con un valor específico para genero
  const initialData = {
    nombre: "",
    apellido: "",
    correo: "",
    genero: "Masculino",  // Valor por defecto
    activo: true,
    edad: 18,  // Asumiendo que es un campo requerido para la creación de un empleado
    nombreUsuario: "",
  };

  return (
    <div>
      <HeaderComponent
        Icon={PlusCircle}
        description="En este apartado podrá crear una empresa."
        screenName="Crear empresa"  // Cambié la pantalla a "Crear Empleado"
      />
      <EmpresaFormulario
        isUpdate={false}  // Esto es para indicar que estamos creando, no actualizando
        initialData={initialData}  // Datos iniciales para crear un nuevo empleado
      />
    </div>
  );
}
