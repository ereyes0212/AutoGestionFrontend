// Cálculos y argumentos de ffmpeg. Funciones puras (sin procesos), para poder probarlas.

export const LADO_CORTO_MAX = 720;

/**
 * Contenedores aceptados: lo que graban los celulares y exportan los editores
 * (mov cubre mp4/m4v/3gp; matroska cubre webm). Todo lo demás se rechaza, en especial
 * HLS (.m3u8) y concat: un "video" que en realidad es una playlist puede hacer que
 * ffmpeg lea archivos del servidor o haga peticiones de red.
 */
export const FORMATOS_ENTRADA = "mov,matroska,avi,mpegts,mpeg";

/** Opciones que van ANTES de cada `-i` / archivo de entrada: solo archivos locales y solo esos contenedores. */
export const OPCIONES_ENTRADA_SEGURA = ["-protocol_whitelist", "file", "-format_whitelist", FORMATOS_ENTRADA];

export type PistaVideo = {
  codec_type?: string;
  codec_name?: string;
  width?: number;
  height?: number;
  tags?: Record<string, string>;
  side_data_list?: Array<{ rotation?: number | string }>;
};

/** Rotación que guarda el celular (side data "Display Matrix" o el tag antiguo "rotate"). */
export function rotacionDe(pista: PistaVideo): number {
  const lateral = pista.side_data_list?.find((d) => d.rotation !== undefined);
  const valor = Number(lateral?.rotation ?? pista.tags?.rotate ?? 0);
  return Number.isFinite(valor) ? valor : 0;
}

const par = (n: number) => Math.max(2, Math.round(n / 2) * 2);

/**
 * Dimensiones finales del video: ya rotadas como se ven en el celular,
 * con el lado corto ≤ 720 px, sin agrandar nunca y siempre pares (requisito de H.264).
 */
export function dimensionesSalida(pista: PistaVideo): { ancho: number; alto: number } {
  let ancho = Number(pista.width);
  let alto = Number(pista.height);
  if (!ancho || !alto) throw new Error("El video no tiene dimensiones válidas");

  if (Math.abs(rotacionDe(pista)) % 180 === 90) [ancho, alto] = [alto, ancho];

  const escala = Math.min(1, LADO_CORTO_MAX / Math.min(ancho, alto));
  return { ancho: par(ancho * escala), alto: par(alto * escala) };
}

/** Segundo del que se saca la portada: 1 s, o la mitad si el video dura menos de 2 s. */
export function segundoPortada(duracionSeg: number): number {
  return Number.isFinite(duracionSeg) && duracionSeg > 0 ? Math.min(1, duracionSeg / 2) : 0;
}

/**
 * `hilos`: núcleos que puede usar ffmpeg (decodificar + codificar). Con 1 la conversión tarda más
 * pero deja el resto del CPU libre para Autogestión.
 */
export function argumentosConversion(o: {
  entrada: string;
  salida: string;
  ancho: number;
  alto: number;
  hilos?: number;
}): string[] {
  const hilos = String(Math.max(1, Math.floor(o.hilos ?? 1)));
  return [
    "-hide_banner", "-nostdin", "-y",
    ...OPCIONES_ENTRADA_SEGURA,
    "-threads", hilos,
    "-i", o.entrada,
    "-threads", hilos,
    "-filter_threads", "1",
    "-map", "0:v:0", "-map", "0:a:0?",
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-profile:v", "high", "-pix_fmt", "yuv420p",
    "-vf", `scale=${o.ancho}:${o.alto}`,
    "-c:a", "aac", "-b:a", "128k", "-ac", "2",
    "-movflags", "+faststart",
    o.salida,
  ];
}

export function argumentosPortada(o: { entrada: string; salida: string; segundo: number }): string[] {
  return [
    "-hide_banner", "-nostdin", "-y",
    "-ss", String(o.segundo),
    ...OPCIONES_ENTRADA_SEGURA,
    "-i", o.entrada,
    "-frames:v", "1", "-q:v", "3",
    o.salida,
  ];
}
