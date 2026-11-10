"use server";

// La subida del archivo está en app/api/videos/subir/route.ts (navegador → servidor → S3).

import { headers } from "next/headers";
import { getSession, getSessionPermisos, type UsuarioSesion } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getUrlApp, getVideosBucketConfig } from "@/lib/videos/config";
import { generarCodigoEmbed } from "@/lib/videos/embed";
import { cacheEmbed } from "@/lib/videos/embed-server";
import { clavePoster, claveVideoMp4, esIdVideoValido } from "@/lib/videos/keys";
import { borrarObjetos, tamanoObjeto } from "@/lib/videos/storage";
import { despertarWorker } from "@/lib/videos/worker";
import type { Resultado, VideoFila } from "./types";

type Acceso =
  | { ok: false; error: string }
  | { ok: true; session: UsuarioSesion; permisos: string[] };

async function exigirPermiso(permiso: string): Promise<Acceso> {
  const [session, permisos] = await Promise.all([getSession(), getSessionPermisos()]);
  if (!session?.IdEmpleado) return { ok: false, error: "No autenticado" };
  if (!permisos?.includes(permiso)) return { ok: false, error: "No tienes permiso para esta acción" };
  return { ok: true, session, permisos };
}

/** Origen (protocolo + host) desde el que se abrió Autogestión, p. ej. http://localhost:3000. */
function origenSolicitud(): string | null {
  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return null;
  const protocolo = h.get("x-forwarded-proto")?.split(",")[0]?.trim() || (host.startsWith("localhost") ? "http" : "https");
  return `${protocolo}://${host}`;
}

function errorInterno(contexto: string, e: unknown): { ok: false; error: string } {
  console.error(`[videos] ${contexto}:`, e);
  // Los errores de configuración (variables de AWS faltantes) se muestran tal cual para poder corregirlos.
  const mensaje = e instanceof Error ? e.message : "";
  if (/^(Falta la variable|En desarrollo debes configurar|AWS_VIDEOS_PREFIX)/.test(mensaje)) {
    return { ok: false, error: mensaje };
  }
  return { ok: false, error: "Ocurrió un error inesperado. Intenta de nuevo." };
}

// ─── Listar ──────────────────────────────────────────────────────────────────

export async function listarVideos(): Promise<VideoFila[]> {
  const acceso = await exigirPermiso("ver_videos");
  if (!acceso.ok) return [];

  const videos = await prisma.video.findMany({
    orderBy: { creadoAt: "desc" },
    take: 500,
    include: { creador: { select: { nombre: true, apellido: true } } },
  });

  // El reproductor vive en Autogestión (/embed/{id}): se usa la dirección desde la que se abrió la app.
  const baseUrl = origenSolicitud() ?? getUrlApp();

  return videos.map((v) => ({
    id: v.id,
    titulo: v.titulo,
    estado: v.estado,
    nombreOriginal: v.nombreOriginal,
    tamanoBytes: Number(v.tamanoBytes),
    duracionSeg: v.duracionSeg,
    ancho: v.ancho,
    alto: v.alto,
    errorMensaje: v.errorMensaje,
    creadorEmpleadoId: v.creadorEmpleadoId,
    creador: `${v.creador.nombre} ${v.creador.apellido}`.trim(),
    creadoAt: v.creadoAt.toISOString(),
    codigo:
      v.estado === "LISTO" && v.ancho && v.alto
        ? generarCodigoEmbed({ id: v.id, titulo: v.titulo, ancho: v.ancho, alto: v.alto, baseUrl })
        : null,
  }));
}

// ─── Reintentar ──────────────────────────────────────────────────────────────

export async function reintentarVideo(id: string): Promise<Resultado> {
  const acceso = await exigirPermiso("subir_videos");
  if (!acceso.ok) return { ok: false, error: acceso.error };
  if (!esIdVideoValido(id)) return { ok: false, error: "Video inválido" };

  try {
    const video = await prisma.video.findUnique({ where: { id } });
    if (!video) return { ok: false, error: "Video no encontrado" };
    if (video.estado !== "ERROR") return { ok: false, error: "Solo se pueden reintentar videos con error" };

    if ((await tamanoObjeto(video.claveOriginal)) === null) {
      return { ok: false, error: "El archivo original ya no existe. Elimina este video y súbelo de nuevo." };
    }

    const { count } = await prisma.video.updateMany({
      where: { id, estado: "ERROR" },
      data: { estado: "EN_COLA", intentos: 0, errorMensaje: null },
    });
    if (count === 1) despertarWorker();
    return { ok: true, data: undefined };
  } catch (e) {
    return errorInterno("reintentarVideo", e);
  }
}

// ─── Eliminar ────────────────────────────────────────────────────────────────

export async function eliminarVideo(id: string): Promise<Resultado> {
  const [session, permisos] = await Promise.all([getSession(), getSessionPermisos()]);
  if (!session?.IdEmpleado) return { ok: false, error: "No autenticado" };
  if (!esIdVideoValido(id)) return { ok: false, error: "Video inválido" };

  try {
    const video = await prisma.video.findUnique({ where: { id } });
    if (!video) return { ok: false, error: "Video no encontrado" };

    // Con permiso se borra cualquiera; sin permiso, solo tus propias subidas que no quedaron listas.
    const esPropioSinPublicar = video.creadorEmpleadoId === session.IdEmpleado && video.estado !== "LISTO";
    if (!permisos?.includes("eliminar_videos") && !esPropioSinPublicar) {
      return { ok: false, error: "No tienes permiso para eliminar este video" };
    }
    if (video.estado === "PROCESANDO") {
      return { ok: false, error: "El video se está procesando. Espera a que termine para eliminarlo." };
    }

    const { prefix } = getVideosBucketConfig();
    await borrarObjetos([claveVideoMp4(prefix, id), clavePoster(prefix, id), video.claveOriginal]);
    await prisma.video.delete({ where: { id } });
    // Deja de servirse al instante desde este servidor. Si Cloudflare tenía la página guardada,
    // el video ya no existe en S3 y el reproductor muestra "Video no disponible".
    cacheEmbed.invalidar(id);
    return { ok: true, data: undefined };
  } catch (e) {
    return errorInterno("eliminarVideo", e);
  }
}
