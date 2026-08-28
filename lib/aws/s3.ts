import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

export type S3BucketConfig = {
  bucket: string;
  prefix: string;
};

type UploadBufferToS3Input = {
  key: string;
  contentType: string;
  body: Buffer;
  config?: S3BucketConfig;
};

function isDevelopmentEnvironment() {
  return process.env.NODE_ENV !== "production";
}

export function getS3Client() {
  const region = process.env.AWS_REGION;

  if (!region) {
    throw new Error("Falta la variable de entorno AWS_REGION");
  }

  if (isDevelopmentEnvironment()) {
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    if (!accessKeyId || !secretAccessKey) {
      throw new Error(
        "En desarrollo debes configurar AWS_ACCESS_KEY_ID y AWS_SECRET_ACCESS_KEY para conectar a S3.",
      );
    }

    return new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  return new S3Client({ region });
}

export function getPrivatePdfBucketConfig(): S3BucketConfig {
  const bucket = process.env.AWS_PRIVATE_PDF_BUCKET ?? process.env.AWS_PRIVATE_BUCKET;
  const prefix = process.env.AWS_PRIVATE_PDF_PREFIX ?? process.env.AWS_PRIVATE_PREFIX ?? "";

  if (!bucket) {
    throw new Error("Falta la variable de entorno AWS_PRIVATE_PDF_BUCKET");
  }

  return { bucket, prefix };
}

/**
 * Ubicación de las firmas de los movimientos de insumos.
 * Si no se configura AWS_PRIVATE_INSUMOS_PREFIX se usa "insumos/firmas".
 */
export function getPrivateInsumosBucketConfig(): S3BucketConfig {
  const bucket = process.env.AWS_PRIVATE_INSUMOS_BUCKET ?? process.env.AWS_PRIVATE_BUCKET;
  const prefix = process.env.AWS_PRIVATE_INSUMOS_PREFIX ?? "insumos/firmas";

  if (!bucket) {
    throw new Error("Falta la variable de entorno AWS_PRIVATE_INSUMOS_BUCKET");
  }

  return { bucket, prefix };
}

export async function uploadBufferToS3({ key, contentType, body, config }: UploadBufferToS3Input) {
  const client = getS3Client();
  const { bucket, prefix } = config ?? getPrivatePdfBucketConfig();
  const objectKey = prefix ? `${prefix.replace(/\/$/, "")}/${key}` : key;

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      Body: body,
      ContentType: contentType,
    }),
  );

  return objectKey;
}

export async function deleteObjectFromS3(key: string, config?: S3BucketConfig) {
  const client = getS3Client();
  const { bucket } = config ?? getPrivatePdfBucketConfig();

  await client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  );
}

export async function downloadBufferFromS3(key: string, config?: S3BucketConfig) {
  const client = getS3Client();
  const { bucket } = config ?? getPrivatePdfBucketConfig();

  const response = await client.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  );

  const body = response.Body;
  if (!body) {
    throw new Error("No se pudo leer el archivo desde S3");
  }

  const bytes = await body.transformToByteArray();

  return {
    buffer: Buffer.from(bytes),
    contentType: response.ContentType ?? "application/octet-stream",
  };
}
