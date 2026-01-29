import { getSolicitudesById } from "@/app/(protected)/solicitudes/actions";
import { getSession } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Inbox } from "lucide-react";
import ClientPrintView from "./solicitudPrint";

interface Firma {
    nombre: string;
    cargo: string;
    firmaBase64?: string | null;
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

    // Obtener la firma del empleado que solicita las vacaciones
    const empleadoSolicitante = await prisma.empleados.findUnique({
        where: { id: solicitud.empleadoId },
        select: { firma: true, nombre: true, apellido: true },
    });

    // Obtener la información del usuario autenticado que genera el PDF
    let firmaGenerador: Firma | null = null;
    if (usuario?.IdEmpleado) {
        const empleadoGenerador = await prisma.empleados.findUnique({
            where: { id: usuario.IdEmpleado },
            include: {
                Puesto: true,
            },
        });

        if (empleadoGenerador) {
            firmaGenerador = {
                nombre: `${empleadoGenerador.nombre} ${empleadoGenerador.apellido}`,
                cargo: empleadoGenerador.Puesto?.Nombre || usuario.Puesto || "Sin cargo",
                firmaBase64: empleadoGenerador.firma,
            };
        }
    }

    // Obtenemos los nombres y cargos del query params
    // Si vienen como string único, lo convertimos en array
    const nombres = Array.isArray(searchParams?.nombre)
        ? searchParams?.nombre
        : searchParams?.nombre?.split(",") || [];
    const cargos = Array.isArray(searchParams?.cargo)
        ? searchParams?.cargo
        : searchParams?.cargo?.split(",") || [];

    // Crear el array de firmas
    const firmas: Firma[] = [];

    // Agregar la firma del empleado que solicita como primera firma
    if (empleadoSolicitante?.firma) {
        firmas.push({
            nombre: solicitud.nombreEmpleado,
            cargo: solicitud.puesto,
            firmaBase64: empleadoSolicitante.firma,
        });
    }

    // Agregar las firmas adicionales del query params
    nombres.forEach((nombre, index) => {
        // Evitar duplicar si ya agregamos la firma del empleado solicitante o del generador
        const nombreGenerador = firmaGenerador?.nombre;
        if (nombre !== solicitud.nombreEmpleado && nombre !== nombreGenerador) {
            firmas.push({
                nombre,
                cargo: cargos[index] || "Desconocido",
            });
        }
    });

    // Agregar la firma del usuario que genera el PDF al final (si no es el mismo que solicita)
    if (firmaGenerador && firmaGenerador.nombre !== solicitud.nombreEmpleado) {
        firmas.push(firmaGenerador);
    }

    return <ClientPrintView solicitud={solicitud} usuario={usuario?.User || ""} firmas={firmas} />;
}
