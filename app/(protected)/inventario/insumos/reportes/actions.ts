"use server";

import { getSession } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  cantidadMovimientoLabel,
  contenidoEmpaqueLabel,
  equivalenciaEmpaques,
} from "../utils";
import {
  ReporteDetalleInsumo,
  ReporteFiltrosInsumo,
  ReporteInsumos,
  ReporteMovimiento,
  ReporteResultado,
} from "./types";

/** Tope de filas de detalle que se listan en un reporte */
const MAX_MOVIMIENTOS_REPORTE = 2000;

function formatFecha(fecha: Date) {
  return new Intl.DateTimeFormat("es-HN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(fecha);
}

function formatDia(fecha: Date) {
  return new Intl.DateTimeFormat("es-HN", { dateStyle: "short" }).format(fecha);
}

function construirRango(desde?: string, hasta?: string) {
  if (!desde && !hasta) return undefined;

  const rango: { gte?: Date; lte?: Date } = {};
  if (desde) rango.gte = new Date(`${desde}T00:00:00`);
  if (hasta) rango.lte = new Date(`${hasta}T23:59:59`);
  return rango;
}

function periodoLabel(desde?: string, hasta?: string) {
  if (desde && hasta) {
    return `Del ${formatDia(new Date(`${desde}T00:00:00`))} al ${formatDia(
      new Date(`${hasta}T00:00:00`)
    )}`;
  }
  if (desde) return `Desde el ${formatDia(new Date(`${desde}T00:00:00`))}`;
  if (hasta) return `Hasta el ${formatDia(new Date(`${hasta}T00:00:00`))}`;
  return "Histórico completo";
}

/**
 * Genera el reporte de insumos: general (existencias), por rango de fechas
 * o por producto.
 */
export async function generarReporteInsumos(
  filtros: ReporteFiltrosInsumo
): Promise<ReporteResultado> {
  const session = await getSession();
  if (!session?.IdUser) {
    return { success: false, error: "No autorizado" };
  }

  if (
    !session.Permiso.includes("ver_reportes_insumo") &&
    !session.Permiso.includes("ver_movimientos_insumo")
  ) {
    return { success: false, error: "No tiene permiso para generar reportes de insumos" };
  }

  if (filtros.tipo === "PRODUCTO" && !filtros.insumoId) {
    return { success: false, error: "Debe seleccionar un producto" };
  }

  if (filtros.tipo === "FECHA" && !filtros.desde && !filtros.hasta) {
    return { success: false, error: "Debe indicar al menos una fecha" };
  }

  if (filtros.desde && filtros.hasta && filtros.desde > filtros.hasta) {
    return { success: false, error: "La fecha inicial no puede ser mayor a la final" };
  }

  try {
    const rango = construirRango(filtros.desde, filtros.hasta);
    const insumoId = filtros.tipo === "PRODUCTO" ? filtros.insumoId : undefined;

    const where: {
      insumoId?: string;
      fecha?: { gte?: Date; lte?: Date };
    } = {};
    if (insumoId) where.insumoId = insumoId;
    if (rango) where.fecha = rango;

    // Totales de entradas y salidas por insumo dentro del filtro aplicado
    const agregados = await prisma.movimientoInsumo.groupBy({
      by: ["insumoId", "tipo"],
      where,
      _sum: { cantidad: true },
    });

    const totalesPorInsumo = new Map<string, { entradas: number; salidas: number }>();
    for (const fila of agregados) {
      const actual = totalesPorInsumo.get(fila.insumoId) ?? { entradas: 0, salidas: 0 };
      const cantidad = fila._sum.cantidad ?? 0;
      if (fila.tipo === "ENTRADA") actual.entradas += cantidad;
      else actual.salidas += cantidad;
      totalesPorInsumo.set(fila.insumoId, actual);
    }

    // El reporte general lista todas las existencias; los otros solo los
    // insumos que tuvieron movimiento en el filtro.
    const insumosWhere =
      filtros.tipo === "GENERAL"
        ? {}
        : { id: insumoId ? insumoId : { in: Array.from(totalesPorInsumo.keys()) } };

    const insumos = await prisma.insumo.findMany({
      where: insumosWhere,
      include: {
        unidad: { select: { nombre: true } },
        unidadEmpaque: { select: { nombre: true } },
      },
      orderBy: { nombre: "asc" },
    });

    const detalle: ReporteDetalleInsumo[] = insumos.map((insumo) => {
      const totales = totalesPorInsumo.get(insumo.id) ?? { entradas: 0, salidas: 0 };
      const unidadEmpaqueNombre = insumo.unidadEmpaque?.nombre ?? null;
      return {
        insumoId: insumo.id,
        nombre: insumo.nombre,
        unidadNombre: insumo.unidad.nombre,
        contenidoLabel: contenidoEmpaqueLabel(
          insumo.cantidadPorEmpaque,
          insumo.unidad.nombre,
          unidadEmpaqueNombre
        ),
        equivalenciaStock: equivalenciaEmpaques(
          insumo.stockActual,
          insumo.cantidadPorEmpaque,
          insumo.unidad.nombre,
          unidadEmpaqueNombre
        ),
        stockActual: insumo.stockActual,
        stockMinimo: insumo.stockMinimo,
        bajoStock: insumo.stockActual <= insumo.stockMinimo,
        activo: insumo.activo,
        entradas: totales.entradas,
        salidas: totales.salidas,
      };
    });

    // Los tres tipos de reporte listan el detalle de movimientos, para que
    // siempre se vea quién solicitó el insumo y su firma.
    const [totalMovimientos, salidasSinFirma] = await Promise.all([
      prisma.movimientoInsumo.count({ where }),
      prisma.movimientoInsumo.count({ where: { ...where, tipo: "SALIDA", firmaKey: null } }),
    ]);

    const registros = await prisma.movimientoInsumo.findMany({
      where,
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
      orderBy: { fecha: "desc" },
      take: MAX_MOVIMIENTOS_REPORTE,
    });

    const movimientos: ReporteMovimiento[] = registros.map((r) => ({
      id: r.id,
      fechaLabel: formatFecha(r.fecha),
      insumoNombre: r.insumo.nombre,
      unidadNombre: r.insumo.unidad.nombre,
      tipo: r.tipo,
      cantidad: r.cantidad,
      cantidadEmpaque: r.cantidadEmpaque,
      cantidadLabel: cantidadMovimientoLabel(
        r.cantidad,
        r.insumo.unidad.nombre,
        r.cantidadEmpaque,
        r.insumo.unidadEmpaque?.nombre ?? null
      ),
      stockResultante: r.stockResultante,
      solicitadoPor: r.empleadoSolicitante
        ? `${r.empleadoSolicitante.nombre} ${r.empleadoSolicitante.apellido}`
        : "-",
      registradoPor: r.usuario.Empleados
        ? `${r.usuario.Empleados.nombre} ${r.usuario.Empleados.apellido}`
        : r.usuario.usuario,
      observaciones: r.observaciones ?? "",
      firmado: !!r.firmaKey,
      firmaFechaLabel: r.firmaFecha ? formatFecha(r.firmaFecha) : null,
    }));

    const totalEntradas = detalle.reduce((suma, fila) => suma + fila.entradas, 0);
    const totalSalidas = detalle.reduce((suma, fila) => suma + fila.salidas, 0);

    const usuario = await prisma.usuarios.findUnique({
      where: { id: session.IdUser },
      select: { usuario: true, Empleados: { select: { nombre: true, apellido: true } } },
    });

    const insumoNombre =
      filtros.tipo === "PRODUCTO" ? detalle[0]?.nombre ?? "Producto no encontrado" : null;

    const titulo =
      filtros.tipo === "GENERAL"
        ? "Reporte general de insumos"
        : filtros.tipo === "FECHA"
          ? "Reporte de insumos por fecha"
          : `Reporte por producto: ${insumoNombre}`;

    const reporte: ReporteInsumos = {
      tipo: filtros.tipo,
      titulo,
      periodoLabel: periodoLabel(filtros.desde, filtros.hasta),
      insumoNombre,
      generadoEl: formatFecha(new Date()),
      generadoPor: usuario?.Empleados
        ? `${usuario.Empleados.nombre} ${usuario.Empleados.apellido}`
        : usuario?.usuario ?? session.User,
      resumen: {
        totalInsumos: detalle.length,
        insumosBajoStock: detalle.filter((fila) => fila.bajoStock).length,
        totalMovimientos,
        totalEntradas,
        totalSalidas,
        salidasSinFirma,
      },
      detalle,
      movimientos,
    };

    return { success: true, data: reporte };
  } catch (error) {
    console.error("Error al generar el reporte de insumos:", error);
    return { success: false, error: "No se pudo generar el reporte" };
  }
}
