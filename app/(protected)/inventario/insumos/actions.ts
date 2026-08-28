"use server";

import { getSession } from "@/auth";
import { prisma } from "@/lib/prisma";
import { randomBytes, randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import {
  Insumo,
  MovimientoInsumo,
  RegistrarMovimientoInput,
  RegistrarMovimientoResultado,
} from "./types";
import {
  cantidadMovimientoLabel,
  contenidoEmpaqueLabel,
  equivalenciaEmpaques,
  finDiaHn,
  formatFechaHn,
  inicioDiaHn,
} from "./utils";

/** Horas de vigencia del enlace de firma */
const HORAS_VIGENCIA_FIRMA = 48;

/** Fechas de los movimientos siempre en hora de Honduras (UTC-6) */
const formatFecha = formatFechaHn;

/**
 * Arma el enlace público que se le comparte al empleado para que firme
 * desde el teléfono.
 */
export async function buildFirmaUrl(token: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (base) return `${base}/firma-insumo/${token}`;

  const encabezados = headers();
  const host = encabezados.get("x-forwarded-host") ?? encabezados.get("host");
  const protocolo = encabezados.get("x-forwarded-proto") ?? "https";

  return host ? `${protocolo}://${host}/firma-insumo/${token}` : `/firma-insumo/${token}`;
}

type MovimientoRecord = {
  id: string;
  insumoId: string;
  tipo: "ENTRADA" | "SALIDA";
  cantidad: number;
  cantidadEmpaque: number | null;
  stockResultante: number;
  fecha: Date;
  observaciones: string | null;
  empleadoSolicitanteId: string | null;
  firmaToken: string | null;
  firmaTokenExpiraAt: Date | null;
  firmaKey: string | null;
  firmaFecha: Date | null;
  insumo: {
    nombre: string;
    unidad: { nombre: string };
    unidadEmpaque: { nombre: string } | null;
  };
  usuario: { usuario: string; Empleados: { nombre: string; apellido: string } | null };
  empleadoSolicitante: { nombre: string; apellido: string } | null;
};

const movimientoInclude = {
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
} as const;

async function mapMovimiento(r: MovimientoRecord): Promise<MovimientoInsumo> {
  const firmaPendiente =
    !r.firmaKey &&
    !!r.firmaToken &&
    (!r.firmaTokenExpiraAt || r.firmaTokenExpiraAt.getTime() > Date.now());

  const unidadEmpaqueNombre = r.insumo.unidadEmpaque?.nombre ?? null;

  return {
    id: r.id,
    insumoId: r.insumoId,
    insumoNombre: r.insumo.nombre,
    unidadNombre: r.insumo.unidad.nombre,
    unidadEmpaqueNombre,
    tipo: r.tipo,
    cantidad: r.cantidad,
    cantidadEmpaque: r.cantidadEmpaque,
    cantidadLabel: cantidadMovimientoLabel(
      r.cantidad,
      r.insumo.unidad.nombre,
      r.cantidadEmpaque,
      unidadEmpaqueNombre
    ),
    stockResultante: r.stockResultante,
    fecha: r.fecha.toISOString(),
    fechaLabel: formatFecha(r.fecha),
    observaciones: r.observaciones ?? "",
    registradoPor: r.usuario.Empleados
      ? `${r.usuario.Empleados.nombre} ${r.usuario.Empleados.apellido}`
      : r.usuario.usuario,
    empleadoSolicitanteId: r.empleadoSolicitanteId,
    solicitadoPor: r.empleadoSolicitante
      ? `${r.empleadoSolicitante.nombre} ${r.empleadoSolicitante.apellido}`
      : "-",
    firmado: !!r.firmaKey,
    firmaFechaLabel: r.firmaFecha ? formatFecha(r.firmaFecha) : null,
    firmaUrl: firmaPendiente ? await buildFirmaUrl(r.firmaToken!) : null,
  };
}

function mapInsumo(r: {
  id: string;
  nombre: string;
  descripcion: string | null;
  unidadId: string;
  unidadEmpaqueId: string | null;
  cantidadPorEmpaque: number;
  stockActual: number;
  stockMinimo: number;
  activo: boolean;
  unidad?: { nombre: string; abreviatura: string | null } | null;
  unidadEmpaque?: { nombre: string } | null;
}): Insumo {
  const unidadNombre = r.unidad?.nombre ?? "";
  const unidadEmpaqueNombre = r.unidadEmpaque?.nombre ?? null;

  return {
    id: r.id,
    nombre: r.nombre,
    descripcion: r.descripcion ?? "",
    unidadId: r.unidadId,
    unidadEmpaqueId: r.unidadEmpaqueId,
    cantidadPorEmpaque: r.cantidadPorEmpaque,
    stockActual: r.stockActual,
    stockMinimo: r.stockMinimo,
    activo: r.activo,
    unidadNombre,
    unidadAbreviatura: r.unidad?.abreviatura ?? "",
    unidadEmpaqueNombre,
    bajoStock: r.stockActual <= r.stockMinimo,
    contenidoLabel: contenidoEmpaqueLabel(
      r.cantidadPorEmpaque,
      unidadNombre,
      unidadEmpaqueNombre
    ),
    equivalenciaStock: equivalenciaEmpaques(
      r.stockActual,
      r.cantidadPorEmpaque,
      unidadNombre,
      unidadEmpaqueNombre
    ),
  };
}

const insumoInclude = {
  unidad: { select: { nombre: true, abreviatura: true } },
  unidadEmpaque: { select: { nombre: true } },
} as const;

/**
 * Obtener todos los insumos
 */
export async function getInsumos(): Promise<Insumo[]> {
  const records = await prisma.insumo.findMany({
    include: insumoInclude,
    orderBy: { nombre: "asc" },
  });
  return records.map(mapInsumo);
}

/**
 * Obtener los insumos activos
 */
export async function getInsumosActivos(): Promise<Insumo[]> {
  const records = await prisma.insumo.findMany({
    where: { activo: true },
    include: insumoInclude,
    orderBy: { nombre: "asc" },
  });
  return records.map(mapInsumo);
}

/**
 * Obtener un insumo por ID
 */
export async function getInsumoById(id: string): Promise<Insumo | null> {
  const r = await prisma.insumo.findUnique({
    where: { id },
    include: insumoInclude,
  });
  if (!r) return null;
  return mapInsumo(r);
}

/**
 * Crear un nuevo insumo. Si se indica un stock inicial se registra como
 * una entrada para que quede en el historial.
 */
export async function postInsumo(
  data: Insumo & { stockInicial?: number; stockInicialEnEmpaques?: boolean }
): Promise<Insumo> {
  const session = await getSession();
  if (!session?.IdUser) {
    throw new Error("No autorizado");
  }

  const unidadEmpaqueId = data.unidadEmpaqueId || null;
  const cantidadPorEmpaque = unidadEmpaqueId ? Math.max(1, data.cantidadPorEmpaque) : 1;

  const tecleado = data.stockInicial && data.stockInicial > 0 ? data.stockInicial : 0;
  const enEmpaques = !!data.stockInicialEnEmpaques && !!unidadEmpaqueId;
  const stockInicial = enEmpaques ? tecleado * cantidadPorEmpaque : tecleado;

  const id = randomUUID();

  const r = await prisma.$transaction(async (tx) => {
    const insumo = await tx.insumo.create({
      data: {
        id,
        nombre: data.nombre,
        descripcion: data.descripcion || null,
        unidadId: data.unidadId,
        unidadEmpaqueId,
        cantidadPorEmpaque,
        stockActual: stockInicial,
        stockMinimo: data.stockMinimo,
        activo: data.activo ?? true,
      },
      include: insumoInclude,
    });

    if (stockInicial > 0) {
      await tx.movimientoInsumo.create({
        data: {
          id: randomUUID(),
          insumoId: insumo.id,
          tipo: "ENTRADA",
          cantidad: stockInicial,
          cantidadEmpaque: enEmpaques ? tecleado : null,
          stockResultante: stockInicial,
          fecha: new Date(),
          observaciones: "Stock inicial",
          usuarioId: session.IdUser,
        },
      });
    }

    return insumo;
  });

  revalidatePath("/inventario/insumos");

  return mapInsumo(r);
}

/**
 * Actualizar un insumo existente. El stock no se modifica aquí, solo
 * mediante entradas y salidas.
 */
export async function putInsumo(data: Insumo): Promise<Insumo> {
  const unidadEmpaqueId = data.unidadEmpaqueId || null;

  const r = await prisma.insumo.update({
    where: { id: data.id! },
    data: {
      nombre: data.nombre,
      descripcion: data.descripcion || null,
      unidadId: data.unidadId,
      unidadEmpaqueId,
      cantidadPorEmpaque: unidadEmpaqueId ? Math.max(1, data.cantidadPorEmpaque) : 1,
      stockMinimo: data.stockMinimo,
      activo: data.activo,
    },
    include: insumoInclude,
  });

  revalidatePath("/inventario/insumos");
  revalidatePath(`/inventario/insumos/${data.id}`);

  return mapInsumo(r);
}

/**
 * Registrar una entrada o salida de stock. La cantidad puede venir en
 * empaques (2 cajas de 6 = 12 unidades); el stock siempre se lleva en
 * unidades de consumo y las salidas se restan automáticamente.
 */
export async function registrarMovimiento(
  input: RegistrarMovimientoInput
): Promise<RegistrarMovimientoResultado> {
  const session = await getSession();
  if (!session?.IdUser) {
    return { success: false, error: "No autorizado" };
  }

  if (!Number.isInteger(input.cantidad) || input.cantidad <= 0) {
    return { success: false, error: "La cantidad debe ser mayor a cero" };
  }

  if (input.tipo === "SALIDA" && !input.empleadoSolicitanteId) {
    return { success: false, error: "Debe indicar el empleado que solicitó el insumo" };
  }

  const movimientoId = randomUUID();
  const requiereFirma = input.tipo === "SALIDA";
  const firmaToken = requiereFirma ? randomBytes(24).toString("hex") : null;
  const firmaTokenExpiraAt = requiereFirma
    ? new Date(Date.now() + HORAS_VIGENCIA_FIRMA * 60 * 60 * 1000)
    : null;

  try {
    const stockResultante = await prisma.$transaction(async (tx) => {
      const insumo = await tx.insumo.findUnique({ where: { id: input.insumoId } });
      if (!insumo) {
        throw new Error("El insumo no existe");
      }

      if (input.enEmpaques && !insumo.unidadEmpaqueId) {
        throw new Error("El insumo no tiene una unidad de empaque configurada");
      }

      // Conversión a unidades de consumo: 2 cajas de 6 = 12 unidades
      const cantidadBase = input.enEmpaques
        ? input.cantidad * insumo.cantidadPorEmpaque
        : input.cantidad;

      const nuevoStock =
        input.tipo === "ENTRADA"
          ? insumo.stockActual + cantidadBase
          : insumo.stockActual - cantidadBase;

      if (nuevoStock < 0) {
        throw new Error(`No hay stock suficiente. Disponible: ${insumo.stockActual}`);
      }

      await tx.insumo.update({
        where: { id: insumo.id },
        data: { stockActual: nuevoStock },
      });

      await tx.movimientoInsumo.create({
        data: {
          id: movimientoId,
          insumoId: insumo.id,
          tipo: input.tipo,
          cantidad: cantidadBase,
          cantidadEmpaque: input.enEmpaques ? input.cantidad : null,
          stockResultante: nuevoStock,
          fecha: new Date(),
          observaciones: input.observaciones || null,
          usuarioId: session.IdUser,
          empleadoSolicitanteId: input.empleadoSolicitanteId || null,
          firmaToken,
          firmaTokenExpiraAt,
        },
      });

      return nuevoStock;
    });

    revalidatePath("/inventario/insumos");
    revalidatePath(`/inventario/insumos/${input.insumoId}`);
    revalidatePath("/inventario/insumos/movimientos");

    return {
      success: true,
      movimientoId,
      stockResultante,
      firmaUrl: firmaToken ? await buildFirmaUrl(firmaToken) : null,
    };
  } catch (error) {
    console.error("Error al registrar el movimiento de insumo:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al registrar el movimiento",
    };
  }
}

/**
 * Historial de movimientos de un insumo
 */
export async function getMovimientosByInsumo(insumoId: string): Promise<MovimientoInsumo[]> {
  const records = await prisma.movimientoInsumo.findMany({
    where: { insumoId },
    include: movimientoInclude,
    orderBy: { fecha: "desc" },
  });

  return Promise.all(records.map(mapMovimiento));
}

/**
 * Historial general de entradas y salidas
 */
export async function getMovimientos(filtros?: {
  insumoId?: string;
  tipo?: "ENTRADA" | "SALIDA";
  desde?: string;
  hasta?: string;
}): Promise<MovimientoInsumo[]> {
  const where: {
    insumoId?: string;
    tipo?: "ENTRADA" | "SALIDA";
    fecha?: { gte?: Date; lte?: Date };
  } = {};

  if (filtros?.insumoId) where.insumoId = filtros.insumoId;
  if (filtros?.tipo) where.tipo = filtros.tipo;
  if (filtros?.desde || filtros?.hasta) {
    where.fecha = {};
    if (filtros.desde) where.fecha.gte = inicioDiaHn(filtros.desde);
    if (filtros.hasta) where.fecha.lte = finDiaHn(filtros.hasta);
  }

  const records = await prisma.movimientoInsumo.findMany({
    where,
    include: movimientoInclude,
    orderBy: { fecha: "desc" },
    take: 500,
  });

  return Promise.all(records.map(mapMovimiento));
}

/**
 * Vuelve a generar el enlace de firma de un movimiento (por ejemplo cuando
 * el anterior expiró o el empleado nunca lo abrió).
 */
export async function regenerarEnlaceFirma(
  movimientoId: string
): Promise<{ success: boolean; error?: string; firmaUrl?: string }> {
  const session = await getSession();
  if (!session?.IdUser) {
    return { success: false, error: "No autorizado" };
  }

  const movimiento = await prisma.movimientoInsumo.findUnique({
    where: { id: movimientoId },
    select: { id: true, firmaKey: true },
  });

  if (!movimiento) {
    return { success: false, error: "El movimiento no existe" };
  }

  if (movimiento.firmaKey) {
    return { success: false, error: "El movimiento ya fue firmado" };
  }

  const firmaToken = randomBytes(24).toString("hex");

  await prisma.movimientoInsumo.update({
    where: { id: movimientoId },
    data: {
      firmaToken,
      firmaTokenExpiraAt: new Date(Date.now() + HORAS_VIGENCIA_FIRMA * 60 * 60 * 1000),
    },
  });

  revalidatePath("/inventario/insumos/movimientos");

  return { success: true, firmaUrl: await buildFirmaUrl(firmaToken) };
}
