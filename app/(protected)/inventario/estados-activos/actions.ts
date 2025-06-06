"use server";

import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { EstadoActivo } from './types';

/**
 * Obtener todos los tipos de sección
 */
export async function getEstadoActivo(): Promise<EstadoActivo[]> {
  const records = await prisma.estadoActivo.findMany({
    orderBy: { nombre: 'asc' },
  });
  return records.map(r => ({
    id: r.id,
    nombre: r.nombre,
    descripcion: r.descripcion || '',
  }));
}

/**
 * Obtener tipos de sección activos
 */
// export async function getEstadoActivosActivas(): Promise<EstadoActivo[]> {
//   const records = await prisma.estadoActivo.findMany({
//     where: { activo: true },
//     orderBy: { nombre: 'asc' },
//   });
//   return records.map(r => ({
//     id: r.id!,
//     nombre: r.nombre,
//     descripcion: r.descripcion || '',
//     activo: r.activo,
//   }));
// }

/**
 * Obtener un tipo de sección por ID
 */
export async function getEstadoActivoById(id: string): Promise<EstadoActivo | null> {
  const r = await prisma.estadoActivo.findUnique({ where: { id: id } });
  if (!r) return null;
  return {
    id: r.id,
    nombre: r.nombre,
    descripcion: r.descripcion || '',
  };
}

/**
 * Crear un nuevo tipo de sección
 */
export async function postEstadoActivo(data: EstadoActivo): Promise<EstadoActivo> {
  const id = randomUUID();
  const r = await prisma.estadoActivo.create({
    data: {
      id: id,
      nombre: data.nombre,
      descripcion: data.descripcion,
    },
  });
  return {
    id: r.id,
    nombre: r.nombre,
    descripcion: r.descripcion || '',
  };
}

/**
 * Actualizar un tipo de sección existente
 */
export async function putEstadoActivo(data: EstadoActivo): Promise<EstadoActivo> {
  const r = await prisma.estadoActivo.update({
    where: { id: data.id! },
    data: {
      nombre: data.nombre,
      descripcion: data.descripcion,
    },
  });
  return {
    id: r.id,
    nombre: r.nombre,
    descripcion: r.descripcion || '',
  };
}
