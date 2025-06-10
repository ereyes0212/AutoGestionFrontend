"use server";

import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { EstadoActivo } from '../estados-activos/types';
import { Activo, ActivoCheckForm } from './types';

/**
 * Obtener todos los activos
 */
export async function getActivos(): Promise<Activo[]> {
    const records = await prisma.activo.findMany({
        include: {
            categoria: true,
            empleadoAsignado: true,
            estadoActual: true,
        },
        orderBy: { fechaRegistro: 'desc' },
    });
    return records.map(r => ({
        id: r.id,
        codigoBarra: r.codigoBarra,
        nombre: r.nombre,
        descripcion: r.descripcion || '',
        categoriaId: r.categoriaId,
        categoria: r.categoria ? {
            id: r.categoria.id,
            nombre: r.categoria.nombre
        } : undefined,
        empleadoAsignadoId: r.empleadoAsignadoId || undefined,
        empleadoAsignado: r.empleadoAsignado ? {
            id: r.empleadoAsignado.id,
            nombre: r.empleadoAsignado.nombre,
            apellido: r.empleadoAsignado.apellido
        } : undefined,
        fechaAsignacion: r.fechaAsignacion || undefined,
        fechaRegistro: r.fechaRegistro,
        estadoActualId: r.estadoActualId || undefined,
        estadoActual: r.estadoActual ? {
            id: r.estadoActual.id,
            nombre: r.estadoActual.nombre
        } : undefined,
        activo: r.activo,
    }));
}

/**
 * Obtener activos activos
 */
export async function getActivosActivos(): Promise<Activo[]> {
    const records = await prisma.activo.findMany({
        where: { activo: true },
        include: {
            categoria: true,
            empleadoAsignado: true,
            estadoActual: true,
        },
        orderBy: { fechaRegistro: 'desc' },
    });
    console.log("🚀 ~ getActivosActivos ~ records:", records)
    return records.map(r => ({
        id: r.id,
        codigoBarra: r.codigoBarra,
        nombre: r.nombre,
        descripcion: r.descripcion || '',
        categoriaId: r.categoriaId,
        categoria: r.categoria ? {
            id: r.categoria.id,
            nombre: r.categoria.nombre
        } : undefined,
        empleadoAsignadoId: r.empleadoAsignadoId || undefined,
        empleadoAsignado: r.empleadoAsignado ? {
            id: r.empleadoAsignado.id,
            nombre: r.empleadoAsignado.nombre,
            apellido: r.empleadoAsignado.apellido
        } : undefined,
        fechaAsignacion: r.fechaAsignacion || undefined,
        fechaRegistro: r.fechaRegistro,
        estadoActualId: r.estadoActualId || undefined,
        estadoActual: r.estadoActual ? {
            id: r.estadoActual.id,
            nombre: r.estadoActual.nombre
        } : undefined,
        activo: r.activo,
    }));
}

/**
 * Obtener un activo por ID
 */
export async function getActivoById(id: string): Promise<Activo | null> {
    const r = await prisma.activo.findUnique({
        where: { id },
        include: {
            categoria: true,
            empleadoAsignado: true,
            estadoActual: true,
            historialEstados: {
                include: {
                    estado: true,
                },
                orderBy: {
                    fechaRevision: 'desc',
                },
            },
        },
    });
    console.log("🚀 ~ getActivoById ~ r:", r)
    if (!r) return null;
    return {
        id: r.id,
        codigoBarra: r.codigoBarra,
        nombre: r.nombre,
        categoria: {
            id: r.categoria.id,
            nombre: r.categoria.nombre
        },
        empleadoAsignado: r.empleadoAsignado ? {
            id: r.empleadoAsignado.id,
            nombre: r.empleadoAsignado.nombre,
            apellido: r.empleadoAsignado.apellido
        } : undefined,
        estadoActual: r.estadoActual ? {
            id: r.estadoActual.id,
            nombre: r.estadoActual.nombre
        } : undefined,
        descripcion: r.descripcion || '',
        categoriaId: r.categoriaId,
        empleadoAsignadoId: r.empleadoAsignadoId || undefined,
        fechaAsignacion: r.fechaAsignacion || undefined,
        fechaRegistro: r.fechaRegistro,
        estadoActualId: r.estadoActualId || undefined,
        activo: r.activo,
    };
}

// Función para generar código de barras único
function generarCodigoBarra(): string {
    // Genera un número aleatorio de 8 dígitos
    const numero = Math.floor(10000000 + Math.random() * 90000000);
    // Agrega un prefijo "ACT" y el número
    return `ACT${numero}`;
}

/**
 * Crear un nuevo activo
 */
export async function postActivo(data: Activo): Promise<Activo> {
    const id = randomUUID();
    const codigoBarra = generarCodigoBarra();

    const r = await prisma.activo.create({
        data: {
            id: id,
            codigoBarra: codigoBarra, // Usamos el código generado
            nombre: data.nombre,
            descripcion: data.descripcion,
            categoriaId: data.categoriaId,
            empleadoAsignadoId: data.empleadoAsignadoId,
            fechaAsignacion: data.fechaAsignacion,
            fechaRegistro: new Date(),
            estadoActualId: data.estadoActualId,
            activo: data.activo ?? true
        },
    });
    return {
        id: r.id,
        codigoBarra: r.codigoBarra,
        nombre: r.nombre,
        descripcion: r.descripcion || '',
        categoriaId: r.categoriaId,
        empleadoAsignadoId: r.empleadoAsignadoId || undefined,
        fechaAsignacion: r.fechaAsignacion || undefined,
        fechaRegistro: r.fechaRegistro,
        estadoActualId: r.estadoActualId || undefined,
        activo: r.activo,
    };
}

/**
 * Actualizar un activo existente
 */
export async function putActivo(data: Activo): Promise<Activo> {
    const r = await prisma.activo.update({
        where: { id: data.id! },
        data: {
            codigoBarra: data.codigoBarra,
            nombre: data.nombre,
            descripcion: data.descripcion,
            categoriaId: data.categoriaId,
            empleadoAsignadoId: data.empleadoAsignadoId,
            fechaAsignacion: data.fechaAsignacion,
            estadoActualId: data.estadoActualId,
            activo: data.activo,
        },
    });
    return {
        id: r.id,
        codigoBarra: r.codigoBarra,
        nombre: r.nombre,
        descripcion: r.descripcion || '',
        categoriaId: r.categoriaId,
        empleadoAsignadoId: r.empleadoAsignadoId || undefined,
        fechaAsignacion: r.fechaAsignacion || undefined,
        fechaRegistro: r.fechaRegistro,
        estadoActualId: r.estadoActualId || undefined,
        activo: r.activo,
    };
}

/**
 * Registrar un cambio de estado en el historial
 */
export async function postCambioEstado(
    activoId: string,
    estadoId: string,
    observaciones?: string
): Promise<void> {
    await prisma.historialActivo.create({
        data: {
            id: randomUUID(),
            activoId,
            estadoId,
            fechaRevision: new Date(),
            observaciones,
        },
    });

    await prisma.activo.update({
        where: { id: activoId },
        data: { estadoActualId: estadoId },
    });
}

export async function getActivoByCodigoBarra(codigoBarra: string): Promise<Activo | null> {
    try {
        const activo = await prisma.activo.findUnique({
            where: { codigoBarra },
            include: {
                categoria: true,
                estadoActual: true,
                empleadoAsignado: true,
            },
        });
        if (!activo) return null;
        return {
            id: activo.id,
            codigoBarra: activo.codigoBarra,
            nombre: activo.nombre,
            descripcion: activo.descripcion || '',
            categoriaId: activo.categoriaId,
            categoria: activo.categoria ? {
                id: activo.categoria.id,
                nombre: activo.categoria.nombre
            } : undefined,
            empleadoAsignadoId: activo.empleadoAsignadoId || undefined,
            empleadoAsignado: activo.empleadoAsignado ? {
                id: activo.empleadoAsignado.id,
                nombre: activo.empleadoAsignado.nombre,
                apellido: activo.empleadoAsignado.apellido
            } : undefined,
            fechaAsignacion: activo.fechaAsignacion || undefined,
            fechaRegistro: activo.fechaRegistro,
            estadoActualId: activo.estadoActualId || undefined,
            estadoActual: activo.estadoActual ? {
                id: activo.estadoActual.id,
                nombre: activo.estadoActual.nombre
            } : undefined,
            activo: activo.activo,
        };
    } catch (error) {
        throw new Error("Error al buscar el activo");
    }
}

export async function getEstadosActivo(): Promise<EstadoActivo[]> {
    try {
        const estados = await prisma.estadoActivo.findMany();
        return estados.map(estado => ({
            id: estado.id,
            nombre: estado.nombre,
            descripcion: estado.descripcion || ''
        }));
    } catch (error) {
        throw new Error("Error al obtener los estados");
    }
}

export async function registrarCheckActivo(data: ActivoCheckForm) {
    try {
        const check = await prisma.historialActivo.create({
            data: {
                activoId: data.activoId,
                estadoId: data.estadoId,
                observaciones: data.observaciones,
                fechaRevision: new Date(),
            },
        });
        return check;
    } catch (error) {
        throw new Error("Error al registrar el check del activo");
    }
} 