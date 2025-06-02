"use server";

import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { ConfigItem, OutputConfig } from './type';

/**
 * Obtener todas las configuraciones de aprobación
 */
export async function getConfiguracionAprobacion(): Promise<ConfigItem[]> {
  const records = await prisma.configuracionAprobacion.findMany({
    include: { Puesto: true },
    orderBy: { nivel: 'asc' },
  });
  return records.map(r => ({
    id: r.Id,
    puesto_id: r.puesto_id ?? "",
    descripcion: r.Descripcion,
    tipo: r.Tipo as "Fijo" | "Dinamico",
    nivel: r.nivel,
    activo: r.Activo,
  }));
}

/**
 * Reemplaza todas las configuraciones de aprobación: elimina existentes y crea nuevas.
 */
export async function postConfiguracion(configs: OutputConfig[]): Promise<ConfigItem[]> {
  // 1️⃣ Eliminar todas las configuraciones existentes
  await prisma.configuracionAprobacion.deleteMany();

  // 2️⃣ Preparar datos con IDs y metadata
  const now = new Date();
  const data = configs.map(c => ({
    Id: randomUUID(),
    puesto_id: c.tipo === 'Fijo' && c.puesto_id ? c.puesto_id : null,
    Descripcion: c.descripcion,
    Tipo: c.tipo,
    nivel: c.nivel,
    Activo: true,
    Created_at: now,
    Updated_at: now,
  }));

  // 3️⃣ Crear nuevas configuraciones en bloque
  await prisma.configuracionAprobacion.createMany({ data });

  // 4️⃣ Retornar la lista completa actualizada
  return getConfiguracionAprobacion();
}
