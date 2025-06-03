"use server";

import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { TipoSeccion } from './types';

/**
 * Obtener todos los tipos de sección
 */
export async function getTipoSeccion(): Promise<TipoSeccion[]> {
  const records = await prisma.tipoSeccion.findMany({
    orderBy: { Nombre: 'asc' },
  });
  return records.map(r => ({
    id: r.Id,
    nombre: r.Nombre,
    descripcion: r.Descripcion,
    activo: r.Activo,
  }));
}

/**
 * Obtener tipos de sección activos
 */
export async function getTipoSeccionActivas(): Promise<TipoSeccion[]> {
  const records = await prisma.tipoSeccion.findMany({
    where: { Activo: true },
    orderBy: { Nombre: 'asc' },
  });
  return records.map(r => ({
    id: r.Id,
    nombre: r.Nombre,
    descripcion: r.Descripcion,
    activo: r.Activo,
  }));
}

/**
 * Obtener un tipo de sección por ID
 */
export async function getTipoSeccionById(id: string): Promise<TipoSeccion | null> {
  const r = await prisma.tipoSeccion.findUnique({ where: { Id: id } });
  if (!r) return null;
  return {
    id: r.Id,
    nombre: r.Nombre,
    descripcion: r.Descripcion,
    activo: r.Activo,
  };
}

/**
 * Crear un nuevo tipo de sección
 */
export async function postTipoSeccion(data: TipoSeccion): Promise<TipoSeccion> {
  const id = randomUUID();
  const r = await prisma.tipoSeccion.create({
    data: {
      Id: id,
      Nombre: data.nombre,
      Descripcion: data.descripcion,
      Activo: data.activo ?? true
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
 * Actualizar un tipo de sección existente
 */
export async function putTipoSeccion(data: TipoSeccion): Promise<TipoSeccion> {
  const r = await prisma.tipoSeccion.update({
    where: { Id: data.id! },
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
