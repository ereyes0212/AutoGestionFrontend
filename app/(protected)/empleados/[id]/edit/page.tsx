
import { getPuestosActivas } from "@/app/(protected)/puestos/actions";
import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { Pencil } from "lucide-react";
import { redirect } from "next/navigation";
import { getEmpleadoById, getEmpleados } from "../../actions";
import { EmpleadoFormulario } from "../../components/Form";

export default async function Edit({ params }: { params: { id: string } }) {
  // Verificar si hay una sesión activa

  const permisos = await getSessionPermisos();
  if (!permisos?.includes("editar_empleado")) {
    return <NoAcceso />;
  }
  const puestos = await getPuestosActivas()
  const empleados = await getEmpleados()


  // Obtener el cliente por getEmpleadoById ID
  const empleado = await getEmpleadoById(params.id);
  if (!empleado) {
    redirect("/empleados"); // Redirige si no se encuentra el cliente
  }
  const initialData = {
    id: empleado.id || "",
    nombre: empleado.nombre,
    apellido: empleado.apellido,
    correo: empleado.correo,
    genero: empleado.genero, // Valor por defecto
    activo: empleado.activo ?? false,
    fechaNacimiento: new Date(empleado.fechaNacimiento),
    nombreUsuario: empleado.usuario,
    jefe_id: empleado.jefe_id || "",
    puesto_id: empleado.puesto_id || "",
    numeroIdentificacion: empleado.numeroIdentificacion || "",
    fechaIngreso: empleado.fechaIngreso ? new Date(empleado.fechaIngreso) : new Date(),
    departamentoDomicilio: empleado.departamentoDomicilio || "",
    ciudadDomicilio: empleado.ciudadDomicilio || "",
    direccionDomicilio: empleado.departamentoDomicilio || "",
    telefono: empleado.telefono || "",
    jefe: empleado.jefe || undefined,
    colonia: empleado.colonia || "",
    profesion: empleado.profesion || "",
    vacaciones: empleado.vacaciones || 0
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
