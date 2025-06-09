/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { getSession } from "@/auth";
import { prisma } from "@/lib/prisma";
import { EmailService } from "@/lib/sendEmail";
import { solicitudCreadaTemplate, SolicitudData, solicitudParaAprobadorTemplate } from "@/lib/templates/solicitudVacacionesEmail";
import { randomUUID } from "crypto";
import {
  Aprobacion,
  SolicitudAprobacion,
  SolicitudCreateInput,
  SolicitudPermiso
} from "./type";

/**
 * Calcula los días solicitados (incluyendo ambos extremos).
 */
function calcularDiasSolicitados(fechaInicio: Date, fechaFin: Date): number {
  const diffMs = fechaFin.getTime() - fechaInicio.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
}

/**
 * Obtiene todas las solicitudes de vacaciones del empleado autenticado,
 * junto con su historial de aprobaciones.
 */
export async function getSolicitudesByEmpleado(): Promise<SolicitudPermiso[]> {
  const session = await getSession();
  const idEmp = session?.IdEmpleado;
  if (!idEmp) {
    console.error("Empleado no autenticado");
    return [];
  }

  const records = await prisma.solicitudVacacion.findMany({
    where: { EmpleadoId: idEmp },
    orderBy: { FechaSolicitud: "desc" },
    include: {
      Empleados: true,
      Puesto: true,
      SolicitudVacacionAprobacion: {
        orderBy: { Nivel: "asc" },
        include: {
          Empleados: true,
          ConfiguracionAprobacion: { include: { Puesto: true } },
        },
      },
    },
  });
  return records.map(r => {
    const fechaSolicitudStr = r.FechaSolicitud.toISOString();
    const fechaInicioStr = r.FechaInicio.toISOString();
    const fechaFinStr = r.FechaFin.toISOString();
    const diasSolicitados = calcularDiasSolicitados(r.FechaInicio, r.FechaFin);

    const aprobaciones: Aprobacion[] = r.SolicitudVacacionAprobacion.map(a => ({
      id: a.Id,
      nivel: a.Nivel,
      aprobado:
        a.Estado === "Aprobado" ? true : a.Estado === "Rechazado" ? false : null,
      comentario: a.Comentarios ?? null,
      fechaAprobacion: a.FechaDecision?.toISOString() ?? null,
      empleadoId: a.EmpleadoAprobadorId ?? null,
      nombreEmpleado: a.Empleados
        ? `${a.Empleados.nombre} ${a.Empleados.apellido}`
        : null,
      puestoId: a.ConfiguracionAprobacion.puesto_id ?? null,
      fechaSolicitud: fechaSolicitudStr,
      fechaInicio: fechaInicioStr,
      fechaFin: fechaFinStr,
      diasSolicitados,
      descripcion: r.Descripcion ?? null,
    }));

    return {
      id: r.Id,
      empleadoId: r.EmpleadoId,
      nombreEmpleado: `${r.Empleados.nombre} ${r.Empleados.apellido}`,
      puestoId: r.Puesto.Id,
      puesto: r.Puesto.Nombre,
      fechaSolicitud: fechaSolicitudStr,
      fechaInicio: fechaInicioStr,
      fechaFin: fechaFinStr,
      diasSolicitados,
      aprobado: r.Aprobado ?? null,
      descripcion: r.Descripcion ?? "",
      aprobaciones,
    };
  });
}

/**
 * Obtiene todas las solicitudes pendientes de aprobación para el empleado autenticado.
 */
export async function getSolicitudesAprobaciones(): Promise<SolicitudAprobacion[]> {
  const session = await getSession();
  const idEmp = session?.IdEmpleado;
  if (!idEmp) {
    console.error("Empleado no autenticado");
    return [];
  }

  const records = await prisma.solicitudVacacionAprobacion.findMany({
    where: { EmpleadoAprobadorId: idEmp, Estado: "Pendiente" },
    include: {
      SolicitudVacacion: {
        include: {
          Empleados: true,
          Puesto: true,
        },
      },
      ConfiguracionAprobacion: { include: { Puesto: true } },
      Empleados: true,
    },
    orderBy: { Nivel: "asc" },
  });

  return records.map(r => {
    const parent = r.SolicitudVacacion;
    const fechaSolicitudStr = parent.FechaSolicitud.toISOString();
    const fechaInicioStr = parent.FechaInicio.toISOString();
    const fechaFinStr = parent.FechaFin.toISOString();
    const diasSolicitados = calcularDiasSolicitados(
      parent.FechaInicio,
      parent.FechaFin
    );

    return {
      id: r.Id,
      idSolicitud: r.SolicitudVacacionId,
      nivel: r.Nivel,
      aprobado: r.Estado,
      comentario: null,
      fechaAprobacion: "",
      empleadoId: r.EmpleadoAprobadorId ?? "",
      nombreEmpleado: r.Empleados
        ? `${r.Empleados.nombre} ${r.Empleados.apellido}`
        : "",
      puestoId: r.ConfiguracionAprobacion.puesto_id ?? "",
      puesto: r.ConfiguracionAprobacion.Puesto?.Nombre ?? "",
      fechaSolicitud: fechaSolicitudStr,
      fechaInicio: fechaInicioStr,
      fechaFin: fechaFinStr,
      diasSolicitados,
      descripcion: parent.Descripcion ?? "",
    };
  });
}

/**
 * Obtiene el histórico de aprobaciones (ya procesadas) para el empleado autenticado.
 */
export async function getSolicitudesAprobacionesHistorico(): Promise<SolicitudAprobacion[]> {
  const session = await getSession();
  const idEmp = session?.IdEmpleado;
  if (!idEmp) {
    console.error("Empleado no autenticado");
    return [];
  }

  const records = await prisma.solicitudVacacionAprobacion.findMany({
    where: {
      EmpleadoAprobadorId: idEmp,
      NOT: { Estado: "Pendiente" },
    },
    include: {
      SolicitudVacacion: {
        include: {
          Empleados: true,
          Puesto: true,
        },
      },
      ConfiguracionAprobacion: { include: { Puesto: true } },
      Empleados: true,
    },
    orderBy: { FechaDecision: "desc" },
  });

  return records.map(r => {
    const parent = r.SolicitudVacacion;
    const fechaSolicitudStr = parent.FechaSolicitud.toISOString();
    const fechaInicioStr = parent.FechaInicio.toISOString();
    const fechaFinStr = parent.FechaFin.toISOString();
    const diasSolicitados = calcularDiasSolicitados(
      parent.FechaInicio,
      parent.FechaFin
    );

    return {
      id: r.Id,
      idSolicitud: r.SolicitudVacacionId,
      nivel: r.Nivel,
      aprobado: r.Estado,
      comentario: r.Comentarios,
      fechaAprobacion: r.FechaDecision ? r.FechaDecision.toISOString() : "",
      empleadoId: r.EmpleadoAprobadorId ?? "",
      nombreEmpleado: r.Empleados
        ? `${r.Empleados.nombre} ${r.Empleados.apellido}`
        : "",
      puestoId: r.ConfiguracionAprobacion.puesto_id ?? "",
      puesto: r.ConfiguracionAprobacion.Puesto?.Nombre ?? r.ConfiguracionAprobacion.Descripcion,
      fechaSolicitud: fechaSolicitudStr,
      fechaInicio: fechaInicioStr,
      fechaFin: fechaFinStr,
      diasSolicitados,
      descripcion: parent.Descripcion ?? "",
    };
  });
}

/**
 * Obtiene una solicitud de vacaciones por su ID, con historial de aprobaciones.
 */
export async function getSolicitudesById(id: string): Promise<SolicitudPermiso | null> {
  const r = await prisma.solicitudVacacion.findUnique({
    where: { Id: id },
    include: {
      Empleados: true,
      Puesto: true,
      SolicitudVacacionAprobacion: {
        orderBy: { Nivel: "asc" },
        include: {
          Empleados: true,
          ConfiguracionAprobacion: { include: { Puesto: true } },
        },
      },
    },
  });
  if (!r) return null;

  const fechaSolicitudStr = r.FechaSolicitud.toISOString();
  const fechaInicioStr = r.FechaInicio.toISOString();
  const fechaFinStr = r.FechaFin.toISOString();
  const diasSolicitados = calcularDiasSolicitados(r.FechaInicio, r.FechaFin);

  const aprobaciones: Aprobacion[] = r.SolicitudVacacionAprobacion.map(a => ({
    id: a.Id,
    nivel: a.Nivel,
    aprobado:
      a.Estado === "Aprobado" ? true : a.Estado === "Rechazado" ? false : null,
    comentario: a.Comentarios ?? null,
    fechaAprobacion: a.FechaDecision?.toISOString() ?? null,
    empleadoId: a.EmpleadoAprobadorId ?? null,
    nombreEmpleado: a.Empleados
      ? `${a.Empleados.nombre} ${a.Empleados.apellido}`
      : null,
    puestoId: a.ConfiguracionAprobacion.puesto_id ?? null,
    fechaSolicitud: fechaSolicitudStr,
    fechaInicio: fechaInicioStr,
    fechaFin: fechaFinStr,
    diasSolicitados,
    descripcion: r.Descripcion ?? null,
  }));

  return {
    id: r.Id,
    empleadoId: r.EmpleadoId,
    nombreEmpleado: `${r.Empleados.nombre} ${r.Empleados.apellido}`,
    puestoId: r.Puesto.Id,
    puesto: r.Puesto.Nombre,
    fechaSolicitud: fechaSolicitudStr,
    fechaInicio: fechaInicioStr,
    fechaFin: fechaFinStr,
    diasSolicitados,
    aprobado: r.Aprobado ?? null,
    descripcion: r.Descripcion ?? "",
    aprobaciones,
  };
}

/**
 * Actualiza una solicitud de vacaciones (fechas y descripción).
 */
export async function putSolicitud({ solicitud }: { solicitud: SolicitudCreateInput }) {
  const now = new Date();

  const r = await prisma.solicitudVacacion.update({
    where: { Id: solicitud.id! },
    data: {
      FechaInicio: new Date(solicitud.fechaInicio),
      FechaFin: new Date(solicitud.fechaFin),
      Descripcion: solicitud.descripcion,
    },
  });

  const fechaSolicitudStr = r.FechaSolicitud.toISOString();
  const fechaInicioStr = r.FechaInicio.toISOString();
  const fechaFinStr = r.FechaFin.toISOString();
  const diasSolicitados = calcularDiasSolicitados(r.FechaInicio, r.FechaFin);

  return {
    id: r.Id,
    empleadoId: r.EmpleadoId,
    nombreEmpleado: "", // si hace falta, repite fetch
    puestoId: r.PuestoId,
    puesto: "",         // idem
    fechaSolicitud: fechaSolicitudStr,
    fechaInicio: fechaInicioStr,
    fechaFin: fechaFinStr,
    diasSolicitados,
    aprobado: r.Aprobado ?? null,
    descripcion: r.Descripcion ?? "",
    aprobaciones: [], // no se devuelven aquí
  };
}

/**
 * Procesa la aprobación (o rechazo) de una solicitud de vacaciones.
 */
export async function processApproval({
  id,
  aprobado,
  comentarios,
}: {
  id: string;
  nivel: number;
  aprobado: boolean;
  comentarios: string;
}) {
  const now = new Date();

  const r = await prisma.solicitudVacacionAprobacion.update({
    where: { Id: id },
    data: {
      Estado: aprobado ? "Aprobado" : "Rechazado",
      Comentarios: comentarios,
      FechaDecision: now,
    },
    include: {
      SolicitudVacacion: {
        include: {
          Empleados: true,
          Puesto: true,
        },
      },
      ConfiguracionAprobacion: { include: { Puesto: true } },
      Empleados: true,
    },
  });

  const parent = r.SolicitudVacacion;
  const fechaSolicitudStr = parent.FechaSolicitud.toISOString();
  const fechaInicioStr = parent.FechaInicio.toISOString();
  const fechaFinStr = parent.FechaFin.toISOString();
  const diasSolicitados = calcularDiasSolicitados(parent.FechaInicio, parent.FechaFin);

  return {
    id: r.Id,
    idSolicitud: r.SolicitudVacacionId,
    nivel: r.Nivel,
    aprobado: aprobado ? true : false,
    comentario: comentarios,
    fechaAprobacion: now.toISOString(),
    empleadoId: r.EmpleadoAprobadorId,
    nombreEmpleado: r.Empleados
      ? `${r.Empleados.nombre} ${r.Empleados.apellido}`
      : "",
    puestoId: r.ConfiguracionAprobacion.puesto_id,
    puesto: r.ConfiguracionAprobacion.Puesto?.Nombre ?? "",
    fechaSolicitud: fechaSolicitudStr,
    fechaInicio: fechaInicioStr,
    fechaFin: fechaFinStr,
    diasSolicitados,
    descripcion: parent.Descripcion ?? "",
  };
}

/**
 * Crea una nueva solicitud de vacaciones con todos los pasos de aprobación.
 */
export async function postSolicitud({
  Solicitud: data,
}: {
  Solicitud: SolicitudCreateInput;
}) {
  const session = await getSession();
  const IdEmpleado = session?.IdEmpleado;
  const PuestoId = session?.PuestoId;
  if (!IdEmpleado || !PuestoId) {
    throw new Error("Empleado no autenticado");
  }

  // 1️⃣ Obtener configuraciones activas ordenadas por nivel
  const cfgs = await prisma.configuracionAprobacion.findMany({
    where: { Activo: true },
    orderBy: { nivel: "asc" },
    include: { Puesto: true },
  });

  // 2️⃣ Validar fechas
  const fechaInicio = new Date(data.fechaInicio);
  const fechaFin = new Date(data.fechaFin);
  if (fechaFin < fechaInicio) {
    throw new Error("FechaFin debe ser igual o posterior a FechaInicio");
  }

  // 3️⃣ Preparar array de aprobaciones
  const aprobacionesData: any[] = [];
  for (const cfg of cfgs) {
    let aprobadorId: string | null = null;
    if (cfg.Tipo === "Fijo" && cfg.puesto_id) {
      const empleadoFijo = await prisma.empleados.findFirst({
        where: { puesto_id: cfg.puesto_id },
      });
      aprobadorId = empleadoFijo?.id ?? null;
    } else {
      const jefe = await prisma.empleados.findUnique({ where: { id: IdEmpleado } });
      aprobadorId = jefe?.jefe_id ?? null;
    }
    aprobacionesData.push({
      Id: randomUUID(),
      ConfiguracionAprobacionId: cfg.Id,
      Descripcion: data.descripcion,
      Nivel: cfg.nivel,
      Estado: "Pendiente",
      EmpleadoAprobadorId: aprobadorId,
      createAt: new Date(),
    });
  }

  // 4️⃣ Crear solicitud con aprobaciones anidadas
  const now = new Date();
  const r = await prisma.solicitudVacacion.create({
    data: {
      Id: randomUUID(),
      EmpleadoId: IdEmpleado,
      PuestoId,
      FechaSolicitud: now,
      FechaInicio: fechaInicio,
      FechaFin: fechaFin,
      Descripcion: data.descripcion,
      Aprobado: null,
      SolicitudVacacionAprobacion: { create: aprobacionesData },
    },
    include: {
      Empleados: true,
      SolicitudVacacionAprobacion: {
        orderBy: { Nivel: "asc" },
        include: { Empleados: true, ConfiguracionAprobacion: true },
      },
    },
  });

  // 5️⃣ Enviar emails
  const emailService = new EmailService();

  // Datos comunes
  const dto: SolicitudData = {
    empleadoNombre: `${r.Empleados.nombre} ${r.Empleados.apellido}`,
    fechaInicio,
    fechaFin,
    descripcion: data.descripcion,
  };

  // 5.1️⃣ Email al solicitante
  if (r.Empleados.correo) {
    await emailService.sendMail({
      to: r.Empleados.correo,
      subject: `Tu solicitud de vacaciones está registrada`,
      html: solicitudCreadaTemplate(dto),
    });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  // 5.2️⃣ Emails a aprobadores
  const frontendBase = process.env.FRONTEND_URL || "";
  await Promise.all(
    r.SolicitudVacacionAprobacion.map(async (ap) => {
      const mail = ap.Empleados?.correo;
      if (!mail) return;
      const nivel = ap.Nivel;
      const linkRevisar = `${baseUrl}${frontendBase}/solicitudes/${r.Id}`;
      await emailService.sendMail({
        to: mail,
        subject: `Revisión requerida: solicitud de vacaciones nivel ${nivel}`,
        html: solicitudParaAprobadorTemplate({ ...dto, nivel, linkRevisar }),
      });
    })
  );

  // 6️⃣ Mapear a DTO de salida
  const fechaSolicitudStr = r.FechaSolicitud.toISOString();
  const fechaInicioStr = r.FechaInicio.toISOString();
  const fechaFinStr = r.FechaFin.toISOString();
  const diasSolicitados = calcularDiasSolicitados(r.FechaInicio, r.FechaFin);

  const aprobacionesOut: Aprobacion[] = r.SolicitudVacacionAprobacion.map((a) => ({
    id: a.Id,
    nivel: a.Nivel,
    aprobado: null,
    comentario: null,
    fechaAprobacion: null,
    empleadoId: a.EmpleadoAprobadorId ?? null,
    nombreEmpleado: a.Empleados ? `${a.Empleados.nombre} ${a.Empleados.apellido}` : null,
    puestoId: a.ConfiguracionAprobacion?.puesto_id ?? null,
    fechaSolicitud: fechaSolicitudStr,
    fechaInicio: fechaInicioStr,
    fechaFin: fechaFinStr,
    diasSolicitados,
    descripcion: r.Descripcion ?? null,
  }));

  return {
    id: r.Id,
    empleadoId: r.EmpleadoId,
    nombreEmpleado: dto.empleadoNombre,
    puestoId: r.PuestoId,
    fechaSolicitud: fechaSolicitudStr,
    fechaInicio: fechaInicioStr,
    fechaFin: fechaFinStr,
    diasSolicitados,
    aprobado: null,
    descripcion: r.Descripcion,
    aprobaciones: aprobacionesOut,
  };
}
