// app/puestos/page.tsx (Server Component)
import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { Pencil } from "lucide-react";
import { getNotas } from "./actions";
import { columns } from "./components/columns";
import { DataTable } from "./components/data-table";
import NotaListMobile from "./components/puesto-list-mobile";

// importa el client component
import NotasDatePickerClient from "./components/datepickerselect";

export default async function Puestos({ searchParams }: { searchParams?: Record<string, string> }) {
    const permisos = await getSessionPermisos();
    if (!permisos?.includes("ver_notas")) return <NoAcceso />;

    // lee searchParams (desde/hasta en formato YYYY-MM-DD) y pásalo a getNotas
    const desde = searchParams?.desde;
    const hasta = searchParams?.hasta;

    const data = await getNotas(desde, hasta);

    return (
        <div className="container mx-auto py-2">
            <HeaderComponent
                Icon={Pencil}
                description="En este apartado podrá ver todos las notas y asignaciones."
                screenName="Propuestas notas"
            />

            <div className="mb-4">
                <NotasDatePickerClient desdeInit={desde} hastaInit={hasta} />
            </div>

            <div className="hidden md:block">
                <DataTable columns={columns} data={data} />
            </div>
            <div className="block md:hidden">
                <NotaListMobile notas={data} />
            </div>
        </div>
    );
}
