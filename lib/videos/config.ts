import { normalizarPrefijo } from "./keys";

export const MAX_BYTES_VIDEO = 1024 ** 3; // 1 GB
export const MAX_INTENTOS = 3;

/** Cuánto vale la URL firmada de S3 que recibe el lector (si las credenciales duran menos, se acorta). */
export const VALIDEZ_FIRMA_SEG = 6 * 60 * 60;
/** Cuánto se reutiliza la página del reproductor (memoria del servidor y Cloudflare). Mucho menor que la firma. */
export const CACHE_EMBED_SEG = 10 * 60;

/** Encabezado de caché de los archivos convertidos en S3 (nunca cambian para un mismo id). */
export const CACHE_INMUTABLE = "private, max-age=31536000, immutable";

/** Núcleos que puede usar ffmpeg al convertir (VIDEOS_FFMPEG_HILOS, por defecto 1, máximo 16). */
export function getHilosFfmpeg(): number {
  const n = Number.parseInt(process.env.VIDEOS_FFMPEG_HILOS ?? "1", 10);
  return Number.isFinite(n) ? Math.min(16, Math.max(1, n)) : 1;
}

/** Bucket y carpeta de los videos. Por defecto: el bucket privado actual, carpeta "videos". */
export function getVideosBucketConfig(): { bucket: string; prefix: string } {
  const bucket = process.env.AWS_VIDEOS_BUCKET ?? process.env.AWS_PRIVATE_BUCKET;
  if (!bucket) throw new Error("Falta la variable de entorno AWS_VIDEOS_BUCKET o AWS_PRIVATE_BUCKET");

  const prefix = normalizarPrefijo(process.env.AWS_VIDEOS_PREFIX ?? "videos");
  if (!prefix) throw new Error("AWS_VIDEOS_PREFIX no puede estar vacío: los videos deben ir en su propia carpeta");

  return { bucket, prefix };
}

/** URL pública de Autogestión (NEXT_PUBLIC_APP_URL), sin barra final. */
export function getUrlApp(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").trim().replace(/\/+$/, "");
}

/** Sitios donde se permite incrustar el reproductor (CSP frame-ancestors). */
export function getFrameAncestors(): string {
  const sitios = (process.env.VIDEOS_FRAME_ANCESTORS ?? "https://tiempo.hn https://*.tiempo.hn").trim();
  let origenApp = "";
  try {
    origenApp = new URL(getUrlApp()).origin;
  } catch {
    /* NEXT_PUBLIC_APP_URL inválida: solo se permiten los sitios configurados */
  }
  // 'self': la vista previa dentro de Autogestión (mismo origen que /embed).
  return [sitios, origenApp, "'self'"].filter(Boolean).join(" ");
}
