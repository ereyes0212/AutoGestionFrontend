// Convierte los videos en segundo plano, dentro del mismo proceso de Next.
// - Un video a la vez por proceso, con ffmpeg en prioridad baja.
// - Cada video se "reclama" de forma atómica (updateMany condicionado al estado),
//   así dos instancias de la app nunca convierten el mismo.
// - Mientras convierte, actualiza actualizadoAt cada 30 s (latido). Si un video queda en
//   PROCESANDO sin latido (el servidor se reinició), vuelve a la cola.

import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { Video } from "@/lib/generated/prisma";
import { prisma } from "@/lib/prisma";
import { CACHE_INMUTABLE, getHilosFfmpeg, getVideosBucketConfig, MAX_INTENTOS } from "./config";
import { argumentosConversion, argumentosPortada, dimensionesSalida, segundoPortada } from "./ffmpeg-args";
import { correr, ErrorDefinitivo, rutaFfmpeg, sondear } from "./ffmpeg";
import { clavePoster, claveVideoMp4 } from "./keys";
import { borrarObjetos, descargarAArchivo, ObjetoNoEncontrado, subirArchivo } from "./storage";

const LATIDO_MS = 30_000;
const HUERFANO_MS = 2 * 60_000;
const TIMEOUT_FFMPEG_MS = 20 * 60_000;

type EstadoWorker = { corriendo: boolean; pendiente: boolean };
// En globalThis para que sobreviva al hot reload de desarrollo (un solo worker por proceso).
const g = globalThis as unknown as { __videosWorker?: EstadoWorker };
const estado: EstadoWorker = (g.__videosWorker ??= { corriendo: false, pendiente: false });

/** Arranca el worker si no está corriendo (no espera a que termine). */
export function despertarWorker(): void {
  if (estado.corriendo) {
    estado.pendiente = true;
    return;
  }
  estado.corriendo = true;
  void bucle()
    .catch((e) => console.error("[videos] el worker se detuvo por un error:", e))
    .finally(() => {
      estado.corriendo = false;
    });
}

async function bucle(): Promise<void> {
  do {
    estado.pendiente = false;
    await rescatarHuerfanos();
    let video: Video | null;
    while ((video = await reclamarSiguiente())) {
      await procesar(video);
    }
  } while (estado.pendiente);
}

async function rescatarHuerfanos(): Promise<void> {
  const limite = new Date(Date.now() - HUERFANO_MS);
  await prisma.video.updateMany({
    where: { estado: "PROCESANDO", actualizadoAt: { lt: limite }, intentos: { lt: MAX_INTENTOS } },
    data: { estado: "EN_COLA" },
  });
  await prisma.video.updateMany({
    where: { estado: "PROCESANDO", actualizadoAt: { lt: limite }, intentos: { gte: MAX_INTENTOS } },
    data: { estado: "ERROR", errorMensaje: "La conversión se interrumpió varias veces" },
  });
}

async function reclamarSiguiente(): Promise<Video | null> {
  for (let i = 0; i < 5; i++) {
    const siguiente = await prisma.video.findFirst({
      where: { estado: "EN_COLA" },
      orderBy: { creadoAt: "asc" },
      select: { id: true },
    });
    if (!siguiente) return null;

    const { count } = await prisma.video.updateMany({
      where: { id: siguiente.id, estado: "EN_COLA" },
      data: { estado: "PROCESANDO", intentos: { increment: 1 }, errorMensaje: null },
    });
    if (count === 1) return prisma.video.findUnique({ where: { id: siguiente.id } });
  }
  return null;
}

async function procesar(video: Video): Promise<void> {
  const { id } = video;
  const latido = setInterval(() => {
    prisma.video.update({ where: { id }, data: { actualizadoAt: new Date() } }).catch(() => {});
  }, LATIDO_MS);
  const tmp = await fsp.mkdtemp(path.join(os.tmpdir(), "autogestion-video-"));

  try {
    const { prefix } = getVideosBucketConfig();
    const ffmpeg = await rutaFfmpeg();

    const original = path.join(tmp, "original");
    await descargarAArchivo(video.claveOriginal, original);

    const info = await sondear(original);
    const pista = info.streams.find((s) => s.codec_type === "video");
    if (!pista) throw new ErrorDefinitivo("El archivo no es un video válido");

    const mp4 = path.join(tmp, "video.mp4");
    const hilos = getHilosFfmpeg();
    await correr(ffmpeg, argumentosConversion({ entrada: original, salida: mp4, hilos, ...dimensionesSalida(pista) }), {
      prioridadBaja: true,
      timeoutMs: TIMEOUT_FFMPEG_MS,
    });

    // Dimensiones y duración se leen del MP4 final (ya rotado), que es lo que usa el código embebido.
    const final = await sondear(mp4);
    const pistaFinal = final.streams.find((s) => s.codec_type === "video");
    const duracion = Number(final.format?.duration);
    if (!pistaFinal?.width || !pistaFinal?.height) throw new Error("ffmpeg no generó un video válido");

    const poster = path.join(tmp, "poster.jpg");
    await correr(ffmpeg, argumentosPortada({ entrada: mp4, salida: poster, segundo: segundoPortada(duracion) }));

    await subirArchivo(mp4, claveVideoMp4(prefix, id), "video/mp4", CACHE_INMUTABLE);
    await subirArchivo(poster, clavePoster(prefix, id), "image/jpeg", CACHE_INMUTABLE);

    await prisma.video.update({
      where: { id },
      data: {
        estado: "LISTO",
        ancho: pistaFinal.width,
        alto: pistaFinal.height,
        duracionSeg: Number.isFinite(duracion) ? Math.round(duracion) : null,
        errorMensaje: null,
      },
    });

    // El original ya no hace falta. Si falla el borrado, la regla de ciclo de vida de S3 lo limpia.
    await borrarObjetos([video.claveOriginal]).catch((e) =>
      console.error(`[videos] no se pudo borrar el original de ${id}:`, e),
    );
  } catch (e) {
    const definitivo = e instanceof ErrorDefinitivo || e instanceof ObjetoNoEncontrado;
    const mensaje = e instanceof Error ? e.message : String(e);
    const reintentar = !definitivo && video.intentos < MAX_INTENTOS;
    console.error(`[videos] error convirtiendo ${id} (intento ${video.intentos}):`, mensaje);

    await prisma.video
      .update({
        where: { id },
        data: reintentar ? { estado: "EN_COLA", errorMensaje: mensaje } : { estado: "ERROR", errorMensaje: mensaje },
      })
      .catch((err) => console.error(`[videos] no se pudo guardar el error de ${id}:`, err));
  } finally {
    clearInterval(latido);
    await fsp.rm(tmp, { recursive: true, force: true }).catch(() => {});
  }
}
