"use server";

import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { AjusteTipo } from './types';

/**
 * Obtener todos los ajustes (deducciones y bonos)
 */
export async function getAjustes(): Promise<AjusteTipo[]> {
  const records = await prisma.ajusteTipo.findMany({
    orderBy: { nombre: 'asc' },
  });
  return records.map(r => ({
    id: r.id,
    nombre: r.nombre,
    descripcion: r.descripcion ?? '',
    categoria: r.categoria as 'DEDUCCION' | 'BONO',
    montoPorDefecto: r.montoPorDefecto.toNumber(),
    activo: r.activo,
  }));
}

/**
 * Obtener solo los ajustes activos
 */
export async function getAjustesActivos(): Promise<AjusteTipo[]> {
  const records = await prisma.ajusteTipo.findMany({
    where: { activo: true },
    orderBy: { nombre: 'asc' },
  });
  return records.map(r => ({
    id: r.id,
    nombre: r.nombre,
    descripcion: r.descripcion ?? '',
    categoria: r.categoria as 'DEDUCCION' | 'BONO',
    montoPorDefecto: r.montoPorDefecto.toNumber(),
    activo: r.activo,
  }));
}

/**
 * Obtener un ajuste por ID
 */
export async function getAjusteById(id: string): Promise<AjusteTipo | null> {
  const r = await prisma.ajusteTipo.findUnique({ where: { id } });
  if (!r) return null;
  return {
    id: r.id,
    nombre: r.nombre,
    descripcion: r.descripcion ?? '',
    categoria: r.categoria as 'DEDUCCION' | 'BONO',
    montoPorDefecto: r.montoPorDefecto.toNumber(),
    activo: r.activo,
  };
}

/**
 * Crear un nuevo ajuste (deducción o bono)
 */
export async function postAjuste(data: AjusteTipo): Promise<AjusteTipo> {
  const id = randomUUID();
  const r = await prisma.ajusteTipo.create({
    data: {
      id,
      nombre: data.nombre,
      descripcion: data.descripcion,
      categoria: data.categoria,
      montoPorDefecto: data.montoPorDefecto,
      activo: data.activo ?? true,
    },
  });
  return {
    id: r.id,
    nombre: r.nombre,
    descripcion: r.descripcion ?? '',
    categoria: r.categoria as 'DEDUCCION' | 'BONO',
    montoPorDefecto: r.montoPorDefecto.toNumber(),
    activo: r.activo,
  };
}

/**
 * Actualizar un ajuste existente
 */
export async function putAjuste(data: AjusteTipo): Promise<AjusteTipo> {
  const r = await prisma.ajusteTipo.update({
    where: { id: data.id! },
    data: {
      nombre: data.nombre,
      descripcion: data.descripcion,
      categoria: data.categoria,
      montoPorDefecto: data.montoPorDefecto,
      activo: data.activo,
    },
  });
  return {
    id: r.id,
    nombre: r.nombre,
    descripcion: r.descripcion ?? '',
    categoria: r.categoria as 'DEDUCCION' | 'BONO',
    montoPorDefecto: r.montoPorDefecto.toNumber(),
    activo: r.activo,
  };
}
