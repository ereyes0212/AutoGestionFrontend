import { getSession, getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { PlusCircle } from "lucide-react";
import { redirect } from "next/navigation";
import { getPuestosActivas } from "../../puestos/actions";
import { getEmpleados } from "../actions";
import { EmpleadoFormulario } from "../components/Form"; // Asegúrate de que el formulario sea para Empleados

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
  const empleados = await getEmpleados()


  const initialData = {
    id: "",
    nombre: "",
    apellido: "",
    correo: "",
    genero: "Masculino", // Valor por defecto
    activo: true, // Por defecto, el nuevo empleado está activo
    fechaNacimiento: new Date(),
    nombreUsuario: "",
    jefe_id: "", // Por defecto, no tiene jefe asignado
    puesto_id: "", // Por defecto, no tiene puesto asignado
    numeroIdentificacion: "",
    fechaIngreso: new Date(), // Fecha de ingreso por defecto es hoy
    departamentoDomicilio: "",
    ciudadDomicilio: "",
    direccionDomicilio: "",
    telefono: "",
    jefe: undefined, // Por defecto, no tiene jefe asignado
    colonia: "",
    profesion: "",
    vacaciones: 0 // Por defecto, 0 días de vacaciones
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
