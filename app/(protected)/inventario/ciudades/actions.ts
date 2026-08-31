"use server";

import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";

export type CiudadFormData = {
  id?: string;
  nombre: string;
  activo?: boolean;
};

export async function getCiudadesAdmin(): Promise<Required<CiudadFormData>[]> {
  const records = await prisma.ciudad.findMany({ orderBy: { nombre: "asc" } });
  return records.map((r) => ({ id: r.id, nombre: r.nombre, activo: r.activo }));
}

export async function getCiudadById(id: string): Promise<Required<CiudadFormData> | null> {
  const r = await prisma.ciudad.findUnique({ where: { id } });
  if (!r) return null;
  return { id: r.id, nombre: r.nombre, activo: r.activo };
}

export async function postCiudad(data: CiudadFormData) {
  await prisma.ciudad.create({
    data: { id: randomUUID(), nombre: data.nombre, activo: data.activo ?? true },
  });

  revalidatePath("/inventario/ciudades");
}

export async function putCiudad(data: CiudadFormData) {
  await prisma.ciudad.update({
    where: { id: data.id! },
    data: { nombre: data.nombre, activo: data.activo },
  });

  revalidatePath("/inventario/ciudades");
}
