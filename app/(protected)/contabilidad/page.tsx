import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { Button } from "@/components/ui/button";
import { LucideCircleDollarSign } from "lucide-react";
import Link from "next/link";

export default async function Empleados() {

    const permisos = await getSessionPermisos();



    if (!permisos?.includes("ver_contabilidad")) {
        return <NoAcceso />;
    }

    return (
        <div className="container mx-auto py-2">
            <HeaderComponent
                Icon={LucideCircleDollarSign}
                description="En este apartado podrá ver todos las diferentes opciones de contabilidad"
                screenName="Contabilidad"
            />
            <div className="flex flex-col space-y-4 mt-4">
                <div className="flex items-center justify-between p-4 border rounded-lg shadow-sm hover:bg-secondary transition">
                    <div className="flex items-center space-x-4">
                        <div className="p-3  rounded-full">
                            <LucideCircleDollarSign className="text-blue-500" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold">Tipo de Deducciones</h3>
                            <p className="text-sm text-gray-600">Administre los diferentes tipos de deducciones.</p>
                        </div>
                    </div>
                    <Button asChild>
                        <Link href="/contabilidad/tipo-deducciones">Ir</Link>
                    </Button>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg shadow-sm hover:bg-secondary transition">
                    <div className="flex items-center space-x-4">
                        <div className="p-3  rounded-full">
                            <LucideCircleDollarSign className="text-green-500" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold">Generar Planilla</h3>
                            <p className="text-sm text-gray-600">Cree y gestione las planillas de pago.</p>
                        </div>
                    </div>
                    <Button asChild>
                        <Link href="/contabilidad/generar-planilla">Ir</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
