import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { List, QrCode } from "lucide-react";
import { getActivos } from "./actions";
import ActivoListMobile from "./components/activo-list-mobile";
import BarcodeScanner from "./components/barcode-scanner";
import { columns } from "./components/columns";
import { DataTable } from "./components/data-table";

export default async function Activo() {
    const permisos = await getSessionPermisos();
    const data = await getActivos();

    if (!permisos?.includes("ver_activo")) {
        return <NoAcceso />;
    }

    return (
        <div className="container mx-auto py-2">
            <HeaderComponent
                Icon={List}
                description="En este apartado podrá ver todos los activos del inventario."
                screenName="Activos"
            />

            <div className="flex justify-end mb-4">
                <Dialog>
                    <DialogTrigger asChild>
                        <Button className="flex items-center gap-2">
                            <QrCode className="h-4 w-4" />
                            Escanear Activo
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Escanear Código de Barras</DialogTitle>
                        </DialogHeader>
                        <BarcodeScanner />
                    </DialogContent>
                </Dialog>
            </div>

            <div className="hidden md:block">
                <DataTable columns={columns} data={data} />
            </div>
            <div className="block md:hidden">
                <ActivoListMobile activos={data} />
            </div>
        </div>
    );
} 