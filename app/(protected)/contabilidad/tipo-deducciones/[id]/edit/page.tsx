
import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { Pencil } from "lucide-react";
import { redirect } from "next/navigation";
import { getAjusteById } from "../../actions";
import { AjusteTipoFormulario } from "../../components/Form";

export default async function Edit({ params }: { params: { id: string } }) {
  // Verificar si hay una sesión activa

  const permisos = await getSessionPermisos();

  if (!permisos?.includes("editar_tipodeducciones")) {
    return <NoAcceso />;
  }

  // Obtener el cliente por su ID
  const tipoDeduccion = await getAjusteById(params.id);
  if (!tipoDeduccion) {
    redirect("/tipo-deducciones"); // Redirige si no se encuentra el cliente
  }
  const puestoCreate = {
    id: tipoDeduccion.id,
    nombre: tipoDeduccion.nombre,
    activo: tipoDeduccion.activo,
    descripcion: tipoDeduccion.descripcion,
    montoPorDefecto: tipoDeduccion.montoPorDefecto,
    categoria: tipoDeduccion.categoria as "DEDUCCION" | "BONO", // Aseguramos el tipo correcto
  };


  return (
    <div>
      <HeaderComponent
        Icon={Pencil}
        description="En este apartado podrá editar un puesto."
        screenName="Editar Puesto"
      />
      <AjusteTipoFormulario
        isUpdate={true}
        initialData={puestoCreate} // Pasamos los datos del cliente al formulario
      />
    </div>
  );
}
