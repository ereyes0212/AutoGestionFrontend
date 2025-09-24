// app/puestos/page.tsx (Server Component)
import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { Pencil } from "lucide-react";
import { getNotas } from "./actions";
// no importes DataTable / NotaListMobile directamente aquí: lo hace el wrapper client
// importa el client wrapper que escucha SSE y mantiene el estado en el cliente

// importa el client component de datepicker y el botón
import NotasDatePickerClient from "./components/datepickerselect";
import NotasRealtimeWrapper from "./components/notasWrapper";
import DownloadExcelButton from "./components/reportebutton";
import DownloadPDFButton from "./components/reportebuttonCompleto";

export default async function Puestos({ searchParams }: { searchParams?: Record<string, string> }) {
    const permisos = await getSessionPermisos();
    if (!permisos?.includes("ver_notas")) return <NoAcceso />;

    const desde = searchParams?.desde;
    const hasta = searchParams?.hasta;

    // obtiene las notas iniciales en el server (lo que ya tenías)
    const data = await getNotas(desde, hasta);

    return (
        <div className="container mx-auto py-2">
            <HeaderComponent
                Icon={Pencil}
                description="En este apartado podrá ver todos las notas y asignaciones."
                screenName="Propuestas notas"
            />

            <div className="mb-4 flex items-center gap-2">
                <NotasDatePickerClient desdeInit={desde} hastaInit={hasta} />

                {(permisos?.includes("cambiar_estado_notas")) && (
                    <DownloadExcelButton />
                )}
                {(permisos?.includes("cambiar_estado_notas")) && (
                    <DownloadPDFButton />
                )}

            </div>
            <div className="">
                <NotasRealtimeWrapper initialNotas={data} desde={desde ?? null} hasta={hasta ?? null} />
            </div>
            {/* Aquí montamos el wrapper cliente que mantiene el estado y escucha SSE */}

        </div>
    );
}
