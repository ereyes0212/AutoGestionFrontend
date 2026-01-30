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

    // Leer correctamente todos los parámetros repetidos del query
    const query = new URLSearchParams(
        Object.entries(searchParams || {}).flatMap(([key, value]) =>
            Array.isArray(value) ? value.map(v => [key, v]) : [[key, value]]
        )
    );

    const nombres = query.getAll("nombre"); // todos los nombres
    const cargos = query.getAll("cargo");   // todos los cargos

    // Crear el array de firmas
    const firmas: Firma[] = [];

    // 1️⃣ Agregar siempre al solicitante primero
    if (empleadoSolicitante) {
        firmas.push({
            nombre: `${empleadoSolicitante.nombre} ${empleadoSolicitante.apellido}`,
            cargo: solicitud.puesto || "Desconocido",
            firmaBase64: empleadoSolicitante.firma || null,
        });
    }

    // 2️⃣ Agregar todas las firmas del query
    nombres.forEach((nombre, index) => {
        const nombreSolicitante = `${empleadoSolicitante?.nombre} ${empleadoSolicitante?.apellido}`;
        const nombreGenerador = firmaGenerador?.nombre;

        // Evitar duplicar al solicitante exacto y al generador
        if (nombre !== nombreSolicitante && nombre !== nombreGenerador) {
            firmas.push({
                nombre,
                cargo: cargos[index] || "Desconocido",
            });
        }
    });

    // 3️⃣ Agregar la firma del usuario que genera el PDF (si no es el solicitante)
    if (firmaGenerador && firmaGenerador.nombre !== `${empleadoSolicitante?.nombre} ${empleadoSolicitante?.apellido}`) {
        firmas.push(firmaGenerador);
    }

    return <ClientPrintView solicitud={solicitud} usuario={usuario?.User || ""} firmas={firmas} />;
}
