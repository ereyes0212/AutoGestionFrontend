"use server";

import { getSession } from "@/auth";
import { uploadBufferToS3 } from "@/lib/aws/s3";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { EventoFactura, EventoFacturaFormInput, FacturaFilePayload } from "./types";

type FiltrosFactura = {
  desde?: string;
  hasta?: string;
  empleadoId?: string;
};

function formatFecha(fechaIso: string) {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(fechaIso));
}

async function uploadFileWithGeneratedKey(file: FacturaFilePayload, eventoId: string) {
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
}

async function mapFiles(files: EventoFacturaFormInput["files"], eventoId: string) {
  return Promise.all(files.map((file) => uploadFileWithGeneratedKey(file, eventoId)));
}

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
    fechaEventoLabel: formatFecha(row.fechaEvento.toISOString()),
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
    fechaEventoLabel: formatFecha(row.fechaEvento.toISOString()),
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
  const archivos = await mapFiles(data.files, eventoId);

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

export async function updateEventoFactura(id: string, data: EventoFacturaFormInput) {
  const session = await getSession();
  if (!session?.IdEmpleado) throw new Error("Sesión inválida");
  if (!session.Permiso.includes("crear_facturas")) throw new Error("No tienes permiso para actualizar facturas");

  const evento = await prisma.eventoFactura.findUnique({ where: { id }, select: { id: true, empleadoId: true } });
  if (!evento) throw new Error("Evento no encontrado");

  const puedeVerTodas = session.Permiso.includes("ver_facturas_jefe");
  if (!puedeVerTodas && evento.empleadoId !== session.IdEmpleado) {
    throw new Error("No tienes permiso para editar este evento");
  }

  const archivos = data.files?.length ? await mapFiles(data.files, id) : [];

  if (data.replacements?.length) {
    const actuales = await prisma.eventoFacturaArchivo.findMany({
      where: { eventoFacturaId: id },
      select: { id: true, archivoKey: true },
    });
    const keyById = new Map(actuales.map((a) => [a.id, a.archivoKey]));

    for (const replacement of data.replacements) {
      const currentKey = keyById.get(replacement.archivoId);
      if (!currentKey) continue;

      await uploadBufferToS3({
        key: currentKey,
        contentType: replacement.file.fileType,
        body: Buffer.from(replacement.file.fileBase64, "base64"),
      });

      await prisma.eventoFacturaArchivo.update({
        where: { id: replacement.archivoId },
        data: {
          archivoNombre: replacement.file.fileName,
          archivoTipo: replacement.file.fileType,
        },
      });
    }
  }

  await prisma.eventoFactura.update({
    where: { id },
    data: {
      notaId: data.notaId || null,
      titulo: data.titulo,
      descripcion: data.descripcion || null,
      fechaEvento: new Date(data.fechaEvento),
      ...(archivos.length
        ? {
            archivos: {
              createMany: {
                data: archivos,
              },
            },
          }
        : {}),
    },
  });

  revalidatePath("/facturas");
  revalidatePath(`/facturas/${id}/detalle`);
  revalidatePath(`/facturas/${id}/editar`);
}
