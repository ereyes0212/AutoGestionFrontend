/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { getSession } from "@/auth";
import { TipoSolicitudVacacion } from "@/lib/generated/prisma";
import { prisma } from "@/lib/prisma";
import { EmailService } from "@/lib/sendEmail";
import { solicitudCreadaTemplate, SolicitudData, solicitudParaAprobadorTemplate } from "@/lib/templates/solicitudVacacionesEmail";
import { randomUUID } from "crypto";
import {
  Aprobacion,
  SolicitudAprobacion,
  SolicitudCreateInput,
  SolicitudHistoricoUpdateInput,
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
      tipoSolicitud: (r as any).TipoSolicitud ?? "VACACION",
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
      nombreEmpleado: r.SolicitudVacacion.Empleados.nombre
        ? `${r.SolicitudVacacion.Empleados.nombre} ${r.SolicitudVacacion.Empleados.apellido}`
        : "",
      puestoId: r.SolicitudVacacion.Puesto.Nombre ?? "",
      puesto: r.ConfiguracionAprobacion.Puesto?.Nombre ?? "",
      fechaSolicitud: fechaSolicitudStr,
      fechaInicio: fechaInicioStr,
      fechaFin: fechaFinStr,
      diasSolicitados,
      descripcion: parent.Descripcion ?? "",
      tipoSolicitud: (parent as any).TipoSolicitud ?? "VACACION",
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
        ? `${r.SolicitudVacacion.Empleados.nombre} ${r.SolicitudVacacion.Empleados.apellido}`
        : "",
      puestoId: r.ConfiguracionAprobacion.puesto_id ?? "",
      puesto: r.SolicitudVacacion.Puesto.Nombre ?? r.SolicitudVacacion.Descripcion,
      fechaSolicitud: fechaSolicitudStr,
      fechaInicio: fechaInicioStr,
      fechaFin: fechaFinStr,
      diasSolicitados,
      descripcion: parent.Descripcion ?? "",
      tipoSolicitud: (parent as any).TipoSolicitud ?? "VACACION",
      periodo: parent.Periodo ?? null,
      diasGozados: parent.DiasGozados ?? null,
      diasRestantes: parent.DiasRestantes ?? null,
      fechaPresentacion: parent.FechaPresentacion ? parent.FechaPresentacion.toISOString() : null,
    };
  });
}

/**
 * Actualiza una solicitud del histórico con los campos editables.
 */
export async function updateSolicitudHistorico({
  idSolicitud,
  periodo,
  diasGozados,
  diasRestantes,
  fechaPresentacion,
  comentario,
}: SolicitudHistoricoUpdateInput) {
  const session = await getSession();
  const idEmp = session?.IdEmpleado;
  if (!idEmp) {
    throw new Error("Empleado no autenticado");
  }

  // Verificar que el usuario tiene una aprobación relacionada con esta solicitud
  const aprobacion = await prisma.solicitudVacacionAprobacion.findFirst({
    where: {
      SolicitudVacacionId: idSolicitud,
      EmpleadoAprobadorId: idEmp,
      NOT: { Estado: "Pendiente" },
    },
  });

  if (!aprobacion) {
    throw new Error("No tienes permisos para editar esta solicitud");
  }

  // Construir el objeto de datos para actualizar solo los campos proporcionados
  const updateData: any = {};
  if (periodo !== undefined) {
    updateData.Periodo = periodo;
  }
  if (diasGozados !== undefined) {
    updateData.DiasGozados = diasGozados;
  }
  if (diasRestantes !== undefined) {
    updateData.DiasRestantes = diasRestantes;
  }
  if (fechaPresentacion !== undefined) {
    updateData.FechaPresentacion = fechaPresentacion ? new Date(fechaPresentacion) : null;
  }

  // Actualizar la solicitud
  const solicitud = await prisma.solicitudVacacion.update({
    where: { Id: idSolicitud },
    data: updateData,
    include: {
      Empleados: true,
      Puesto: true,
    },
  });

  // Si se proporciona comentario, actualizar también la aprobación
  if (comentario !== undefined) {
    await prisma.solicitudVacacionAprobacion.update({
      where: { Id: aprobacion.Id },
      data: {
        Comentarios: comentario,
      },
    });
  }

  // Si se actualizaron los días restantes y no es null, actualizar también en el empleado
  if (diasRestantes !== undefined && diasRestantes !== null) {
    await prisma.empleados.update({
      where: { id: solicitud.EmpleadoId },
      data: { Vacaciones: diasRestantes },
    });
  }

  return {
    id: solicitud.Id,
    periodo: solicitud.Periodo,
    diasGozados: solicitud.DiasGozados,
    diasRestantes: solicitud.DiasRestantes,
    fechaPresentacion: solicitud.FechaPresentacion ? solicitud.FechaPresentacion.toISOString() : null,
  };
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
    diasGozados: r.DiasGozados ?? 0,
    diasRestantes: r.DiasRestantes ?? 0,
    aprobado: r.Aprobado ?? null,
    descripcion: r.Descripcion ?? "",
    tipoSolicitud: (r as any).TipoSolicitud ?? "VACACION",
    aprobaciones,
    periodo: r.Periodo ?? "",
    fechaPresentacion: r.FechaPresentacion?.toISOString() ?? "",
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
      TipoSolicitud: solicitud.tipoSolicitud as TipoSolicitudVacacion,
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
    tipoSolicitud: (r as any).TipoSolicitud ?? "VACACION",
    aprobaciones: [], // no se devuelven aquí
  };
}

/**
 * Procesa la aprobación (o rechazo) de una solicitud de vacaciones.
 */
export async function processApproval({
  id,
  nivel,
  aprobado,
  comentarios,
  diasRestantes,
  diasGozados,
  periodo,
  fechaPresentacion,
}: {
  id: string;
  nivel: number;
  aprobado: boolean;
  comentarios: string;
  diasRestantes: number;
  diasGozados: number;
  periodo: string;
  fechaPresentacion: string;
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

  const solicitudId = r.SolicitudVacacionId;

  // Buscar todas las aprobaciones para esta solicitud
  const aprobaciones = await prisma.solicitudVacacionAprobacion.findMany({
    where: { SolicitudVacacionId: solicitudId },
    select: { Estado: true },
  });

  const estados = aprobaciones.map(a => a.Estado);

  const todasAprobadas = estados.every(e => e === "Aprobado");
  const algunaRechazada = estados.some(e => e === "Rechazado");

  if (algunaRechazada) {
    await prisma.solicitudVacacion.update({
      where: { Id: solicitudId },
      data: {
        Aprobado: false,
        DiasGozados: diasGozados,
        DiasRestantes: diasRestantes,
        Periodo: periodo,
        FechaPresentacion: fechaPresentacion ? new Date(fechaPresentacion) : null,
      },
    });
  } else if (todasAprobadas) {
    await prisma.solicitudVacacion.update({
      where: { Id: solicitudId },
      data: {
        Aprobado: true,
        DiasGozados: diasGozados,
        DiasRestantes: diasRestantes,
        Periodo: periodo,
        FechaPresentacion: fechaPresentacion ? new Date(fechaPresentacion) : null,
      },
    });
  }

  await prisma.empleados.update({
    where: { id: r.SolicitudVacacion.Empleados.id },
    data: { Vacaciones: diasRestantes },
  });

  // Preparar la respuesta
  const parent = r.SolicitudVacacion;
  const fechaSolicitudStr = parent.FechaSolicitud.toISOString();
  const fechaInicioStr = parent.FechaInicio.toISOString();
  const fechaFinStr = parent.FechaFin.toISOString();
  const diasSolicitados = calcularDiasSolicitados(parent.FechaInicio, parent.FechaFin);

  return {
    id: r.Id,
    idSolicitud: solicitudId,
    nivel: r.Nivel,
    aprobado,
    comentario: comentarios,
    fechaAprobacion: now.toISOString(),
    empleadoId: r.EmpleadoAprobadorId,
    nombreEmpleado: r.Empleados ? `${r.Empleados.nombre} ${r.Empleados.apellido}` : "",
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
      TipoSolicitud: (data.tipoSolicitud ?? "VACACION") as TipoSolicitudVacacion,
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
    empleadoNombre: `${r.Empleados?.nombre ?? ""} ${r.Empleados?.apellido ?? ""}`,
    fechaInicio,
    fechaFin,
    descripcion: data.descripcion,
    tipoSolicitud: data.tipoSolicitud ?? "VACACION",
  };

  // 5.1️⃣ Email al solicitante
  if (r.Empleados?.correo) {
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
    r.SolicitudVacacionAprobacion.map(async (ap: { Empleados?: { correo?: string | null } | null; Nivel: number }) => {
      const mail = ap.Empleados?.correo;
      if (!mail) return;
      const nivel = ap.Nivel;
      const linkRevisar = `${baseUrl}solicitudes/aprobacion`;
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

  const aprobacionesOut: Aprobacion[] = r.SolicitudVacacionAprobacion.map((a: { Id: string; Nivel: number; EmpleadoAprobadorId: string | null; Empleados: { nombre: string; apellido: string } | null; ConfiguracionAprobacion: { puesto_id: string | null } }) => ({
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

  const ultimoComentario = aprobacionesOut.length
    ? aprobacionesOut[aprobacionesOut.length - 1].comentario
    : null;

  return {
    id: r.Id,
    empleadoId: r.EmpleadoId,
    nombreEmpleado: dto.empleadoNombre,
    puestoId: r.PuestoId,
    tipoSolicitud: (r as any).TipoSolicitud ?? "VACACION",
    fechaSolicitud: fechaSolicitudStr,
    fechaInicio: fechaInicioStr,
    fechaFin: fechaFinStr,
    diasSolicitados,
    aprobado: null,
    descripcion: r.Descripcion,
    aprobaciones: aprobacionesOut,
    ultimoComentario,
  };
}
