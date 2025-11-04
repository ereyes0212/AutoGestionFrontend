import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { List } from "lucide-react";
import { getEventos } from "./actions";
import { columns } from "./components/columns";
import { DataTable } from "./components/data-table";

export default async function Puestos() {

    const permisos = await getSessionPermisos();


    if (!permisos?.includes("ver_eventos")) {
        return <NoAcceso />;
    }
    const data = await getEventos();
    if (!data) {
        return <div>No se encontraron eventos.</div>;
    }

    return (
        <div className="container mx-auto py-2">
            <HeaderComponent
                Icon={List}
                description="En este apartado podrá ver todos los eventos registrados."
                screenName="Eventos"
            />

            <div className="hidden md:block">
                <DataTable columns={columns} data={data} />
            </div>
            {/* <div className="block md:hidden">
                <PuestoListMobile puesto={data} />
            </div> */}
        </div>
    );
}
