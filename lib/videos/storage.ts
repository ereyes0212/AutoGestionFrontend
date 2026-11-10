import fs from "node:fs";
import fsp from "node:fs/promises";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, type S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getS3Client } from "@/lib/aws/s3";
import { getVideosBucketConfig, VALIDEZ_FIRMA_SEG } from "./config";

function esNoEncontrado(e: unknown): boolean {
  const err = e as { name?: string; $metadata?: { httpStatusCode?: number } };
  return err?.name === "NotFound" || err?.name === "NoSuchKey" || err?.$metadata?.httpStatusCode === 404;
}

/** Tamaño del objeto en S3, o null si no existe. */
export async function tamanoObjeto(clave: string): Promise<number | null> {
  const { bucket } = getVideosBucketConfig();
  try {
    const r = await getS3Client().send(new HeadObjectCommand({ Bucket: bucket, Key: clave }));
    return r.ContentLength ?? 0;
  } catch (e) {
    if (esNoEncontrado(e)) return null;
    throw e;
  }
}

export class ObjetoNoEncontrado extends Error {}

/** Descarga un objeto a disco como stream (sin cargarlo en memoria). */
export async function descargarAArchivo(clave: string, destino: string): Promise<void> {
  const { bucket } = getVideosBucketConfig();
  let body: unknown;
  try {
    body = (await getS3Client().send(new GetObjectCommand({ Bucket: bucket, Key: clave }))).Body;
  } catch (e) {
    if (esNoEncontrado(e)) throw new ObjetoNoEncontrado("No se encontró el archivo original en S3");
    throw e;
  }
  if (!(body instanceof Readable)) throw new Error("No se pudo leer el archivo desde S3");
  await pipeline(body, fs.createWriteStream(destino));
}

export async function subirArchivo(origen: string, clave: string, contentType: string, cacheControl: string) {
  const { bucket } = getVideosBucketConfig();
  const { size } = await fsp.stat(origen);
  await getS3Client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: clave,
      Body: fs.createReadStream(origen),
      ContentLength: size,
      ContentType: contentType,
      CacheControl: cacheControl,
    }),
  );
}

// ─── URLs firmadas para el lector ────────────────────────────────────────────

// Un solo cliente para firmar: evita pedir credenciales en cada vista de una nota.
let clienteFirma: S3Client | null = null;
function getClienteFirma(): S3Client {
  return (clienteFirma ??= getS3Client());
}

/**
 * Segundos que puede durar una firma. Una URL firmada deja de servir cuando vencen las credenciales
 * con que se firmó: con llaves fijas (AWS_ACCESS_KEY_ID) duran VALIDEZ_FIRMA_SEG; con credenciales
 * temporales (rol de la instancia) se acorta a lo que les quede, con 5 min de margen.
 */
export async function validezFirmaSeg(): Promise<number> {
  const credenciales = await getClienteFirma().config.credentials();
  const vence = credenciales.expiration?.getTime();
  if (!vence) return VALIDEZ_FIRMA_SEG;
  const restante = Math.floor((vence - Date.now()) / 1000) - 5 * 60;
  return Math.max(60, Math.min(VALIDEZ_FIRMA_SEG, restante));
}

/** URL temporal para leer un objeto privado de S3 (el bucket nunca se vuelve público). */
export async function firmarLectura(clave: string, segundos: number): Promise<string> {
  const { bucket } = getVideosBucketConfig();
  return getSignedUrl(getClienteFirma(), new GetObjectCommand({ Bucket: bucket, Key: clave }), { expiresIn: segundos });
}

/** Borra objetos; los que no existen se ignoran. */
export async function borrarObjetos(claves: string[]): Promise<void> {
  const { bucket } = getVideosBucketConfig();
  const client = getS3Client();
  for (const clave of claves) {
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: clave }));
  }
}
