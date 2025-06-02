'use server';

import { getSession } from '@/auth';
import { prisma } from '@/lib/prisma';
import { parseTimeToTodayDate } from '@/lib/utils';
import { randomUUID } from 'crypto';
import { ReporteDiseño } from './type';

/**
 * Obtiene todos los reportes de diseño.
 */
export async function getReportesDiseño(): Promise<ReporteDiseño[]> {
  const records = await prisma.reporteDise_o.findMany({
    include: { TipoSeccion: true, Empleados: true },
    orderBy: { FechaRegistro: 'desc' },
  });

  return records.map(r => ({
    id: r.Id,
    empleado: `${r.Empleados.nombre} ${r.Empleados.apellido}`,
    tipoSeccion: r.TipoSeccion.Nombre,
    tipoSeccionId: r.SeccionId,
    fechaRegistro: r.FechaRegistro.toISOString(),
    paginaInicio: r.PaginaInicio.toString(),
    paginaFin: r.PaginaFin.toString(),
    horaInicio: r.HoraInicio.toISOString(),
    horaFin: r.HoraFin.toISOString(),
    observacion: r.Observacion ?? '',
  }));
}



/**
 * Obtiene un reporte de diseño por ID.
 */
export async function getReporteDiseñoById(id: string): Promise<ReporteDiseño | null> {
  const r = await prisma.reporteDise_o.findUnique({
    where: { Id: id },
    include: { TipoSeccion: true, Empleados: true },
  });

  if (!r) return null;

  return {
    id: r.Id,
    empleado: `${r.Empleados.nombre} ${r.Empleados.apellido}`,
    tipoSeccion: r.TipoSeccion.Nombre,
    tipoSeccionId: r.SeccionId,
    fechaRegistro: r.FechaRegistro.toISOString(),
    paginaInicio: r.PaginaInicio.toString(),
    paginaFin: r.PaginaFin.toString(),
    horaInicio: r.HoraInicio.toISOString(),
    horaFin: r.HoraFin.toISOString(),
    observacion: r.Observacion ?? '',
  };
}

/**
 * Crea un nuevo reporte de diseño.
 */
export async function createReporteDiseño(data: ReporteDiseño): Promise<ReporteDiseño> {
  const session = await getSession();
  if (!session || !session.IdEmpleado) {
    throw new Error('Empleado no autenticado');
  }

  const now = new Date();

  const r = await prisma.reporteDise_o.create({
    data: {
      Id: randomUUID(),
      EmpleadoId: session.IdEmpleado,
      SeccionId: data.tipoSeccionId,
      FechaRegistro: now,
      PaginaInicio: Number(data.paginaInicio),
      PaginaFin: Number(data.paginaFin),
      HoraInicio: parseTimeToTodayDate(data.horaInicio),
      HoraFin: parseTimeToTodayDate(data.horaFin),
      Observacion: data.observacion,
      created_at: now,
    },
    include: { TipoSeccion: true, Empleados: true },
  });

  return {
    id: r.Id,
    empleado: `${r.Empleados.nombre} ${r.Empleados.apellido}`,
    tipoSeccion: r.TipoSeccion.Nombre,
    tipoSeccionId: r.SeccionId,
    fechaRegistro: r.FechaRegistro.toISOString(),
    paginaInicio: r.PaginaInicio.toString(),
    paginaFin: r.PaginaFin.toString(),
    horaInicio: r.HoraInicio.toISOString(),
    horaFin: r.HoraFin.toISOString(),
    observacion: r.Observacion ?? '',
  };
}

/**
 * Actualiza un reporte de diseño existente.
 */
// export async function updateReporteDiseño(input: unknown): Promise<ReporteDiseño | null> {
//   const dto = ReporteDisenoDTOSchema.parse(input);
//   if (!dto.id) return null;

//   const now = new Date();

//   const r = await prisma.reporteDise_o.update({
//     where: { Id: dto.id },
//     data: {
//       SeccionId: dto.SeccionId,
//       PaginaInicio: dto.PaginaInicio,
//       PaginaFin: dto.PaginaFin,
//       HoraInicio: dto.HoraInicio,
//       HoraFin: dto.HoraFin,
//       Observacion: dto.Observacion,
//       Updated_at: now,
//       modificado_por: 'Sistema',
//     },
//     include: { TipoSeccion: true, Empleados: true },
//   });

//   return {
//     id: r.Id,
//     empleado: `${r.Empleados.nombre} ${r.Empleados.apellido}`,
//     tipoSeccion: r.TipoSeccion.Nombre,
//     tipoSeccionId: r.SeccionId,
//     fechaRegistro: r.FechaRegistro.toISOString(),
//     paginaInicio: r.PaginaInicio.toString(),
//     paginaFin: r.PaginaFin.toString(),
//     horaInicio: r.HoraInicio.toISOString(),
//     horaFin: r.HoraFin.toISOString(),
//     observacion: r.Observacion ?? '',
//   };
// }
