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
