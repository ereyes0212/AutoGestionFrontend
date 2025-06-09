import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { PlusCircle } from "lucide-react";
import { getTipoSeccionActivas } from "../../tipo-seccion/actions";
import { FormularioReporte } from "../components/Form";

export default async function CreateReporte() {
  const permisos = await getSessionPermisos();
  if (!permisos?.includes("crear_reporte_diseno")) {
    return <NoAcceso />;
  }

  // Initial data para formulario de reporte de diseño
  const initialData = {
    SeccionId: "",          // UUID de la sección seleccionada
    FechaRegistro: new Date().toISOString().slice(0, 16), // 'YYYY-MM-DDTHH:mm'
    PaginaInicio: 0,
    PaginaFin: 0,
    HoraInicio: "08:00:00",
    HoraFin: "09:00:00",
    Observacion: "",
  };

  const tipoSecciones = await getTipoSeccionActivas();

  return (
    <div>
      <HeaderComponent
        Icon={PlusCircle}
        description="En este apartado podrás crear un nuevo reporte de diseño"
        screenName="Reportes Diseño"
      />
      <FormularioReporte
        isUpdate={false}
        initialData={initialData}
        tipoSecciones={tipoSecciones}
      />
    </div>
  );
}
