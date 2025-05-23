import HeaderComponent from "@/components/HeaderComponent";
import { PlusCircle } from "lucide-react";
import { getSession, getSessionPermisos } from "@/auth";
import { redirect } from "next/navigation";
import { EmpleadoFormulario } from "../components/Form"; // Asegúrate de que el formulario sea para Empleados
import NoAcceso from "@/components/noAccess";
import { getEmpleados } from "../actions";
import {getPuestosActivas } from "../../puestos/actions";

export default async function Create() {
  const permisos = await getSessionPermisos();
  const sesion = await getSession();

  // Redirige si no hay sesión
  if (!sesion) {
    redirect("/login");
  }

  // Verifica permisos para crear empleados
  if (!permisos?.includes("crear_empleados")) {
    return <NoAcceso />;
  }


  // Determina qué lista de puestos cargar según el rol del usuario
  const puestos = await getPuestosActivas()
  const empleados =  await getEmpleados()


  const initialData = {
    nombre: "",
    apellido: "",
    correo: "",
    activo: true,
    nombreUsuario: "",
    genero: "", // Adding the 'genero' property
    fechaNacimiento: new Date(), // Adding the 'fechaNacimiento' property with the current date
    jefe_id:"",
    puesto_id:"",
  };

  return (
    <div>
      <HeaderComponent
        Icon={PlusCircle}
        description="En este apartado podrá crear un nuevo empleado."
        screenName="Crear Empleado" // Cambié la pantalla a "Crear Empleado"
      />
      <EmpleadoFormulario
        puestos={puestos || []} 
        jefe={empleados}
        isUpdate={false} // Esto es para indicar que estamos creando, no actualizando
        initialData={initialData} // Datos iniciales para crear un nuevo empleado
      />
    </div>
  );
}
