"use server";

import { getPrivateInsumosBucketConfig, uploadBufferToS3 } from "@/lib/aws/s3";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { MovimientoParaFirma } from "../../../(protected)/inventario/insumos/types";
import { cantidadMovimientoLabel } from "../../../(protected)/inventario/insumos/utils";

/** Tamaño máximo permitido para la imagen de la firma (2 MB) */
const MAX_FIRMA_BYTES = 2 * 1024 * 1024;

function formatFecha(fecha: Date) {
  return new Intl.DateTimeFormat("es-HN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(fecha);
}

/**
 * Datos del movimiento asociado al enlace de firma. No requiere sesión:
 * el token del enlace es la credencial.
 */
export async function getMovimientoParaFirma(token: string): Promise<MovimientoParaFirma | null> {
  const movimiento = await prisma.movimientoInsumo.findUnique({
    where: { firmaToken: token },
    include: {
      insumo: {
        select: {
          nombre: true,
          unidad: { select: { nombre: true } },
          unidadEmpaque: { select: { nombre: true } },
        },
      },
      usuario: {
        select: {
          usuario: true,
          Empleados: { select: { nombre: true, apellido: true } },
        },
      },
      empleadoSolicitante: { select: { nombre: true, apellido: true } },
    },
  });

  if (!movimiento) return null;

  const expirado =
    !!movimiento.firmaTokenExpiraAt && movimiento.firmaTokenExpiraAt.getTime() < Date.now();

  return {
    id: movimiento.id,
    insumoNombre: movimiento.insumo.nombre,
    unidadNombre: movimiento.insumo.unidad.nombre,
    cantidad: movimiento.cantidad,
    cantidadLabel: cantidadMovimientoLabel(
      movimiento.cantidad,
      movimiento.insumo.unidad.nombre,
      movimiento.cantidadEmpaque,
      movimiento.insumo.unidadEmpaque?.nombre ?? null
    ),
    tipo: movimiento.tipo,
    fechaLabel: formatFecha(movimiento.fecha),
    solicitadoPor: movimiento.empleadoSolicitante
      ? `${movimiento.empleadoSolicitante.nombre} ${movimiento.empleadoSolicitante.apellido}`
      : "-",
    registradoPor: movimiento.usuario.Empleados
      ? `${movimiento.usuario.Empleados.nombre} ${movimiento.usuario.Empleados.apellido}`
      : movimiento.usuario.usuario,
    observaciones: movimiento.observaciones ?? "",
    estado: movimiento.firmaKey ? "FIRMADO" : expirado ? "EXPIRADO" : "PENDIENTE",
  };
}

/**
 * Guarda la firma en S3 (insumos/firmas) y la asocia al movimiento.
 * El enlace queda invalidado después de firmar.
 */
export async function guardarFirmaMovimiento(
  token: string,
  firmaBase64: string
): Promise<{ success: boolean; error?: string }> {
  const movimiento = await prisma.movimientoInsumo.findUnique({
    where: { firmaToken: token },
    select: { id: true, firmaKey: true, firmaTokenExpiraAt: true },
  });

  if (!movimiento) {
    return { success: false, error: "El enlace de firma no es válido" };
  }

  if (movimiento.firmaKey) {
    return { success: false, error: "Este movimiento ya fue firmado" };
  }

  if (movimiento.firmaTokenExpiraAt && movimiento.firmaTokenExpiraAt.getTime() < Date.now()) {
    return { success: false, error: "El enlace de firma expiró" };
  }

  const contenido = firmaBase64.replace(/^data:image\/png;base64,/, "");
  if (contenido === firmaBase64) {
    return { success: false, error: "La firma debe ser una imagen PNG" };
  }

  const buffer = Buffer.from(contenido, "base64");
  if (buffer.length === 0) {
    return { success: false, error: "La firma está vacía" };
  }

  if (buffer.length > MAX_FIRMA_BYTES) {
    return { success: false, error: "La firma es demasiado grande" };
  }

  try {
    const firmaKey = await uploadBufferToS3({
      key: `${movimiento.id}.png`,
      contentType: "image/png",
      body: buffer,
      config: getPrivateInsumosBucketConfig(),
    });

    await prisma.movimientoInsumo.update({
      where: { id: movimiento.id },
      data: {
        firmaKey,
        firmaFecha: new Date(),
        firmaToken: null,
        firmaTokenExpiraAt: null,
      },
    });

    revalidatePath("/inventario/insumos/movimientos");

    return { success: true };
  } catch (error) {
    console.error("Error al guardar la firma del movimiento:", error);
    return { success: false, error: "No se pudo guardar la firma. Intente nuevamente." };
  }
}
