import { clsx, type ClassValue } from "clsx";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { twMerge } from "tailwind-merge";

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

export const calculateYearsOfService = (startDate: Date): number => {
  const today = new Date()
  const years = today.getFullYear() - startDate.getFullYear()
  const monthDiff = today.getMonth() - startDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < startDate.getDate())) {
    return years - 1
  }
  return years
}

export const getEmployeeStatus = (
  isActive: boolean,
): { label: string; variant: "default" | "secondary" | "destructive" } => {
  return isActive ? { label: "Activo", variant: "default" } : { label: "Inactivo", variant: "secondary" }
}


