"use server";

import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { UnidadInsumo } from './types';

/**
 * Obtener todas las unidades de medida de insumos
 */
export async function getUnidadesInsumo(): Promise<UnidadInsumo[]> {
  const records = await prisma.unidadInsumo.findMany({
    orderBy: { nombre: 'asc' },
  });
  return records.map(r => ({
    id: r.id,
    nombre: r.nombre,
    abreviatura: r.abreviatura || '',
    descripcion: r.descripcion || '',
    activo: r.activo,
  }));
}

/**
 * Obtener las unidades de medida activas
 */
export async function getUnidadesInsumoActivas(): Promise<UnidadInsumo[]> {
  const records = await prisma.unidadInsumo.findMany({
    where: { activo: true },
    orderBy: { nombre: 'asc' },
  });
  return records.map(r => ({
    id: r.id,
    nombre: r.nombre,
    abreviatura: r.abreviatura || '',
    descripcion: r.descripcion || '',
    activo: r.activo,
  }));
}

/**
 * Obtener una unidad de medida por ID
 */
export async function getUnidadInsumoById(id: string): Promise<UnidadInsumo | null> {
  const r = await prisma.unidadInsumo.findUnique({ where: { id } });
  if (!r) return null;
  return {
    id: r.id,
    nombre: r.nombre,
    abreviatura: r.abreviatura || '',
    descripcion: r.descripcion || '',
    activo: r.activo,
  };
}

/**
 * Crear una nueva unidad de medida
 */
export async function postUnidadInsumo(data: UnidadInsumo): Promise<UnidadInsumo> {
  const r = await prisma.unidadInsumo.create({
    data: {
      id: randomUUID(),
      nombre: data.nombre,
      abreviatura: data.abreviatura || null,
      descripcion: data.descripcion || null,
      activo: data.activo ?? true,
    },
  });

  revalidatePath('/inventario/unidad-insumo');

  return {
    id: r.id,
    nombre: r.nombre,
    abreviatura: r.abreviatura || '',
    descripcion: r.descripcion || '',
    activo: r.activo,
  };
}

/**
 * Actualizar una unidad de medida existente
 */
export async function putUnidadInsumo(data: UnidadInsumo): Promise<UnidadInsumo> {
  const r = await prisma.unidadInsumo.update({
    where: { id: data.id! },
    data: {
      nombre: data.nombre,
      abreviatura: data.abreviatura || null,
      descripcion: data.descripcion || null,
      activo: data.activo,
    },
  });

  revalidatePath('/inventario/unidad-insumo');

  return {
    id: r.id,
    nombre: r.nombre,
    abreviatura: r.abreviatura || '',
    descripcion: r.descripcion || '',
    activo: r.activo,
  };
}
