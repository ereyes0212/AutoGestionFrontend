"use server";

import { prisma } from '@/lib/prisma';

interface RegistroActivo {
    id: string;
    fecha: Date;
    tipo: string;
    descripcion: string;
    usuario: string;
}

export async function getActivoRegistros(id: string): Promise<RegistroActivo[]> {
    try {
        const registros = await prisma.historialActivo.findMany({
            where: {
                activoId: id,
            },
            include: {
                estado: true,
            },
            orderBy: {
                fechaRevision: 'desc',
            },
        });

        return registros.map(registro => ({
            id: registro.id,
            fecha: registro.fechaRevision,
            tipo: registro.estado.nombre,
            descripcion: registro.observaciones || 'Sin observaciones',
            usuario: 'Sistema', // Si necesitas el usuario real, necesitarías agregar la relación en el modelo
        }));
    } catch (error) {
        console.error("Error al obtener registros del activo:", error);
        return [];
    }
} 