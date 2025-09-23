import { EventInput } from "@fullcalendar/core";
import { clsx, type ClassValue } from "clsx";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { twMerge } from "tailwind-merge";
import { EstadoTarea, Tarea } from "./generated/prisma";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatLempiras(amount: number): string {
  return new Intl.NumberFormat("es-HN", {
    style: "currency",
    currency: "HNL",
    minimumFractionDigits: 2,
  }).format(amount);
}


export const formatearFecha = (fecha: string) => {
  if (!fecha) return "N/A"
  try {
    return format(new Date(fecha), "dd 'de' MMMM 'de' yyyy", { locale: es })
  } catch {
    return "Fecha inválida"
  }
}

export function parseTimeToTodayDate(time: string): Date {
  const [hours, minutes, seconds = '0'] = time.split(':');
  const now = new Date();
  now.setHours(Number(hours), Number(minutes), Number(seconds), 0);
  return now;
}

export const calcularEdad = (birthDate: Date): number => {
  const today = new Date()
  const age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    return age - 1
  }
  return age
}

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "USD",
  }).format(amount)
}

export const calculateServiceDuration = (startDate: Date) => {
  const today = new Date();

  let years = today.getFullYear() - startDate.getFullYear();
  let months = today.getMonth() - startDate.getMonth();
  let days = today.getDate() - startDate.getDate();

  // Ajustar si los días son negativos
  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += prevMonth.getDate();
  }

  // Ajustar si los meses son negativos
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  return { years, months, days };
};


export const getEmployeeStatus = (
  isActive: boolean,
): { label: string; variant: "default" | "secondary" | "destructive" } => {
  return isActive ? { label: "Activo", variant: "default" } : { label: "Inactivo", variant: "secondary" }
}

export function mapTareasToEvents(tareas: Tarea[]): EventInput[] {
  return tareas.map((t) => ({
    id: t.id,
    title: t.titulo,
    start: t.fechaInicio,
    end: t.fechaFin ?? undefined,
    allDay: t.todoDia,
    extendedProps: {
      estado: t.estado,
      prioridad: t.prioridad,
    },
  }));
}



const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const isBetweenInclusive = (date: Date, start: Date, end?: Date | null) => {
  const t = startOfDay(date).getTime();
  const s = startOfDay(start).getTime();
  const e = end ? startOfDay(end).getTime() : s;
  return t >= s && t <= e;
};


export function normalizeDate(value: Date | string) {
  if (value instanceof Date) return value;
  return value ? new Date(value) : null;
}


export function estadoToBadgeText(estado: EstadoTarea) {
  switch (estado) {
    case "PENDIENTE":
      return "Pendiente";
    case "EN_PROGRESO":
      return "En progreso";
    case "COMPLETADA":
      return "Completada";
    case "CANCELADA":
      return "Cancelada";
    default:
      return estado;
  }
}


export function formatTimeRange(start?: Date | null, end?: Date | null, todoDia?: boolean) {
  if (todoDia) return "Todo el día";
  if (!start) return "-";
  const s = start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (!end) return s;
  const e = end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return `${s} - ${e}`;
}
