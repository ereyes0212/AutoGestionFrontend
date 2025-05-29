'use server';

import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { TipoDeduccion } from './types';

/**
 * Obtener todos los tipos de deducción
 */
export async function getTipoDeduccion(): Promise<TipoDeduccion[]> {
  const records = await prisma.tipoDeducciones.findMany({
    orderBy: { Nombre: 'asc' },
  });
  return records.map(r => ({
    id: r.Id,
    nombre: r.Nombre,
    descripcion: r.Descripcion,
    activo: r.Activo,
    createdAt: r.Created_at ?? new Date(),
    updatedAt: r.Updated_at ?? new Date(),
  }));
}

/**
 * Obtener tipos de deducción activos
 */
export async function getTipoDeduccionActivas(): Promise<TipoDeduccion[]> {
  const records = await prisma.tipoDeducciones.findMany({
    where: { Activo: true },
    orderBy: { Nombre: 'asc' },
  });
  return records.map(r => ({
    id: r.Id,
    nombre: r.Nombre,
    descripcion: r.Descripcion,
    activo: r.Activo,
    createdAt: r.Created_at ?? new Date(),
    updatedAt: r.Updated_at ?? new Date(),
  }));
}

/**
 * Obtener un tipo de deducción por ID
 */
export async function getTipoDeduccionById(id: string): Promise<TipoDeduccion | null> {
  const r = await prisma.tipoDeducciones.findUnique({ where: { Id: id } });
  if (!r) return null;
  return {
    id: r.Id,
    nombre: r.Nombre,
    descripcion: r.Descripcion,
    activo: r.Activo,
  };
}

/**
 * Crear un nuevo tipo de deducción
 */
export async function postTipoDeduccion(data: TipoDeduccion): Promise<TipoDeduccion> {
  const id = randomUUID();
  const r = await prisma.tipoDeducciones.create({
    data: {
      Id: id,
      Nombre: data.nombre,
      Descripcion: data.descripcion,
      Activo: data.activo ?? true,
      Adicionado_por: 'Sistema',
      Created_at: new Date(),
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
 * Actualizar un tipo de deducción existente
 */
export async function putTipoDeduccion(data: TipoDeduccion): Promise<TipoDeduccion> {
  const r = await prisma.tipoDeducciones.update({
    where: { Id: data.id! },
    data: {
      Nombre: data.nombre,
      Descripcion: data.descripcion,
      Activo: data.activo,
      Modificado_por: 'Sistema',
      Updated_at: new Date(),
    },
  });
  return {
    id: r.Id,
    nombre: r.Nombre,
    descripcion: r.Descripcion,
    activo: r.Activo,
  };
}
