// app/puestos/page.tsx (Server Component)
import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { Pencil } from "lucide-react";
import { getNotas } from "./actions";
import NotasDatePickerClient from "./components/datepickerselect";
import NotasRealtimeWrapper from "./components/notasWrapper";
import DownloadExcelButton from "./components/reportebutton";
import DownloadPDFButton from "./components/reportebuttonCompleto";

export default async function Puestos({ searchParams }: { searchParams?: Record<string, string> }) {
    const permisos = await getSessionPermisos();
    if (!permisos?.includes("ver_notas")) return <NoAcceso />;

    const desde = searchParams?.desde;
    const hasta = searchParams?.hasta;

    // obtiene las notas iniciales en el server
    const data = await getNotas(desde, hasta);

    // 🔽 Ordena por fecha de creación (más recientes primero)
    const notasOrdenadas = [...data].sort(
        (a, b) => new Date(b.createAt).getTime() - new Date(a.createAt).getTime()
    );

    return (
        <div className="container mx-auto py-2">
            <HeaderComponent
                Icon={Pencil}
                description="En este apartado podrá ver todos las notas y asignaciones."
                screenName="Propuestas notas"
            />

            <div className="mb-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="w-full sm:w-auto">
                    <NotasDatePickerClient desdeInit={desde} hastaInit={hasta} />
                </div>

                <div className="col-span-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                    {permisos?.includes("cambiar_estado_notas") && (
                        <>
                            <DownloadExcelButton />
                            <DownloadPDFButton />
                        </>
                    )}
                </div>
            </div>

            <div>
                {/* 🔽 Enviamos la lista ya ordenada */}
                <NotasRealtimeWrapper initialNotas={notasOrdenadas} />
            </div>
        </div>
    );
}
