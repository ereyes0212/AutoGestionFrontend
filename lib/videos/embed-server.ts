// Instancia real del caché del reproductor: lee la base y firma URLs de S3.

import { prisma } from "@/lib/prisma";
import { CACHE_EMBED_SEG, getVideosBucketConfig } from "./config";
import { crearCacheEmbed } from "./embed-page";
import { clavePoster, claveVideoMp4 } from "./keys";
import { firmarLectura, validezFirmaSeg } from "./storage";

const SEG_NO_DISPONIBLE = 60;

async function cargar(id: string) {
  const video = await prisma.video.findUnique({ where: { id }, select: { estado: true, titulo: true } });
  if (!video || video.estado !== "LISTO") return { datos: null, ttlSeg: SEG_NO_DISPONIBLE };

  const validez = await validezFirmaSeg();
  const { prefix } = getVideosBucketConfig();
  const [urlVideo, urlPoster] = await Promise.all([
    firmarLectura(claveVideoMp4(prefix, id), validez),
    firmarLectura(clavePoster(prefix, id), validez),
  ]);

  // La página se reutiliza como mucho la mitad de lo que dura la firma (y nunca más de 10 min).
  const ttlSeg = Math.max(30, Math.min(CACHE_EMBED_SEG, Math.floor(validez / 2)));
  return { datos: { titulo: video.titulo, urlVideo, urlPoster }, ttlSeg };
}

// En globalThis para que el hot reload de desarrollo no cree varios cachés.
const g = globalThis as unknown as { __videosEmbedCache?: ReturnType<typeof crearCacheEmbed> };
export const cacheEmbed = (g.__videosEmbedCache ??= crearCacheEmbed({ cargar }));
