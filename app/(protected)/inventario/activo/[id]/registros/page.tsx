import { getSessionPermisos } from "@/auth";
import NoAcceso from "@/components/noAccess";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getActivoById } from "../../actions";
import { getActivoRegistros } from "./actions";
import RegistrosList from "./components/registros-list";

export default async function ActivoRegistrosPage({
    params,
}: {
    params: { id: string };
}) {
    const permisos = await getSessionPermisos();

    if (!permisos?.includes("ver_activo")) {
        return <NoAcceso />;
    }

    const [activo, registros] = await Promise.all([
        getActivoById(params.id),
        getActivoRegistros(params.id),
    ]);

    if (!activo) {
        return null;
    }

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Link href={`/inventario/activo/${params.id}`}>
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <h1 className="text-2xl font-bold">Registros del Activo</h1>
                </div>
            </div>

            <RegistrosList activo={activo} registros={registros} />
        </div>
    );
} 