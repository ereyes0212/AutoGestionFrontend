import { getSolicitudesById } from "@/app/(protected)/solicitudes/actions";
import { Inbox } from "lucide-react";
import ClientPrintView from "./solicitudPrint";
import { getSession } from "@/auth";


export default async function ImprimirPage({ params }: { params: { id: string } }) {
    const solicitud = await getSolicitudesById(params.id);
    const usuario = await getSession();
    if (!solicitud) {
        return (
            <div style={{ textAlign: "center", marginTop: "2rem" }}>
                <Inbox size={50} color="red" />
                <p>No se encuentra la solicitud</p>
            </div>
        );
    }

    return <ClientPrintView solicitud={solicitud} usuario={usuario?.User || ""} />;
}
