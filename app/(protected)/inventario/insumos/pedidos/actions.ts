"use server";

import { getSession } from "@/auth";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { cantidadMovimientoLabel, diasEntre, formatDiaHn, formatFechaHn } from "../utils";
import {
  CrearPedidoInput,
  EstadoPedidoInsumo,
  PedidoInsumo,
  PedidoResultado,
  RecibirPedidoInput,
  SugerenciaPedido,
} from "./types";

const pedidoInclude = {
  ciudad: { select: { id: true, nombre: true } },
  solicitadoPor: {
    select: { usuario: true, Empleados: { select: { nombre: true, apellido: true } } },
  },
  recibidoPor: {
    select: { usuario: true, Empleados: { select: { nombre: true, apellido: true } } },
  },
  detalles: {
    include: {
      insumo: {
        select: {
          id: true,
          nombre: true,
          cantidadPorEmpaque: true,
          unidad: { select: { nombre: true } },
          unidadEmpaque: { select: { nombre: true } },
          existencias: { select: { ciudadId: true, stockActual: true, stockMinimo: true } },
        },
      },
    },
    orderBy: { createAt: "asc" },
  },
} as const;

type PedidoRecord = Awaited<
  ReturnType<typeof prisma.pedidoInsumo.findFirstOrThrow<{ include: typeof pedidoInclude }>>
>;

function nombreUsuario(
  usuario: { usuario: string; Empleados: { nombre: string; apellido: string } | null } | null
) {
  if (!usuario) return null;
  return usuario.Empleados
    ? `${usuario.Empleados.nombre} ${usuario.Empleados.apellido}`
    : usuario.usuario;
}

/** Referencia del pedido anterior de un insumo, para medir cuánto duró la compra */
type PedidoAnterior = {
  numero: number;
  /** Cuándo llegó el producto; si nunca se recibió, cuándo se pidió */
  fecha: Date;
};

/**
 * Busca, para cada insumo del pedido, el pedido anterior de la misma ciudad
 * que lo incluía. Con eso se sabe cuántos días duró la compra pasada.
 */
async function getPedidosAnteriores(pedido: {
  numero: number;
  ciudadId: string;
  detalles: { insumoId: string }[];
}) {
  const insumoIds = pedido.detalles.map((d) => d.insumoId);
  if (insumoIds.length === 0) return new Map<string, PedidoAnterior>();

  const anteriores = await prisma.pedidoInsumoDetalle.findMany({
    where: {
      insumoId: { in: insumoIds },
      pedido: {
        ciudadId: pedido.ciudadId,
        numero: { lt: pedido.numero },
        estado: { not: "CANCELADO" },
      },
    },
    select: {
      insumoId: true,
      pedido: { select: { numero: true, fechaSolicitud: true, fechaRecepcion: true } },
    },
    orderBy: { pedido: { numero: "desc" } },
  });

  const mapa = new Map<string, PedidoAnterior>();
  for (const anterior of anteriores) {
    // Al venir ordenados de mayor a menor, el primero de cada insumo es el último pedido
    if (mapa.has(anterior.insumoId)) continue;
    mapa.set(anterior.insumoId, {
      numero: anterior.pedido.numero,
      fecha: anterior.pedido.fechaRecepcion ?? anterior.pedido.fechaSolicitud,
    });
  }

  return mapa;
}

function mapPedido(
  r: PedidoRecord,
  anteriores = new Map<string, PedidoAnterior>()
): PedidoInsumo {
  return {
    id: r.id,
    numero: r.numero,
    ciudadId: r.ciudad.id,
    ciudadNombre: r.ciudad.nombre,
    estado: r.estado as EstadoPedidoInsumo,
    solicitadoPor: nombreUsuario(r.solicitadoPor) ?? "-",
    fechaSolicitud: r.fechaSolicitud.toISOString(),
    fechaSolicitudLabel: formatFechaHn(r.fechaSolicitud),
    recibidoPor: nombreUsuario(r.recibidoPor),
    fechaRecepcionLabel: r.fechaRecepcion ? formatFechaHn(r.fechaRecepcion) : null,
    observaciones: r.observaciones ?? "",
    motivoCancelacion: r.motivoCancelacion ?? "",
    totalLineas: r.detalles.length,
    detalles: r.detalles.map((detalle) => {
      const unidadEmpaqueNombre = detalle.insumo.unidadEmpaque?.nombre ?? null;
      const existencia = detalle.insumo.existencias.find((e) => e.ciudadId === r.ciudad.id);
      const anterior = anteriores.get(detalle.insumo.id);

      return {
        pedidoAnteriorNumero: anterior?.numero ?? null,
        pedidoAnteriorFechaLabel: anterior ? formatDiaHn(anterior.fecha) : null,
        diasDesdePedidoAnterior: anterior
          ? diasEntre(anterior.fecha, r.fechaSolicitud)
          : null,
        id: detalle.id,
        insumoId: detalle.insumo.id,
        insumoNombre: detalle.insumo.nombre,
        unidadNombre: detalle.insumo.unidad.nombre,
        unidadEmpaqueNombre,
        cantidadPorEmpaque: detalle.insumo.cantidadPorEmpaque,
        cantidad: detalle.cantidad,
        cantidadEmpaque: detalle.cantidadEmpaque,
        cantidadLabel: cantidadMovimientoLabel(
          detalle.cantidad,
          detalle.insumo.unidad.nombre,
          detalle.cantidadEmpaque,
          unidadEmpaqueNombre
        ),
        cantidadRecibida: detalle.cantidadRecibida,
        cantidadRecibidaLabel:
          detalle.cantidadRecibida !== null
            ? cantidadMovimientoLabel(
                detalle.cantidadRecibida,
                detalle.insumo.unidad.nombre,
                null,
                unidadEmpaqueNombre
              )
            : null,
        observacion: detalle.observacion ?? "",
        stockActual: existencia?.stockActual ?? 0,
        stockMinimo: existencia?.stockMinimo ?? 0,
      };
    }),
  };
}

/**
 * Listado de pedidos
 */
export async function getPedidos(filtros?: {
  estado?: EstadoPedidoInsumo;
  ciudadId?: string;
}): Promise<PedidoInsumo[]> {
  const records = await prisma.pedidoInsumo.findMany({
    where: {
      ...(filtros?.estado ? { estado: filtros.estado } : {}),
      ...(filtros?.ciudadId ? { ciudadId: filtros.ciudadId } : {}),
    },
    include: pedidoInclude,
    orderBy: { numero: "desc" },
    take: 300,
  });

  // El listado no calcula pedidos anteriores: eso solo se ve en el detalle
  return records.map((r) => mapPedido(r));
}

export async function getPedidoById(id: string): Promise<PedidoInsumo | null> {
  const r = await prisma.pedidoInsumo.findUnique({ where: { id }, include: pedidoInclude });
  if (!r) return null;

  const anteriores = await getPedidosAnteriores({
    numero: r.numero,
    ciudadId: r.ciudadId,
    detalles: r.detalles.map((d) => ({ insumoId: d.insumoId })),
  });

  return mapPedido(r, anteriores);
}

/**
 * Insumos de una ciudad que están en o por debajo del mínimo, para proponer
 * qué comprar al armar el pedido.
 */
export async function getSugerenciasPedido(ciudadId: string): Promise<SugerenciaPedido[]> {
  const existencias = await prisma.stockInsumo.findMany({
    where: { ciudadId, insumo: { activo: true } },
    include: {
      insumo: {
        select: {
          id: true,
          nombre: true,
          cantidadPorEmpaque: true,
          unidad: { select: { nombre: true } },
          unidadEmpaque: { select: { nombre: true } },
        },
      },
    },
  });

  return existencias
    .filter((e) => e.stockActual <= e.stockMinimo)
    .map((e) => ({
      insumoId: e.insumo.id,
      nombre: e.insumo.nombre,
      unidadNombre: e.insumo.unidad.nombre,
      unidadEmpaqueNombre: e.insumo.unidadEmpaque?.nombre ?? null,
      cantidadPorEmpaque: e.insumo.cantidadPorEmpaque,
      stockActual: e.stockActual,
      stockMinimo: e.stockMinimo,
      faltante: Math.max(0, e.stockMinimo - e.stockActual),
    }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));
}

/**
 * Crea un pedido en estado pendiente. No mueve stock: el stock entra cuando
 * el pedido se marca como recibido.
 */
export async function crearPedido(input: CrearPedidoInput): Promise<PedidoResultado> {
  const session = await getSession();
  if (!session?.IdUser) {
    return { success: false, error: "No autorizado" };
  }

  if (!session.Permiso.includes("crear_pedidos_insumo")) {
    return { success: false, error: "No tiene permiso para crear pedidos" };
  }

  if (!input.ciudadId) {
    return { success: false, error: "Debe indicar la ciudad del pedido" };
  }

  const detalles = input.detalles.filter((d) => d.insumoId && d.cantidad > 0);
  if (detalles.length === 0) {
    return { success: false, error: "Agregue al menos un insumo al pedido" };
  }

  try {
    const pedido = await prisma.$transaction(async (tx) => {
      const insumos = await tx.insumo.findMany({
        where: { id: { in: detalles.map((d) => d.insumoId) } },
        select: { id: true, cantidadPorEmpaque: true, unidadEmpaqueId: true },
      });

      const ultimo = await tx.pedidoInsumo.findFirst({
        orderBy: { numero: "desc" },
        select: { numero: true },
      });

      const creado = await tx.pedidoInsumo.create({
        data: {
          id: randomUUID(),
          numero: (ultimo?.numero ?? 0) + 1,
          ciudadId: input.ciudadId,
          estado: "PENDIENTE",
          solicitadoPorId: session.IdUser,
          fechaSolicitud: new Date(),
          observaciones: input.observaciones?.trim() || null,
        },
      });

      for (const detalle of detalles) {
        const insumo = insumos.find((i) => i.id === detalle.insumoId);
        if (!insumo) {
          throw new Error("Uno de los insumos del pedido no existe");
        }

        const enEmpaques = detalle.enEmpaques && !!insumo.unidadEmpaqueId;
        const cantidadBase = enEmpaques
          ? detalle.cantidad * insumo.cantidadPorEmpaque
          : detalle.cantidad;

        await tx.pedidoInsumoDetalle.create({
          data: {
            id: randomUUID(),
            pedidoId: creado.id,
            insumoId: detalle.insumoId,
            cantidad: cantidadBase,
            cantidadEmpaque: enEmpaques ? detalle.cantidad : null,
            observacion: detalle.observacion?.trim() || null,
          },
        });
      }

      return creado;
    });

    revalidatePath("/inventario/insumos/pedidos");

    return { success: true, pedidoId: pedido.id, numero: pedido.numero };
  } catch (error) {
    console.error("Error al crear el pedido de insumos:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al crear el pedido",
    };
  }
}

/**
 * Marca el pedido como recibido y suma al stock de la ciudad lo que realmente
 * llegó, generando una entrada por cada línea.
 */
export async function recibirPedido(input: RecibirPedidoInput): Promise<PedidoResultado> {
  const session = await getSession();
  if (!session?.IdUser) {
    return { success: false, error: "No autorizado" };
  }

  if (!session.Permiso.includes("recibir_pedidos_insumo")) {
    return { success: false, error: "No tiene permiso para recibir pedidos" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const pedido = await tx.pedidoInsumo.findUnique({
        where: { id: input.pedidoId },
        include: {
          detalles: {
            include: {
              insumo: { select: { id: true, cantidadPorEmpaque: true, unidadEmpaqueId: true } },
            },
          },
        },
      });

      if (!pedido) {
        throw new Error("El pedido no existe");
      }

      if (pedido.estado !== "PENDIENTE") {
        throw new Error(
          pedido.estado === "RECIBIDO"
            ? "El pedido ya fue recibido"
            : "El pedido está cancelado"
        );
      }

      for (const detalle of pedido.detalles) {
        const recepcion = input.recepciones.find((r) => r.detalleId === detalle.id);

        // La cantidad se teclea en la misma unidad en que se pidió la línea
        const enEmpaques = detalle.cantidadEmpaque !== null;
        const tecleado = recepcion?.cantidad ?? (enEmpaques ? detalle.cantidadEmpaque! : detalle.cantidad);
        const cantidadRecibida = Math.max(
          0,
          enEmpaques ? tecleado * detalle.insumo.cantidadPorEmpaque : tecleado
        );

        await tx.pedidoInsumoDetalle.update({
          where: { id: detalle.id },
          data: { cantidadRecibida },
        });

        if (cantidadRecibida === 0) continue;

        const existencia = await tx.stockInsumo.findUnique({
          where: {
            insumoId_ciudadId: { insumoId: detalle.insumoId, ciudadId: pedido.ciudadId },
          },
        });

        const nuevoStock = (existencia?.stockActual ?? 0) + cantidadRecibida;

        await tx.stockInsumo.upsert({
          where: {
            insumoId_ciudadId: { insumoId: detalle.insumoId, ciudadId: pedido.ciudadId },
          },
          create: {
            id: randomUUID(),
            insumoId: detalle.insumoId,
            ciudadId: pedido.ciudadId,
            stockActual: nuevoStock,
            stockMinimo: 0,
          },
          update: { stockActual: nuevoStock },
        });

        await tx.movimientoInsumo.create({
          data: {
            id: randomUUID(),
            insumoId: detalle.insumoId,
            ciudadId: pedido.ciudadId,
            pedidoId: pedido.id,
            tipo: "ENTRADA",
            cantidad: cantidadRecibida,
            cantidadEmpaque: enEmpaques ? tecleado : null,
            stockResultante: nuevoStock,
            fecha: new Date(),
            observaciones: `Recepción del pedido #${pedido.numero}`,
            usuarioId: session.IdUser,
          },
        });
      }

      await tx.pedidoInsumo.update({
        where: { id: pedido.id },
        data: {
          estado: "RECIBIDO",
          recibidoPorId: session.IdUser,
          fechaRecepcion: new Date(),
        },
      });
    });

    revalidatePath("/inventario/insumos/pedidos");
    revalidatePath(`/inventario/insumos/pedidos/${input.pedidoId}`);
    revalidatePath("/inventario/insumos");
    revalidatePath("/inventario/insumos/movimientos");

    return { success: true, pedidoId: input.pedidoId };
  } catch (error) {
    console.error("Error al recibir el pedido de insumos:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al recibir el pedido",
    };
  }
}

/**
 * Cancela un pedido pendiente. No toca stock porque un pedido pendiente
 * todavía no sumó nada.
 */
export async function cancelarPedido(
  pedidoId: string,
  motivo?: string
): Promise<PedidoResultado> {
  const session = await getSession();
  if (!session?.IdUser) {
    return { success: false, error: "No autorizado" };
  }

  if (!session.Permiso.includes("crear_pedidos_insumo")) {
    return { success: false, error: "No tiene permiso para cancelar pedidos" };
  }

  const pedido = await prisma.pedidoInsumo.findUnique({
    where: { id: pedidoId },
    select: { id: true, estado: true },
  });

  if (!pedido) {
    return { success: false, error: "El pedido no existe" };
  }

  if (pedido.estado !== "PENDIENTE") {
    return {
      success: false,
      error:
        pedido.estado === "RECIBIDO"
          ? "No se puede cancelar un pedido ya recibido"
          : "El pedido ya está cancelado",
    };
  }

  await prisma.pedidoInsumo.update({
    where: { id: pedidoId },
    data: { estado: "CANCELADO", motivoCancelacion: motivo?.trim() || null },
  });

  revalidatePath("/inventario/insumos/pedidos");
  revalidatePath(`/inventario/insumos/pedidos/${pedidoId}`);

  return { success: true, pedidoId };
}
