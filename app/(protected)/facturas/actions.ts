"use server";

import { getSession } from "@/auth";
import { uploadBufferToS3 } from "@/lib/aws/s3";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { EventoFactura, EventoFacturaFormInput } from "./types";

type FiltrosFactura = {
  desde?: string;
  hasta?: string;
  empleadoId?: string;
};

export async function getEventosFactura(filtros?: FiltrosFactura): Promise<EventoFactura[]> {
  const session = await getSession();
  if (!session?.IdEmpleado) return [];

  const puedeVerTodas = session.Permiso.includes("ver_facturas_jefe");

  const where: { empleadoId?: string; fechaEvento?: { gte?: Date; lte?: Date } } = {};

  if (!puedeVerTodas) where.empleadoId = session.IdEmpleado;
  else if (filtros?.empleadoId) where.empleadoId = filtros.empleadoId;

  if (filtros?.desde || filtros?.hasta) {
    where.fechaEvento = {};
    if (filtros.desde) where.fechaEvento.gte = new Date(`${filtros.desde}T00:00:00`);
    if (filtros.hasta) where.fechaEvento.lte = new Date(`${filtros.hasta}T23:59:59`);
  }

  const rows = await prisma.eventoFactura.findMany({
    where,
    orderBy: { fechaEvento: "desc" },
    include: {
      empleado: true,
      nota: { select: { id: true, titulo: true } },
      archivos: {
        select: { id: true, archivoNombre: true, archivoTipo: true, archivoUrl: true, archivoKey: true },
        orderBy: { createAt: "desc" },
      },
      _count: { select: { archivos: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    empleadoId: row.empleadoId,
    empleadoNombre: `${row.empleado.nombre} ${row.empleado.apellido}`,
    notaId: row.notaId,
    notaTitulo: row.nota?.titulo ?? null,
    titulo: row.titulo,
    descripcion: row.descripcion,
    fechaEvento: row.fechaEvento.toISOString(),
    totalFacturas: row._count.archivos,
    archivos: row.archivos,
    createAt: row.createAt.toISOString(),
  }));
}

export async function getEventoFacturaById(id: string): Promise<EventoFactura | null> {
  const session = await getSession();
  if (!session?.IdEmpleado) return null;

  const puedeVerTodas = session.Permiso.includes("ver_facturas_jefe");

  const row = await prisma.eventoFactura.findUnique({
    where: { id },
    include: {
      empleado: true,
      nota: { select: { id: true, titulo: true } },
      archivos: {
        select: { id: true, archivoNombre: true, archivoTipo: true, archivoUrl: true, archivoKey: true },
        orderBy: { createAt: "desc" },
      },
      _count: { select: { archivos: true } },
    },
  });

  if (!row) return null;
  if (!puedeVerTodas && row.empleadoId !== session.IdEmpleado) return null;

  return {
    id: row.id,
    empleadoId: row.empleadoId,
    empleadoNombre: `${row.empleado.nombre} ${row.empleado.apellido}`,
    notaId: row.notaId,
    notaTitulo: row.nota?.titulo ?? null,
    titulo: row.titulo,
    descripcion: row.descripcion,
    fechaEvento: row.fechaEvento.toISOString(),
    totalFacturas: row._count.archivos,
    archivos: row.archivos,
    createAt: row.createAt.toISOString(),
  };
}

export async function getNotasEmpleadoActual() {
  const session = await getSession();
  if (!session?.IdEmpleado) return [];

  return prisma.nota.findMany({
    where: { creadorEmpleadoId: session.IdEmpleado },
    orderBy: { createAt: "desc" },
    select: { id: true, titulo: true },
  });
}

export async function getEmpleadosParaFiltro() {
  const session = await getSession();
  if (!session?.Permiso.includes("ver_facturas_jefe")) return [];

  return prisma.empleados.findMany({
    where: { activo: true },
    orderBy: [{ nombre: "asc" }, { apellido: "asc" }],
    select: { id: true, nombre: true, apellido: true },
  });
}

export async function postEventoFactura(data: EventoFacturaFormInput) {
  const session = await getSession();
  if (!session?.IdEmpleado) throw new Error("Sesión inválida");
  if (!session.Permiso.includes("crear_facturas")) throw new Error("No tienes permiso para crear facturas");
  if (!data.files?.length) throw new Error("Debes adjuntar al menos una factura");

  const eventoId = randomUUID();
  const archivos = await Promise.all(
    data.files.map(async (file) => {
      const buffer = Buffer.from(file.fileBase64, "base64");
      const fileId = randomUUID();
      const safeName = file.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
      const key = `${eventoId}/${fileId.slice(0, 4)}-${safeName}`;
      const objectKey = await uploadBufferToS3({ key, contentType: file.fileType, body: buffer });

      return {
        id: fileId,
        archivoKey: objectKey,
        archivoNombre: file.fileName,
        archivoTipo: file.fileType,
        archivoUrl: objectKey,
      };
    })
  );

  await prisma.eventoFactura.create({
    data: {
      id: eventoId,
      empleadoId: session.IdEmpleado,
      notaId: data.notaId || null,
      titulo: data.titulo,
      descripcion: data.descripcion || null,
      fechaEvento: new Date(data.fechaEvento),
      archivos: {
        createMany: {
          data: archivos,
        },
      },
    },
  });

  revalidatePath("/facturas");
}
