import type { VideoEstado } from "../types";

export const ETIQUETA_ESTADO: Record<VideoEstado, string> = {
  SUBIENDO: "Subida incompleta",
  EN_COLA: "En cola",
  PROCESANDO: "Procesando…",
  LISTO: "Listo",
  ERROR: "Error",
};

export const CLASE_ESTADO: Record<VideoEstado, string> = {
  SUBIENDO: "bg-muted text-muted-foreground",
  EN_COLA: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  PROCESANDO: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  LISTO: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  ERROR: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200",
};

export function formatoDuracion(segundos: number | null): string {
  if (segundos == null) return "—";
  const m = Math.floor(segundos / 60);
  const s = String(segundos % 60).padStart(2, "0");
  return `${m}:${s}`;
}

export function formatoTamano(bytes: number): string {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

export function formatoFecha(iso: string): string {
  return new Date(iso).toLocaleString("es-HN", {
    timeZone: "America/Tegucigalpa",
    dateStyle: "short",
    timeStyle: "short",
  });
}
