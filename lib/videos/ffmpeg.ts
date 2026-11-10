import { spawn } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { OPCIONES_ENTRADA_SEGURA, type PistaVideo } from "./ffmpeg-args";

/** Error que no se arregla reintentando (por ejemplo, el archivo no es un video). */
export class ErrorDefinitivo extends Error {}

export type InfoMedia = {
  streams: PistaVideo[];
  format?: { duration?: string };
};

export async function rutaFfmpeg(): Promise<string> {
  if (process.env.FFMPEG_PATH) return process.env.FFMPEG_PATH;
  const mod = await import("ffmpeg-static");
  const ruta = (mod.default ?? mod) as unknown as string | null;
  if (!ruta) throw new Error("No hay binario de ffmpeg para esta plataforma; configura FFMPEG_PATH");
  return ruta;
}

export async function rutaFfprobe(): Promise<string> {
  if (process.env.FFPROBE_PATH) return process.env.FFPROBE_PATH;
  const mod = await import("ffprobe-static");
  return (mod.default ?? mod).path;
}

export function correr(
  comando: string,
  args: string[],
  { prioridadBaja = false, timeoutMs = 20 * 60 * 1000 }: { prioridadBaja?: boolean; timeoutMs?: number } = {},
): Promise<string> {
  return new Promise((resolve, reject) => {
    const hijo = spawn(comando, args, { windowsHide: true });

    if (prioridadBaja && hijo.pid) {
      try {
        os.setPriority(hijo.pid, 10);
      } catch {
        /* sin permiso para bajar la prioridad: seguimos igual */
      }
    }

    let stdout = "";
    let stderr = "";
    hijo.stdout.on("data", (c) => (stdout += c));
    hijo.stderr.on("data", (c) => (stderr = (stderr + c).slice(-4000)));

    let vencido = false;
    const timer = setTimeout(() => {
      vencido = true;
      hijo.kill("SIGKILL");
    }, timeoutMs);

    hijo.on("error", (e) => {
      clearTimeout(timer);
      reject(e);
    });
    hijo.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) return resolve(stdout);
      const nombre = path.basename(comando);
      if (vencido) return reject(new Error(`${nombre} tardó demasiado y se canceló`));
      const detalle = stderr.trim().split("\n").slice(-3).join(" | ");
      reject(new Error(`${nombre} terminó con código ${code}: ${detalle}`));
    });
  });
}

export async function sondear(archivo: string): Promise<InfoMedia> {
  try {
    const salida = await correr(await rutaFfprobe(), [
      ...OPCIONES_ENTRADA_SEGURA,
      "-v", "error", "-print_format", "json", "-show_streams", "-show_format", archivo,
    ]);
    return JSON.parse(salida) as InfoMedia;
  } catch {
    throw new ErrorDefinitivo("El archivo no es un video válido");
  }
}
