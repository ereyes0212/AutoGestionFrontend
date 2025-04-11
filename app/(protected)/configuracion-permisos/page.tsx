import { ListCheck, Settings, User, Users } from "lucide-react";
import { getSession, getSessionPermisos } from "@/auth";
import { redirect } from "next/navigation";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
// import PermissionListMobile from "./components/permisos-list-mobile";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import CompanyButtons from "./components/botones-empresa";
import { getEmpresasActivas } from "../empresas/actions";

export default async function EstadoServicio() {

    const permisos = await getSessionPermisos();



    if (!permisos?.includes("ver_permisos")) {
        return <NoAcceso />;
    }

    const empresas = await getEmpresasActivas();
    if (!empresas) {
        return <NoAcceso />;
    }
    return (
        <div className="container mx-auto py-2">
            <HeaderComponent
                Icon={Settings}
                description="En este apartado podrá configurar la autorización de permisos."
                screenName="Configuracion de permisos"
            />

            <CompanyButtons companies={empresas} />
        </div>
    );
}
