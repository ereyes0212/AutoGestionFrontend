"use server";

import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { Puesto } from './types';

/**
 * Obtiene todos los puestos
 */
export async function getPuestos(): Promise<Puesto[]> {
  const records = await prisma.puesto.findMany();
  return records.map(r => ({
    id: r.Id,
    nombre: r.Nombre,
    descripcion: r.Descripcion,
    activo: r.Activo,
  }));
}

/**
 * Obtiene solo los puestos activos
 */
export async function getPuestosActivas(): Promise<Puesto[]> {
  const records = await prisma.puesto.findMany({
    where: { Activo: true },
  });
  return records.map(r => ({
    id: r.Id,
    nombre: r.Nombre,
    descripcion: r.Descripcion,
    activo: r.Activo,
  }));
}

/**
 * Obtiene un puesto por ID
 */
export async function getPuestoById(id: string): Promise<Puesto | null> {
  const r = await prisma.puesto.findUnique({
    where: { Id: id },
  });
  if (!r) return null;
  return {
    id: r.Id,
    nombre: r.Nombre,
    descripcion: r.Descripcion,
    activo: r.Activo,
  };
}

/**
 * Crea un nuevo puesto
 */
export async function createPuesto(data: Puesto): Promise<Puesto> {
  const id = randomUUID();
  const r = await prisma.puesto.create({
    data: {
      Id: id,
      Nombre: data.nombre,
      Descripcion: data.descripcion,
      Activo: data.activo ?? true,
    },
  });
  return {
    id: r.Id,
    nombre: r.Nombre,
    descripcion: r.Descripcion,
    activo: r.Activo,
  };
}

/**
 * Actualiza un puesto existente
 */
export async function updatePuesto(id: string, data: Partial<Puesto>): Promise<Puesto | null> {
  const r = await prisma.puesto.update({
    where: { Id: id },
    data: {
      Nombre: data.nombre,
      Descripcion: data.descripcion,
      Activo: data.activo,
    },
  });
  return {
    id: r.Id,
    nombre: r.Nombre,
    descripcion: r.Descripcion,
    activo: r.Activo,
  };
}
