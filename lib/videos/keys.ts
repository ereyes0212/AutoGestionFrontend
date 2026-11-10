// Claves de S3 del módulo de videos. Funciones puras.
//
// Todo el bucket es PRIVADO. Estructura:
//   {prefix}/originales/{id}                ← archivo tal como lo subió el periodista
//   {prefix}/convertidos/{id}/video.mp4     ← MP4 listo; el lector lo baja con una URL firmada temporal
//   {prefix}/convertidos/{id}/poster.jpg

export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function esIdVideoValido(id: unknown): id is string {
  return typeof id === "string" && UUID_REGEX.test(id);
}

export function normalizarPrefijo(prefijo: string): string {
  return prefijo.trim().replace(/^\/+|\/+$/g, "");
}

function unir(...partes: string[]): string {
  return partes.map(normalizarPrefijo).filter(Boolean).join("/");
}

export function claveOriginal(prefijo: string, id: string): string {
  return unir(prefijo, "originales", id);
}

export function claveVideoMp4(prefijo: string, id: string): string {
  return unir(prefijo, "convertidos", id, "video.mp4");
}

export function clavePoster(prefijo: string, id: string): string {
  return unir(prefijo, "convertidos", id, "poster.jpg");
}
