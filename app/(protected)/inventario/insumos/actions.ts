"use server";

import { getSession } from "@/auth";
import { prisma } from "@/lib/prisma";
import { randomBytes, randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import {
  CancelarMovimientoResultado,
  Ciudad,
  ExistenciaInsumoInput,
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

/**
 * Ciudades donde hay bodega
 */
export async function getCiudades(soloActivas = true): Promise<Ciudad[]> {
  const records = await prisma.ciudad.findMany({
    where: soloActivas ? { activo: true } : undefined,
    orderBy: { nombre: "asc" },
  });

  return records.map((r) => ({ id: r.id, nombre: r.nombre, activo: r.activo }));
}

type MovimientoRecord = {
  id: string;
  insumoId: string;
  ciudadId: string;
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
  cancelado: boolean;
  canceladoAt: Date | null;
  motivoCancelacion: string | null;
  insumo: {
    nombre: string;
    unidad: { nombre: string };
    unidadEmpaque: { nombre: string } | null;
  };
  ciudad: { nombre: string };
  pedido: { numero: number } | null;
  usuario: { usuario: string; Empleados: { nombre: string; apellido: string } | null };
  canceladoPor: { usuario: string; Empleados: { nombre: string; apellido: string } | null } | null;
  empleadoSolicitante: { nombre: string; apellido: string } | null;
};

function nombreUsuario(
  usuario: { usuario: string; Empleados: { nombre: string; apellido: string } | null } | null
) {
  if (!usuario) return null;
  return usuario.Empleados
    ? `${usuario.Empleados.nombre} ${usuario.Empleados.apellido}`
    : usuario.usuario;
}

const movimientoInclude = {
  insumo: {
    select: {
      nombre: true,
      unidad: { select: { nombre: true } },
      unidadEmpaque: { select: { nombre: true } },
    },
  },
  ciudad: { select: { nombre: true } },
  pedido: { select: { numero: true } },
  usuario: {
    select: {
      usuario: true,
      Empleados: { select: { nombre: true, apellido: true } },
    },
  },
  canceladoPor: {
    select: {
      usuario: true,
      Empleados: { select: { nombre: true, apellido: true } },
    },
  },
  empleadoSolicitante: { select: { nombre: true, apellido: true } },
} as const;

async function mapMovimiento(r: MovimientoRecord): Promise<MovimientoInsumo> {
  const firmaPendiente =
    !r.cancelado &&
    !r.firmaKey &&
    !!r.firmaToken &&
    (!r.firmaTokenExpiraAt || r.firmaTokenExpiraAt.getTime() > Date.now());

  const unidadEmpaqueNombre = r.insumo.unidadEmpaque?.nombre ?? null;

  return {
    id: r.id,
    insumoId: r.insumoId,
    insumoNombre: r.insumo.nombre,
    ciudadId: r.ciudadId,
    ciudadNombre: r.ciudad.nombre,
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
    registradoPor: nombreUsuario(r.usuario) ?? "-",
    empleadoSolicitanteId: r.empleadoSolicitanteId,
    solicitadoPor: r.empleadoSolicitante
      ? `${r.empleadoSolicitante.nombre} ${r.empleadoSolicitante.apellido}`
      : "-",
    firmado: !!r.firmaKey,
    firmaFechaLabel: r.firmaFecha ? formatFecha(r.firmaFecha) : null,
    firmaUrl: firmaPendiente ? await buildFirmaUrl(r.firmaToken!) : null,
    cancelado: r.cancelado,
    canceladoPor: nombreUsuario(r.canceladoPor),
    canceladoFechaLabel: r.canceladoAt ? formatFecha(r.canceladoAt) : null,
    motivoCancelacion: r.motivoCancelacion ?? "",
    pedidoNumero: r.pedido?.numero ?? null,
  };
}

const insumoInclude = {
  unidad: { select: { nombre: true, abreviatura: true } },
  unidadEmpaque: { select: { nombre: true } },
  existencias: { include: { ciudad: { select: { nombre: true } } } },
} as const;

type InsumoRecord = {
  id: string;
  nombre: string;
  descripcion: string | null;
  unidadId: string;
  unidadEmpaqueId: string | null;
  cantidadPorEmpaque: number;
  activo: boolean;
  unidad: { nombre: string; abreviatura: string | null };
  unidadEmpaque: { nombre: string } | null;
  existencias: {
    ciudadId: string;
    stockActual: number;
    stockMinimo: number;
    ciudad: { nombre: string };
  }[];
};

/**
 * @param ciudadId cuando viene, el stock mostrado es el de esa ciudad;
 * si no, se consolidan todas las bodegas.
 */
function mapInsumo(r: InsumoRecord, ciudadId?: string): Insumo {
  const unidadNombre = r.unidad.nombre;
  const unidadEmpaqueNombre = r.unidadEmpaque?.nombre ?? null;

  const existencias = r.existencias
    .map((e) => ({
      ciudadId: e.ciudadId,
      ciudadNombre: e.ciudad.nombre,
      stockActual: e.stockActual,
      stockMinimo: e.stockMinimo,
      bajoStock: e.stockActual <= e.stockMinimo,
      equivalenciaStock: equivalenciaEmpaques(
        e.stockActual,
        r.cantidadPorEmpaque,
        unidadNombre,
        unidadEmpaqueNombre
      ),
    }))
    .sort((a, b) => a.ciudadNombre.localeCompare(b.ciudadNombre));

  const alcance = ciudadId ? existencias.filter((e) => e.ciudadId === ciudadId) : existencias;

  const stockActual = alcance.reduce((suma, e) => suma + e.stockActual, 0);
  const stockMinimo = alcance.reduce((suma, e) => suma + e.stockMinimo, 0);

  return {
    id: r.id,
    nombre: r.nombre,
    descripcion: r.descripcion ?? "",
    unidadId: r.unidadId,
    unidadEmpaqueId: r.unidadEmpaqueId,
    cantidadPorEmpaque: r.cantidadPorEmpaque,
    activo: r.activo,
    unidadNombre,
    unidadAbreviatura: r.unidad.abreviatura ?? "",
    unidadEmpaqueNombre,
    contenidoLabel: contenidoEmpaqueLabel(
      r.cantidadPorEmpaque,
      unidadNombre,
      unidadEmpaqueNombre
    ),
    existencias,
    stockActual,
    stockMinimo,
    // Consolidado: alcanza con que una bodega esté baja para encender la alerta
    bajoStock: alcance.some((e) => e.bajoStock),
    equivalenciaStock: equivalenciaEmpaques(
      stockActual,
      r.cantidadPorEmpaque,
      unidadNombre,
      unidadEmpaqueNombre
    ),
  };
}

/**
 * Obtener todos los insumos
 */
export async function getInsumos(ciudadId?: string): Promise<Insumo[]> {
  const records = await prisma.insumo.findMany({
    include: insumoInclude,
    orderBy: { nombre: "asc" },
  });
  return records.map((r) => mapInsumo(r, ciudadId));
}

/**
 * Obtener los insumos activos
 */
export async function getInsumosActivos(ciudadId?: string): Promise<Insumo[]> {
  const records = await prisma.insumo.findMany({
    where: { activo: true },
    include: insumoInclude,
    orderBy: { nombre: "asc" },
  });
  return records.map((r) => mapInsumo(r, ciudadId));
}

/**
 * Obtener un insumo por ID
 */
export async function getInsumoById(id: string, ciudadId?: string): Promise<Insumo | null> {
  const r = await prisma.insumo.findUnique({
    where: { id },
    include: insumoInclude,
  });
  if (!r) return null;
  return mapInsumo(r, ciudadId);
}

/**
 * Crear un insumo con sus existencias por ciudad. El stock inicial de cada
 * ciudad se registra como entrada para que quede en el historial.
 */
export async function postInsumo(
  data: Omit<Insumo, "existencias" | "stockActual" | "stockMinimo" | "bajoStock"> & {
    existencias: ExistenciaInsumoInput[];
  }
): Promise<Insumo> {
  const session = await getSession();
  if (!session?.IdUser) {
    throw new Error("No autorizado");
  }

  const unidadEmpaqueId = data.unidadEmpaqueId || null;
  const cantidadPorEmpaque = unidadEmpaqueId ? Math.max(1, data.cantidadPorEmpaque) : 1;
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
        activo: data.activo ?? true,
      },
    });

    for (const existencia of data.existencias) {
      const tecleado =
        existencia.stockInicial && existencia.stockInicial > 0 ? existencia.stockInicial : 0;
      const enEmpaques = !!existencia.stockInicialEnEmpaques && !!unidadEmpaqueId;
      const stockInicial = enEmpaques ? tecleado * cantidadPorEmpaque : tecleado;

      await tx.stockInsumo.create({
        data: {
          id: randomUUID(),
          insumoId: insumo.id,
          ciudadId: existencia.ciudadId,
          stockActual: stockInicial,
          stockMinimo: existencia.stockMinimo,
        },
      });

      if (stockInicial > 0) {
        await tx.movimientoInsumo.create({
          data: {
            id: randomUUID(),
            insumoId: insumo.id,
            ciudadId: existencia.ciudadId,
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
    }

    return tx.insumo.findUniqueOrThrow({ where: { id: insumo.id }, include: insumoInclude });
  });

  revalidatePath("/inventario/insumos");

  return mapInsumo(r);
}

/**
 * Actualizar un insumo y el stock mínimo de cada ciudad. El stock actual solo
 * se mueve con entradas y salidas.
 */
export async function putInsumo(
  data: Omit<Insumo, "existencias" | "stockActual" | "stockMinimo" | "bajoStock"> & {
    existencias: ExistenciaInsumoInput[];
  }
): Promise<Insumo> {
  const unidadEmpaqueId = data.unidadEmpaqueId || null;

  const r = await prisma.$transaction(async (tx) => {
    await tx.insumo.update({
      where: { id: data.id! },
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion || null,
        unidadId: data.unidadId,
        unidadEmpaqueId,
        cantidadPorEmpaque: unidadEmpaqueId ? Math.max(1, data.cantidadPorEmpaque) : 1,
        activo: data.activo,
      },
    });

    for (const existencia of data.existencias) {
      await tx.stockInsumo.upsert({
        where: {
          insumoId_ciudadId: { insumoId: data.id!, ciudadId: existencia.ciudadId },
        },
        create: {
          id: randomUUID(),
          insumoId: data.id!,
          ciudadId: existencia.ciudadId,
          stockActual: 0,
          stockMinimo: existencia.stockMinimo,
        },
        update: { stockMinimo: existencia.stockMinimo },
      });
    }

    return tx.insumo.findUniqueOrThrow({ where: { id: data.id! }, include: insumoInclude });
  });

  revalidatePath("/inventario/insumos");
  revalidatePath(`/inventario/insumos/${data.id}`);

  return mapInsumo(r);
}

/**
 * Registrar una entrada o salida de stock en una ciudad. La cantidad puede
 * venir en empaques (2 cajas de 6 = 12 unidades); el stock siempre se lleva en
 * unidades de consumo y las salidas se restan automáticamente.
 */
export async function registrarMovimiento(
  input: RegistrarMovimientoInput
): Promise<RegistrarMovimientoResultado> {
  const session = await getSession();
  if (!session?.IdUser) {
    return { success: false, error: "No autorizado" };
  }

  if (!input.ciudadId) {
    return { success: false, error: "Debe indicar la ciudad" };
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

      const existencia = await tx.stockInsumo.findUnique({
        where: { insumoId_ciudadId: { insumoId: input.insumoId, ciudadId: input.ciudadId } },
      });

      const stockActual = existencia?.stockActual ?? 0;
      const nuevoStock =
        input.tipo === "ENTRADA" ? stockActual + cantidadBase : stockActual - cantidadBase;

      if (nuevoStock < 0) {
        throw new Error(`No hay stock suficiente. Disponible: ${stockActual}`);
      }

      await tx.stockInsumo.upsert({
        where: { insumoId_ciudadId: { insumoId: input.insumoId, ciudadId: input.ciudadId } },
        create: {
          id: randomUUID(),
          insumoId: input.insumoId,
          ciudadId: input.ciudadId,
          stockActual: nuevoStock,
          stockMinimo: 0,
        },
        update: { stockActual: nuevoStock },
      });

      await tx.movimientoInsumo.create({
        data: {
          id: movimientoId,
          insumoId: input.insumoId,
          ciudadId: input.ciudadId,
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
 * Cancela un movimiento y revierte su efecto en el stock de su ciudad: una
 * entrada cancelada resta lo que había sumado y una salida cancelada devuelve
 * el producto. Un movimiento firmado no se puede cancelar.
 */
export async function cancelarMovimiento(
  movimientoId: string,
  motivo?: string
): Promise<CancelarMovimientoResultado> {
  const session = await getSession();
  if (!session?.IdUser) {
    return { success: false, error: "No autorizado" };
  }

  if (!session.Permiso.includes("crear_movimiento_insumo")) {
    return { success: false, error: "No tiene permiso para cancelar movimientos" };
  }

  try {
    const { stockResultante, insumoId } = await prisma.$transaction(async (tx) => {
      const movimiento = await tx.movimientoInsumo.findUnique({
        where: { id: movimientoId },
        select: {
          id: true,
          insumoId: true,
          ciudadId: true,
          tipo: true,
          cantidad: true,
          cancelado: true,
          firmaKey: true,
        },
      });

      if (!movimiento) {
        throw new Error("El movimiento no existe");
      }

      if (movimiento.cancelado) {
        throw new Error("El movimiento ya fue cancelado");
      }

      // La firma es el respaldo de la entrega: si ya firmaron, el movimiento
      // no se puede deshacer.
      if (movimiento.firmaKey) {
        throw new Error("No se puede cancelar un movimiento que ya fue firmado");
      }

      const existencia = await tx.stockInsumo.findUnique({
        where: {
          insumoId_ciudadId: {
            insumoId: movimiento.insumoId,
            ciudadId: movimiento.ciudadId,
          },
        },
      });

      const stockActual = existencia?.stockActual ?? 0;

      // Se revierte el efecto original del movimiento
      const nuevoStock =
        movimiento.tipo === "ENTRADA"
          ? stockActual - movimiento.cantidad
          : stockActual + movimiento.cantidad;

      if (nuevoStock < 0) {
        throw new Error(
          `No se puede cancelar: el stock quedaría negativo. Disponible: ${stockActual}`
        );
      }

      await tx.stockInsumo.upsert({
        where: {
          insumoId_ciudadId: {
            insumoId: movimiento.insumoId,
            ciudadId: movimiento.ciudadId,
          },
        },
        create: {
          id: randomUUID(),
          insumoId: movimiento.insumoId,
          ciudadId: movimiento.ciudadId,
          stockActual: nuevoStock,
          stockMinimo: 0,
        },
        update: { stockActual: nuevoStock },
      });

      await tx.movimientoInsumo.update({
        where: { id: movimiento.id },
        data: {
          cancelado: true,
          canceladoAt: new Date(),
          canceladoPorId: session.IdUser,
          motivoCancelacion: motivo?.trim() || null,
          // El enlace de firma pendiente deja de ser válido
          firmaToken: null,
          firmaTokenExpiraAt: null,
        },
      });

      return { stockResultante: nuevoStock, insumoId: movimiento.insumoId };
    });

    revalidatePath("/inventario/insumos");
    revalidatePath(`/inventario/insumos/${insumoId}`);
    revalidatePath("/inventario/insumos/movimientos");

    return { success: true, stockResultante };
  } catch (error) {
    console.error("Error al cancelar el movimiento de insumo:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al cancelar el movimiento",
    };
  }
}

/**
 * Historial de movimientos de un insumo
 */
export async function getMovimientosByInsumo(
  insumoId: string,
  ciudadId?: string
): Promise<MovimientoInsumo[]> {
  const records = await prisma.movimientoInsumo.findMany({
    where: { insumoId, ...(ciudadId ? { ciudadId } : {}) },
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
  ciudadId?: string;
  tipo?: "ENTRADA" | "SALIDA";
  desde?: string;
  hasta?: string;
}): Promise<MovimientoInsumo[]> {
  const where: {
    insumoId?: string;
    ciudadId?: string;
    tipo?: "ENTRADA" | "SALIDA";
    fecha?: { gte?: Date; lte?: Date };
  } = {};

  if (filtros?.insumoId) where.insumoId = filtros.insumoId;
  if (filtros?.ciudadId) where.ciudadId = filtros.ciudadId;
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
    select: { id: true, firmaKey: true, cancelado: true },
  });

  if (!movimiento) {
    return { success: false, error: "El movimiento no existe" };
  }

  if (movimiento.cancelado) {
    return { success: false, error: "El movimiento fue cancelado" };
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
