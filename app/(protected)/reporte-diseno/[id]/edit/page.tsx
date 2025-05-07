import { getTipoSeccionActivas } from "@/app/(protected)/tipo-seccion/actions";
import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { Pencil } from "lucide-react";
import { redirect } from "next/navigation";
import { getReporteDiseñoById } from "../../actions";
import { FormularioReporte } from "../../components/Form";

export default async function EditReporte({ params }: { params: { id: string } }) {
  // Verificar permisos
  const permisos = await getSessionPermisos();
  if (!permisos?.includes("editar_reporte_diseno")) {
    return <NoAcceso />;
  }

  // Obtener reporte por ID
  const reporte = await getReporteDiseñoById(params.id);
  if (!reporte) {
    redirect("/reporte-diseno");
  }

  // Obtener opciones de secciones
  const tipoSecciones = await getTipoSeccionActivas();

  // Inicializar datos del formulario
  const initialData = {
    id: reporte.id,
    SeccionId: reporte.tipoSeccionId,
    FechaRegistro: reporte.fechaRegistro,
    PaginaInicio: reporte.paginaInicio,
    PaginaFin: reporte.paginaFin,
    HoraInicio: reporte.horaInicio,
    HoraFin: reporte.horaFin,
    Observacion: reporte.observacion || "",
  };

  return (
    <div>
      <HeaderComponent
        Icon={Pencil}
        description="En este apartado podrás editar un reporte de diseño"
        screenName="Editar Reporte Diseño"
      />
      <FormularioReporte
        isUpdate={true}
        initialData={initialData}
        tipoSecciones={tipoSecciones}
      />
    </div>
  );
}
