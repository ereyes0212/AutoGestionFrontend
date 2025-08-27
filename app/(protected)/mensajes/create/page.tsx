import { getSession } from "@/auth";
import { getUsuarios } from "../../usuarios/actions";
import { CrearGrupoForm } from "../components/form";

export default async function NewGroupPage() {
    const sesion = await getSession();
    const usuarios = await getUsuarios();

    return (
        <div className="p-6  mx-auto">
            <h1 className="text-2xl font-bold mb-6">Crear Chat Grupal</h1>
            <CrearGrupoForm creatorId={sesion?.IdUser!} usuarios={usuarios} />
        </div>
    );
}
