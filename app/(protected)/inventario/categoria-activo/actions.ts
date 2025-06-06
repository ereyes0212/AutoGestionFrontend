"use server";

import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { CategoriaActivo } from './types';

/**
 * Obtener todos los tipos de sección
 */
export async function getCategoriaActivo(): Promise<CategoriaActivo[]> {
  const records = await prisma.categoriaActivo.findMany({
    orderBy: { nombre: 'asc' },
  });
  return records.map(r => ({
    id: r.id,
    nombre: r.nombre,
    descripcion: r.descripcion || '',
    activo: r.activo,
  }));
}

/**
 * Obtener tipos de sección activos
 */
export async function getCategoriaActivosActivas(): Promise<CategoriaActivo[]> {
  const records = await prisma.categoriaActivo.findMany({
    where: { activo: true },
    orderBy: { nombre: 'asc' },
  });
  return records.map(r => ({
    id: r.id!,
    nombre: r.nombre,
    descripcion: r.descripcion || '',
    activo: r.activo,
  }));
}

/**
 * Obtener un tipo de sección por ID
 */
export async function getCategoriaActivoById(id: string): Promise<CategoriaActivo | null> {
  const r = await prisma.categoriaActivo.findUnique({ where: { id: id } });
  if (!r) return null;
  return {
    id: r.id,
    nombre: r.nombre,
    descripcion: r.descripcion || '',
    activo: r.activo,
  };
}

/**
 * Crear un nuevo tipo de sección
 */
export async function postCategoriaActivo(data: CategoriaActivo): Promise<CategoriaActivo> {
  const id = randomUUID();
  const r = await prisma.categoriaActivo.create({
    data: {
      id: id,
      nombre: data.nombre,
      descripcion: data.descripcion,
      activo: data.activo ?? true
    },
  });
  return {
    id: r.id,
    nombre: r.nombre,
    descripcion: r.descripcion || '',
    activo: r.activo,
  };
}

/**
 * Actualizar un tipo de sección existente
 */
export async function putCategoriaActivo(data: CategoriaActivo): Promise<CategoriaActivo> {
  const r = await prisma.categoriaActivo.update({
    where: { id: data.id! },
    data: {
      nombre: data.nombre,
      descripcion: data.descripcion,
      activo: data.activo,
    },
  });
  return {
    id: r.id,
    nombre: r.nombre,
    descripcion: r.descripcion || '',
    activo: r.activo,
  };
}
