"use server";

import { getSession } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  cantidadMovimientoLabel,
  contenidoEmpaqueLabel,
  diasEntre,
  equivalenciaEmpaques,
  finDiaHn,
  formatDiaHn,
  formatFechaHn,
  inicioDiaHn,
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


/** Fechas del reporte siempre en hora de Honduras (UTC-6) */
const formatFecha = formatFechaHn;

function construirRango(desde?: string, hasta?: string) {
  if (!desde && !hasta) return undefined;

  const rango: { gte?: Date; lte?: Date } = {};
  if (desde) rango.gte = inicioDiaHn(desde);
  if (hasta) rango.lte = finDiaHn(hasta);
  return rango;
}

function periodoLabel(desde?: string, hasta?: string) {
  if (desde && hasta) {
    return `Del ${formatDiaHn(inicioDiaHn(desde))} al ${formatDiaHn(inicioDiaHn(hasta))}`;
  }
  if (desde) return `Desde el ${formatDiaHn(inicioDiaHn(desde))}`;
  if (hasta) return `Hasta el ${formatDiaHn(inicioDiaHn(hasta))}`;
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

  if (
    filtros.contenido &&
    !filtros.contenido.entradas &&
    !filtros.contenido.salidas &&
    !filtros.contenido.insumos
  ) {
    return { success: false, error: "Seleccione al menos entradas, salidas o insumos" };
  }

  try {
    const rango = construirRango(filtros.desde, filtros.hasta);
    const insumoId = filtros.tipo === "PRODUCTO" ? filtros.insumoId : undefined;

    const contenido = filtros.contenido ?? { entradas: true, salidas: true, insumos: true };
    const listaMovimientos = contenido.entradas || contenido.salidas;

    // Los movimientos cancelados ya revirtieron su efecto, así que no entran
    // en ningún total ni listado del reporte.
    const where: {
      insumoId?: string;
      ciudadId?: string;
      fecha?: { gte?: Date; lte?: Date };
      cancelado: boolean;
    } = { cancelado: false };
    if (insumoId) where.insumoId = insumoId;
    if (filtros.ciudadId) where.ciudadId = filtros.ciudadId;
    if (rango) where.fecha = rango;

    // Si se pidió un solo tipo, el detalle se acota a ese tipo
    const whereMovimientos =
      contenido.entradas && contenido.salidas
        ? where
        : contenido.entradas
          ? { ...where, tipo: "ENTRADA" as const }
          : { ...where, tipo: "SALIDA" as const };

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

    // Fechas de compra por insumo: sirven para saber cuántos días duró cada
    // compra y sacar el promedio del período.
    const entradasPorInsumo = new Map<string, Date[]>();

    if (contenido.insumos) {
      const compras = await prisma.movimientoInsumo.findMany({
        where: { ...where, tipo: "ENTRADA" },
        select: { insumoId: true, fecha: true },
        orderBy: { fecha: "asc" },
      });

      for (const compra of compras) {
        const fechas = entradasPorInsumo.get(compra.insumoId) ?? [];
        fechas.push(compra.fecha);
        entradasPorInsumo.set(compra.insumoId, fechas);
      }
    }

    // Referencia para "días desde la última compra": hoy, o el fin del rango
    // si el reporte mira un período ya cerrado.
    const referencia = filtros.hasta
      ? new Date(Math.min(finDiaHn(filtros.hasta).getTime(), Date.now()))
      : new Date();

    const insumos = contenido.insumos
      ? await prisma.insumo.findMany({
          where: insumosWhere,
          include: {
            unidad: { select: { nombre: true } },
            unidadEmpaque: { select: { nombre: true } },
            existencias: { include: { ciudad: { select: { nombre: true } } } },
          },
          orderBy: { nombre: "asc" },
        })
      : [];

    const detalle: ReporteDetalleInsumo[] = insumos.map((insumo) => {
      const totales = totalesPorInsumo.get(insumo.id) ?? { entradas: 0, salidas: 0 };
      const unidadEmpaqueNombre = insumo.unidadEmpaque?.nombre ?? null;
      const compras = entradasPorInsumo.get(insumo.id) ?? [];
      const ultimaEntrada = compras.length ? compras[compras.length - 1] : null;

      // Existencias del alcance: una ciudad o todas las bodegas
      const existencias = filtros.ciudadId
        ? insumo.existencias.filter((e) => e.ciudadId === filtros.ciudadId)
        : insumo.existencias;
      const stockActual = existencias.reduce((suma, e) => suma + e.stockActual, 0);
      const stockMinimo = existencias.reduce((suma, e) => suma + e.stockMinimo, 0);

      // Cada compra "dura" hasta la siguiente: el promedio de esos intervalos
      // es lo que dura un abastecimiento.
      const intervalos: number[] = [];
      for (let i = 1; i < compras.length; i++) {
        intervalos.push(diasEntre(compras[i - 1], compras[i]));
      }

      return {
        cantidadEntradas: compras.length,
        ultimaEntradaLabel: ultimaEntrada ? formatDiaHn(ultimaEntrada) : null,
        diasDesdeUltimaEntrada: ultimaEntrada ? diasEntre(ultimaEntrada, referencia) : null,
        promedioDiasEntreEntradas: intervalos.length
          ? Math.round(intervalos.reduce((suma, dias) => suma + dias, 0) / intervalos.length)
          : null,
        insumoId: insumo.id,
        nombre: insumo.nombre,
        unidadNombre: insumo.unidad.nombre,
        contenidoLabel: contenidoEmpaqueLabel(
          insumo.cantidadPorEmpaque,
          insumo.unidad.nombre,
          unidadEmpaqueNombre
        ),
        equivalenciaStock: equivalenciaEmpaques(
          stockActual,
          insumo.cantidadPorEmpaque,
          insumo.unidad.nombre,
          unidadEmpaqueNombre
        ),
        existenciasLabel: existencias
          .map((e) => `${e.ciudad.nombre}: ${e.stockActual}`)
          .join(" · "),
        stockActual,
        stockMinimo,
        bajoStock: existencias.some((e) => e.stockActual <= e.stockMinimo),
        activo: insumo.activo,
        entradas: totales.entradas,
        salidas: totales.salidas,
      };
    });

    // El detalle de movimientos se lista en los tres tipos de reporte, para que
    // siempre se vea quién solicitó el insumo y su firma. La opción "Stock
    // actual" es la única que se queda solo con las existencias.
    const [totalMovimientos, salidasSinFirma] = await Promise.all([
      prisma.movimientoInsumo.count({ where: whereMovimientos }),
      prisma.movimientoInsumo.count({ where: { ...where, tipo: "SALIDA", firmaKey: null } }),
    ]);

    const registros = !listaMovimientos ? [] : await prisma.movimientoInsumo.findMany({
      where: whereMovimientos,
      include: {
        insumo: {
          select: {
            nombre: true,
            unidad: { select: { nombre: true } },
            unidadEmpaque: { select: { nombre: true } },
          },
        },
        ciudad: { select: { nombre: true } },
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
      ciudadNombre: r.ciudad.nombre,
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

    // Se calculan sobre los agregados, no sobre el detalle, porque la tabla de
    // existencias puede no estar incluida en el reporte.
    let totalEntradas = 0;
    let totalSalidas = 0;
    for (const totales of Array.from(totalesPorInsumo.values())) {
      totalEntradas += totales.entradas;
      totalSalidas += totales.salidas;
    }

    const usuario = await prisma.usuarios.findUnique({
      where: { id: session.IdUser },
      select: { usuario: true, Empleados: { select: { nombre: true, apellido: true } } },
    });

    // El detalle puede venir vacío si no se pidió la tabla de existencias
    const insumoNombre =
      filtros.tipo === "PRODUCTO"
        ? detalle[0]?.nombre ??
          (await prisma.insumo.findUnique({
            where: { id: insumoId },
            select: { nombre: true },
          }))?.nombre ??
          "Producto no encontrado"
        : null;

    const tituloBase =
      filtros.tipo === "GENERAL"
        ? "Reporte general de insumos"
        : filtros.tipo === "FECHA"
          ? "Reporte de insumos por fecha"
          : `Reporte por producto: ${insumoNombre}`;

    const secciones = [
      contenido.entradas ? "entradas" : null,
      contenido.salidas ? "salidas" : null,
      contenido.insumos ? "existencias" : null,
    ].filter(Boolean);

    const sufijoContenido =
      secciones.length === 3 ? "" : ` — ${secciones.join(" y ")}`;

    const ciudadNombre = filtros.ciudadId
      ? (
          await prisma.ciudad.findUnique({
            where: { id: filtros.ciudadId },
            select: { nombre: true },
          })
        )?.nombre ?? null
      : null;

    const reporte: ReporteInsumos = {
      tipo: filtros.tipo,
      contenido,
      titulo: `${tituloBase}${sufijoContenido}`,
      periodoLabel: periodoLabel(filtros.desde, filtros.hasta),
      insumoNombre,
      ciudadNombre,
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
