import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { Pencil } from "lucide-react";
import { getNotas } from "./actions";
import { columns } from "./components/columns";
import { DataTable } from "./components/data-table";
// import PuestoListMobile from "./components/puesto-list-mobile";

export default async function Puestos() {

    const permisos = await getSessionPermisos();


    const data = await getNotas();
    if (!permisos?.includes("ver_notas")) {
        return <NoAcceso />;
    }

    return (
        <div className="container mx-auto py-2">
            <HeaderComponent
                Icon={Pencil}
                description="En este apartado podrá ver todos las notas y asignaciones."
                screenName="Propuestas notas"
            />

            <div className="hidden md:block">
                <DataTable columns={columns} data={data} />
            </div>
            <div className="block md:hidden">
                {/* <PuestoListMobile puesto={data} /> */}
            </div>
        </div>
    );
}
