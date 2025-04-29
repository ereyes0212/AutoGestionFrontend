
import HeaderComponent from "@/components/HeaderComponent";
import { Pencil } from "lucide-react";
import {  getSessionPermisos } from "@/auth";
import { redirect } from "next/navigation";
import { EmpleadoFormulario } from "../../components/Form";
import { getEmpleadoId, getEmpleados } from "../../actions";
import NoAcceso from "@/components/noAccess";
import { getPuestosActivas } from "@/app/(protected)/puestos/actions";

export default async function Edit({ params }: { params: { id: string } }) {
  // Verificar si hay una sesión activa

  const permisos = await getSessionPermisos();
  if (!permisos?.includes("editar_empleado")) {
    return <NoAcceso />;
  }
  const puestos = await getPuestosActivas()
  const empleados = await getEmpleados()


  // Obtener el cliente por su ID
  const empleado = await getEmpleadoId(params.id);
  if (!empleado) {
    redirect("/empleados"); // Redirige si no se encuentra el cliente
  }
  const initialData = {
    id: empleado.id,
    nombre: empleado.nombre,
    apellido: empleado.apellido,
    correo: empleado.correo,
    genero: empleado.genero, // Valor por defecto
    activo: empleado.activo,
    fechaNacimiento: new Date(empleado.fechaNacimiento), 
    nombreUsuario: empleado.usuario,
    jefe_id: empleado.jefe_id || "", 
    puesto_id: empleado.puesto_id || ""
  };

  return (
    <div>
      <HeaderComponent
        Icon={Pencil}
        description="En este apartado podrá editar un empleado"
        screenName="Editar Empleado"
      />
      <EmpleadoFormulario
        puestos={puestos || []} 
        jefe={empleados}
        isUpdate={true} // Esto es para indicar que estamos creando, no actualizando
        initialData={initialData} // Datos iniciales para crear un nuevo empleado
      />
      
    </div>
  );
}
