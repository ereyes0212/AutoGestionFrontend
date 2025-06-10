import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { Button } from "@/components/ui/button";
import { List, Package } from "lucide-react";
import Link from "next/link";

export default async function Empleados() {

    const permisos = await getSessionPermisos();



    if (!permisos?.includes("ver_inventario")) {
        return <NoAcceso />;
    }

    return (
        <div className="container mx-auto py-2">
            <HeaderComponent
                Icon={Package}
                description="En este apartado podrá ver todos las diferentes opciones de inventario"
                screenName="inventario"
            />
            <div className="flex flex-col space-y-4 mt-4">
                <div className="flex items-center justify-between p-4 border rounded-lg shadow-sm hover:bg-secondary transition">
                    <div className="flex items-center space-x-4">
                        <div className="p-3  rounded-full">
                            <List className="text-blue-500" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold">Categorias De activos</h3>
                            <p className="text-sm text-gray-600">Administre los diferentes tipos de categorias de activos.</p>
                        </div>
                    </div>
                    <Button asChild>
                        <Link href="/inventario/categoria-activo">Ir</Link>
                    </Button>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg shadow-sm hover:bg-secondary transition">
                    <div className="flex items-center space-x-4">
                        <div className="p-3  rounded-full">
                            <List className="text-green-500" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold">Estados activo</h3>
                            <p className="text-sm text-gray-600">Administre los diferentes tipos de estado de un activo.</p>
                        </div>
                    </div>
                    <Button asChild>
                        <Link href="/inventario/estados-activos">Ir</Link>
                    </Button>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg shadow-sm hover:bg-secondary transition">
                    <div className="flex items-center space-x-4">
                        <div className="p-3  rounded-full">
                            <Package className="text-green-500" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold">Activos</h3>
                            <p className="text-sm text-gray-600">Administre los diferentes activos.</p>
                        </div>
                    </div>
                    <Button asChild>
                        <Link href="/inventario/activo">Ir</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
