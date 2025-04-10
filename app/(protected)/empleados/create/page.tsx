import HeaderComponent from "@/components/HeaderComponent";
import { PlusCircle } from "lucide-react";
import { getSession, getSessionPermisos } from "@/auth";
import { redirect } from "next/navigation";
import { EmpleadoFormulario } from "../components/Form"; // Asegúrate de que el formulario sea para Empleados
import NoAcceso from "@/components/noAccess";
import { getEmpresasActivas } from "../../empresas/actions";
import { getEmpleados } from "../actions";
import { getPuestoActivosByEmpresaId, getPuestosActivas } from "../../puestos/actions";

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
  const puestos =
    sesion?.Rol === "Administrador"
      ? await getPuestosActivas()
      : await getPuestoActivosByEmpresaId();
  const empleados =
    sesion?.Rol === "Administrador"
      ? await getEmpleados()
      : await getEmpleados();

  const empresas = await getEmpresasActivas()

  const initialData = {
    nombre: "",
    apellido: "",
    correo: "",
    genero: "Masculino", // Valor por defecto
    activo: true,
    edad: 18, // Asumiendo que es un campo requerido para la creación de un empleado
    nombreUsuario: "",
    jefe_id:"",
    puesto_id:"",
    empresa_id:"",
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
        empresas={empresas}
        isUpdate={false} // Esto es para indicar que estamos creando, no actualizando
        initialData={initialData} // Datos iniciales para crear un nuevo empleado
      />
    </div>
  );
}
