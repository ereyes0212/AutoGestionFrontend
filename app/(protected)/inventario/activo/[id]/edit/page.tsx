import { getEmpleados } from "@/app/(protected)/empleados/actions";
import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { Pencil } from "lucide-react";
import { redirect } from "next/navigation";
import { getCategoriaActivosActivas } from "../../../categoria-activo/actions";
import { getEstadoActivo } from "../../../estados-activos/actions";
import { getActivoById } from "../../actions";
import { ActivoFormulario } from "../../components/Form";

export default async function Edit({ params }: { params: { id: string } }) {
    const permisos = await getSessionPermisos();

    if (!permisos?.includes("editar_activo")) {
        return <NoAcceso />;
    }

    // Obtener datos necesarios
    const [activo, categorias, estados, empleados] = await Promise.all([
        getActivoById(params.id),
        getCategoriaActivosActivas(),
        getEstadoActivo(),
        getEmpleados(),
    ]);

    if (!activo) {
        redirect("/inventario/activo");
    }

    const initialData = {
        id: activo.id,
        nombre: activo.nombre,
        descripcion: activo.descripcion || "",
        categoriaId: activo.categoriaId,
        empleadoAsignadoId: activo.empleadoAsignadoId || "",
        fechaAsignacion: activo.fechaAsignacion || new Date(),
        fechaRegistro: activo.fechaRegistro || new Date(),
        estadoActualId: activo.estadoActualId || "",
        activo: activo.activo ?? true
    };

    return (
        <div>
            <HeaderComponent
                Icon={Pencil}
                description="En este apartado podrá editar un activo."
                screenName="Editar Activo"
            />
            <ActivoFormulario
                isUpdate={true}
                initialData={{
                    ...initialData,
                    codigoBarra: activo.codigoBarra || ""
                }}
                categorias={categorias}
                estados={estados}
                empleados={empleados}
            />
        </div>
    );
} 