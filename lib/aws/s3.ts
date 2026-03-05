import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

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

export function getPrivatePdfBucketConfig() {
  const bucket = process.env.AWS_PRIVATE_PDF_BUCKET ?? process.env.AWS_PRIVATE_BUCKET;
  const prefix = process.env.AWS_PRIVATE_PDF_PREFIX ?? process.env.AWS_PRIVATE_PREFIX ?? "";

  if (!bucket) {
    throw new Error("Falta la variable de entorno AWS_PRIVATE_PDF_BUCKET");
  }

  return { bucket, prefix };
}

export function buildS3PublicUrl(bucket: string, key: string) {
  const explicit = process.env.AWS_S3_PUBLIC_BASE_URL;
  if (explicit) return `${explicit.replace(/\/$/, "")}/${key}`;

  const endpoint = process.env.AWS_S3_ENDPOINT;
  if (endpoint) return `${endpoint.replace(/\/$/, "")}/${bucket}/${key}`;

  const region = process.env.AWS_REGION;
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

export async function uploadBufferToS3({
  key,
  contentType,
  body,
}: {
  key: string;
  contentType: string;
  body: Buffer;
}) {
  const client = getS3Client();
  const { bucket, prefix } = getPrivatePdfBucketConfig();

  const objectKey = prefix ? `${prefix.replace(/\/$/, "")}/${key}` : key;

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      Body: body,
      ContentType: contentType,
    }),
  );

  return buildS3PublicUrl(bucket, objectKey);
}
