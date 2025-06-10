import { notFound } from "next/navigation";
import { getActivoByCodigoBarra, getEstadosActivo } from "../../actions";
import { EstadoActivo } from "../../types";
import ActivoCheckForm from "./components/activo-check-form";

export default async function ActivoCheckPage({
    params,
}: {
    params: { codigoBarra: string };
}) {
    const [activo, estados] = await Promise.all([
        getActivoByCodigoBarra(params.codigoBarra),
        getEstadosActivo(),
    ]);

    if (!activo) {
        notFound();
    }

    return <ActivoCheckForm activo={activo} estados={estados as EstadoActivo[]} />;
} 