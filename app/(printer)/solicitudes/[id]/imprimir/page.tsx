import { getSolicitudesById } from "@/app/(protected)/solicitudes/actions";
import { getSession } from "@/auth";
import { Inbox } from "lucide-react";
import ClientPrintView from "./solicitudPrint";

interface Firma {
    nombre: string;
    cargo: string;
}

export default async function ImprimirPage({
    params,
    searchParams,
}: {
    params: { id: string };
    searchParams?: { [key: string]: string | string[] };
}) {
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

    // Obtenemos los nombres y cargos del query params
    // Si vienen como string único, lo convertimos en array
    const nombres = Array.isArray(searchParams?.nombre)
        ? searchParams?.nombre
        : searchParams?.nombre?.split(",") || [];
    const cargos = Array.isArray(searchParams?.cargo)
        ? searchParams?.cargo
        : searchParams?.cargo?.split(",") || [];

    // Mapeamos a [{ nombre, cargo }]
    const firmas: Firma[] = nombres.map((nombre, index) => ({
        nombre,
        cargo: cargos[index] || "Desconocido",
    }));

    return <ClientPrintView solicitud={solicitud} usuario={usuario?.User || ""} firmas={firmas} />;
}
