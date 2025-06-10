import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { PlusCircle } from "lucide-react";
import { getEmpleados } from "../../../empleados/actions";
import { getCategoriaActivosActivas } from "../../categoria-activo/actions";
import { getEstadoActivo } from "../../estados-activos/actions";
import { ActivoFormulario } from "../components/Form";

export default async function Create() {
    const permisos = await getSessionPermisos();

    if (!permisos?.includes("crear_activo")) {
        return <NoAcceso />;
    }

    // Obtener datos necesarios
    const [categorias, estados, empleados] = await Promise.all([
        getCategoriaActivosActivas(),
        getEstadoActivo(),
        getEmpleados(),
    ]);

    // Inicializamos con valores por defecto
    const initialData = {
        id: "",
        nombre: "",
        descripcion: "",
        categoriaId: "",
        empleadoAsignadoId: "",
        fechaAsignacion: new Date(),
        fechaRegistro: new Date(),
        estadoActualId: "",
        activo: true
    };

    return (
        <div>
            <HeaderComponent
                Icon={PlusCircle}
                description="En este apartado podrá crear un nuevo activo en el inventario."
                screenName="Crear Activo"
            />
            <ActivoFormulario
                isUpdate={false}
                initialData={{
                    ...initialData,
                    codigoBarra: ""
                }}
                categorias={categorias}
                estados={estados}
                empleados={empleados}
            />
        </div>
    );
} 