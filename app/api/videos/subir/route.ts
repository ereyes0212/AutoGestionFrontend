// Subida de videos: navegador → este servidor → S3 (mismo patrón que facturas y firmas,
// sin CORS en el bucket). Para aguantar archivos de hasta 1 GB, el cuerpo se recibe por
// streaming a un archivo temporal (no se carga en memoria ni se pasa a base64).
//
// El navegador envía el archivo crudo como cuerpo, con el título y el nombre en cabeceras:
//   X-Video-Titulo, X-Video-Nombre (ambas con encodeURIComponent)

import { randomUUID } from "node:crypto";
import fs from "node:fs";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Readable, Transform } from "node:stream";
import type { ReadableStream as WebReadableStream } from "node:stream/web";
import { pipeline } from "node:stream/promises";
import { NextResponse } from "next/server";
import { getSession, getSessionPermisos } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getVideosBucketConfig, MAX_BYTES_VIDEO } from "@/lib/videos/config";
import { claveOriginal } from "@/lib/videos/keys";
import { borrarObjetos, subirArchivo } from "@/lib/videos/storage";
import { despertarWorker } from "@/lib/videos/worker";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

class ErrorUsuario extends Error {}

function error(status: number, mensaje: string) {
  return NextResponse.json({ ok: false, error: mensaje }, { status });
}

function cabecera(req: Request, nombre: string): string | null {
  const valor = req.headers.get(nombre);
  if (valor === null) return null;
  try {
    return decodeURIComponent(valor);
  } catch {
    return "";
  }
}

/** La petición debe venir de la propia app (defensa contra CSRF, además de la cookie Lax). */
function esMismoOrigen(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true; // navegadores siempre lo mandan en POST; sin Origin no es un formulario cruzado
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    return !!host && new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const [session, permisos] = await Promise.all([getSession(), getSessionPermisos()]);
  if (!session?.IdEmpleado) return error(401, "No autenticado");
  if (!permisos?.includes("subir_videos")) return error(403, "No tienes permiso para subir videos");
  if (!esMismoOrigen(req)) return error(403, "Origen no permitido");

  // Cabecera obligatoria: un formulario HTML de otro sitio no puede enviarla.
  const titulo = cabecera(req, "x-video-titulo")?.trim();
  if (titulo === undefined) return error(400, "Falta el título");
  if (!titulo) return error(400, "El título es obligatorio");
  if (titulo.length > 200) return error(400, "El título admite máximo 200 caracteres");
  const nombreArchivo = (cabecera(req, "x-video-nombre")?.trim() || "video").slice(0, 255);

  const declarado = Number(req.headers.get("content-length"));
  if (!Number.isFinite(declarado) || declarado <= 0) return error(411, "Falta el tamaño del archivo");
  if (declarado > MAX_BYTES_VIDEO) return error(413, "El archivo supera 1 GB");
  if (!req.body) return error(400, "No se recibió el archivo");

  const id = randomUUID();
  let clave: string;
  try {
    clave = claveOriginal(getVideosBucketConfig().prefix, id); // valida la configuración antes de leer el cuerpo
  } catch (e) {
    return error(500, e instanceof Error ? e.message : "Falta configurar el bucket de videos");
  }
  const tmp = await fsp.mkdtemp(path.join(os.tmpdir(), "autogestion-subida-"));
  const archivo = path.join(tmp, "original");

  await prisma.video.create({
    data: {
      id,
      titulo,
      nombreOriginal: nombreArchivo,
      tamanoBytes: BigInt(declarado),
      claveOriginal: clave,
      estado: "SUBIENDO",
      creadorEmpleadoId: session.IdEmpleado,
    },
  });

  try {
    let bytes = 0;
    const contador = new Transform({
      transform(chunk: Buffer, _enc, cb) {
        bytes += chunk.length;
        cb(bytes > MAX_BYTES_VIDEO ? new ErrorUsuario("El archivo supera 1 GB") : null, chunk);
      },
    });
    await pipeline(Readable.fromWeb(req.body as WebReadableStream<Uint8Array>), contador, fs.createWriteStream(archivo));
    if (bytes === 0) throw new ErrorUsuario("El archivo está vacío");

    // El original es privado: nunca lo sirve CloudFront.
    await subirArchivo(archivo, clave, "application/octet-stream", "private, no-store");

    await prisma.video.update({ where: { id }, data: { estado: "EN_COLA", tamanoBytes: BigInt(bytes) } });
    despertarWorker();
    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (e) {
    console.error(`[videos] subida ${id} falló:`, e);
    await prisma.video.delete({ where: { id } }).catch(() => undefined);
    await borrarObjetos([clave]).catch(() => undefined);

    if (e instanceof ErrorUsuario) return error(400, e.message);
    const mensaje = e instanceof Error ? e.message : "";
    if (/^(Falta la variable|En desarrollo debes configurar)/.test(mensaje)) return error(500, mensaje);
    return error(500, "No se pudo guardar el video. Intenta de nuevo.");
  } finally {
    await fsp.rm(tmp, { recursive: true, force: true }).catch(() => undefined);
  }
}
