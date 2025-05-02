// app/empleados/page.tsx
import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { LucideCircleDollarSign } from "lucide-react";
import { TemplateGenerator } from "./components/TemplateGenerator";
import { VoucherImporter } from "./components/VoucherImporter";

export default async function Empleados() {
    const permisos = await getSessionPermisos();

    if (!permisos?.includes("ver_generar_planilla")) {
        return <NoAcceso />;
    }

    return (
        <div className="container mx-auto py-2 space-y-6">
            <HeaderComponent
                Icon={LucideCircleDollarSign}
                description="En este apartado podrá ver todos las diferentes opciones de contabilidad"
                screenName="Contabilidad"
            />

            <div className="flex space-x-4">
                <TemplateGenerator />
            </div>

            <VoucherImporter />
        </div>
    );
}
