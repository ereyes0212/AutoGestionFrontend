
import HeaderComponent from "@/components/HeaderComponent";
import { Pencil } from "lucide-react";
import { getSession, getSessionPermisos } from "@/auth";
import { redirect } from "next/navigation";
import { EmpleadoFormulario } from "../../components/Form";
import { getEmpleadoId, getEmpleados } from "../../actions";
import NoAcceso from "@/components/noAccess";
import { getEmpresasActivas } from "@/app/(protected)/empresas/actions";
import { getPuestoActivosByEmpresaId, getPuestosActivas } from "@/app/(protected)/puestos/actions";

export default async function Edit({ params }: { params: { id: string } }) {
  // Verificar si hay una sesión activa

  const permisos = await getSessionPermisos();
  const sesion = await getSession();
  if (!permisos?.includes("editar_empleado")) {
    return <NoAcceso />;
  }
  const puestos =
    sesion?.Rol === "Administrador"
      ? await getPuestosActivas()
      : await getPuestoActivosByEmpresaId();
  const empleados =
    sesion?.Rol === "Administrador"
      ? await getEmpleados()
      : await getEmpleados();

  const empresas = await getEmpresasActivas()
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
    edad: empleado.edad,
    nombreUsuario: empleado.usuario,
    jefe_id: empleado.jefe_id || "", 
    puesto_id: empleado.puesto_id || "", 
    empresas: empleado.empresas!.map(cliente => ({
      id: cliente.id,
      nombre: cliente.nombre,
    }))
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
        empresas={empresas}
        isUpdate={true} // Esto es para indicar que estamos creando, no actualizando
        initialData={initialData} // Datos iniciales para crear un nuevo empleado
      />
      
    </div>
  );
}
