'use server';

import { getSession } from '@/auth';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { ReporteDiseño } from './type';

//
// Obtener todos los reportes.
//
export async function getReportesDiseño(): Promise<ReporteDiseño[]> {
  const records = await prisma.reporteDiseño.findMany({
    include: { TipoSeccion: true, Empleados: true },
    orderBy: { FechaRegistro: 'desc' },
  });

  return records.map(r => ({
    Id: r.Id,
    Empleado: `${r.Empleados.nombre} ${r.Empleados.apellido}`,
    TipoSeccion: r.TipoSeccion.Nombre,
    SeccionId: r.SeccionId,
    FechaRegistro: r.FechaRegistro,
    PaginaInicio: r.PaginaInicio,
    PaginaFin: r.PaginaFin,
    HoraInicio: r.HoraInicio,
    HoraFin: r.HoraFin,
    Observacion: r.Observacion ?? '',
  }));
}

//
// Obtener un reporte por ID.
//
export async function getReporteDiseñoById(id: string): Promise<ReporteDiseño | null> {
  const r = await prisma.reporteDiseño.findUnique({
    where: { Id: id },
    include: { TipoSeccion: true, Empleados: true },
  });
  if (!r) return null;

  return {
    Id: r.Id,
    Empleado: `${r.Empleados.nombre} ${r.Empleados.apellido}`,
    TipoSeccion: r.TipoSeccion.Nombre,
    SeccionId: r.SeccionId,
    FechaRegistro: r.FechaRegistro,
    PaginaInicio: r.PaginaInicio,
    PaginaFin: r.PaginaFin,
    HoraInicio: r.HoraInicio,
    HoraFin: r.HoraFin,
    Observacion: r.Observacion ?? '',
  };
}

//
// Crear un nuevo reporte.
//
export async function createReporteDiseño(data: ReporteDiseño): Promise<ReporteDiseño> {
  const session = await getSession();
  if (!session?.IdEmpleado) {
    throw new Error("Empleado no autenticado");
  }

  const nuevo = await prisma.reporteDiseño.create({
    data: {
      Id: data.Id || randomUUID(),
      EmpleadoId: session.IdEmpleado,
      SeccionId: data.SeccionId,
      FechaRegistro: new Date(),
      PaginaInicio: data.PaginaInicio,
      PaginaFin: data.PaginaFin,
      HoraInicio: data.HoraInicio,
      HoraFin: data.HoraFin,
      Observacion: data.Observacion ?? '',
    },
    include: {
      TipoSeccion: true,
      Empleados: true,
    },
  });

  return {
    Id: nuevo.Id,
    Empleado: `${nuevo.Empleados.nombre} ${nuevo.Empleados.apellido}`,
    TipoSeccion: nuevo.TipoSeccion.Nombre,
    SeccionId: nuevo.SeccionId,
    FechaRegistro: nuevo.FechaRegistro,
    PaginaInicio: nuevo.PaginaInicio,
    PaginaFin: nuevo.PaginaFin,
    HoraInicio: nuevo.HoraInicio,
    HoraFin: nuevo.HoraFin,
    Observacion: nuevo.Observacion ?? '',
  };
}
// ------------------ Turnos / Reportes por turno ------------------

const HN_OFFSET_HOURS = 6; // Honduras = UTC-6

/**
 * Convierte una fecha local 'YYYY-MM-DD' y una hora local (0-23) a Date UTC.
 * Usamos Date.UTC(...) y sumamos HN_OFFSET_HOURS para pasar de local(HN) a UTC.
 */
function localDateHourToUtc(dateStr: string, hourLocal: number, minute = 0): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  // Date.UTC normaliza overflow en día/mes/año
  return new Date(Date.UTC(y, m - 1, d, hourLocal + HN_OFFSET_HOURS, minute, 0));
}

/**
 * Devuelve el intervalo [startUtc, endUtc) para un día local dado y horas start/end locales.
 * Si endHourLocal <= startHourLocal asumimos que el turno cruza la medianoche (end = siguiente día).
 */
function intervalForLocalDay(dateStr: string, startHourLocal: number, endHourLocal: number) {
  const startUtc = localDateHourToUtc(dateStr, startHourLocal);

  let endUtc: Date;
  if (endHourLocal > startHourLocal) {
    endUtc = localDateHourToUtc(dateStr, endHourLocal);
  } else {
    // turno cruza medianoche -> end en el siguiente día local
    const parts = dateStr.split('-').map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    d.setDate(d.getDate() + 1);
    const nextY = d.getFullYear();
    const nextM = d.getMonth() + 1;
    const nextD = d.getDate();
    const nextDayStr = `${nextY}-${String(nextM).padStart(2, '0')}-${String(nextD).padStart(2, '0')}`;
    endUtc = localDateHourToUtc(nextDayStr, endHourLocal);
  }

  return { startUtc, endUtc };
}

/**
 * Obtener reportes de UN DÍA aplicando un turno local (ej. 08 -> 01).
 * dateStr: 'YYYY-MM-DD' (día local en HN)
 * startHourLocal, endHourLocal: enteros 0-23
 */
export async function getReportesPorTurnoDia(
  dateStr: string,
  startHourLocal: number,
  endHourLocal: number
): Promise<ReporteDiseño[]> {
  // validación básica de formato
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) throw new Error('dateStr debe ser YYYY-MM-DD');

  const { startUtc, endUtc } = intervalForLocalDay(dateStr, startHourLocal, endHourLocal);

  const records = await prisma.reporteDiseño.findMany({
    where: {
      FechaRegistro: {
        gte: startUtc,
        lt: endUtc,
      },
    },
    include: { TipoSeccion: true, Empleados: true },
    orderBy: { FechaRegistro: 'desc' },
  });

  return records.map(r => ({
    Id: r.Id,
    Empleado: `${r.Empleados.nombre} ${r.Empleados.apellido}`,
    TipoSeccion: r.TipoSeccion.Nombre,
    SeccionId: r.SeccionId,
    FechaRegistro: r.FechaRegistro,
    PaginaInicio: r.PaginaInicio,
    PaginaFin: r.PaginaFin,
    HoraInicio: r.HoraInicio,
    HoraFin: r.HoraFin,
    Observacion: r.Observacion ?? '',
  }));
}

/**
 * Obtener reportes para un RANGO de días aplicando el mismo turno a cada día.
 * desdeStr/hastaStr: 'YYYY-MM-DD' (inclusive)
 */
export async function getReportesPorTurnoRango(
  desdeStr: string,
  hastaStr: string,
  startHourLocal: number,
  endHourLocal: number
): Promise<ReporteDiseño[]> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(desdeStr) || !/^\d{4}-\d{2}-\d{2}$/.test(hastaStr)) {
    throw new Error('Fechas deben ser YYYY-MM-DD');
  }

  const desde = new Date(desdeStr + 'T00:00:00');
  const hasta = new Date(hastaStr + 'T00:00:00');
  if (isNaN(desde.getTime()) || isNaN(hasta.getTime())) throw new Error('Fecha inválida');

  const ors: any[] = [];
  for (let cur = new Date(desde); cur <= hasta; cur.setDate(cur.getDate() + 1)) {
    const y = cur.getFullYear();
    const m = cur.getMonth() + 1;
    const day = cur.getDate();
    const dayStr = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const { startUtc, endUtc } = intervalForLocalDay(dayStr, startHourLocal, endHourLocal);

    ors.push({
      FechaRegistro: {
        gte: startUtc,
        lt: endUtc,
      },
    });
  }

  if (ors.length === 0) return [];

  const records = await prisma.reporteDiseño.findMany({
    where: {
      OR: ors,
    },
    include: { TipoSeccion: true, Empleados: true },
    orderBy: { FechaRegistro: 'desc' },
  });

  return records.map(r => ({
    Id: r.Id,
    Empleado: `${r.Empleados.nombre} ${r.Empleados.apellido}`,
    TipoSeccion: r.TipoSeccion.Nombre,
    SeccionId: r.SeccionId,
    FechaRegistro: r.FechaRegistro,
    PaginaInicio: r.PaginaInicio,
    PaginaFin: r.PaginaFin,
    HoraInicio: r.HoraInicio,
    HoraFin: r.HoraFin,
    Observacion: r.Observacion ?? '',
  }));
}

