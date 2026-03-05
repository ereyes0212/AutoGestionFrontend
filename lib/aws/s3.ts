import { createHash, createHmac } from "crypto";

type S3Config = {
  region: string;
  bucket: string;
  endpoint?: string;
};

type S3Credentials = {
  accessKeyId: string;
  secretAccessKey: string;
};

function hmac(key: Buffer | string, data: string) {
  return createHmac("sha256", key).update(data, "utf8").digest();
}

function sha256Hex(data: string | Buffer) {
  return createHash("sha256").update(data).digest("hex");
}

export function getS3ConfigFromEnv(): S3Config {
  const region = process.env.AWS_S3_REGION;
  const bucket = process.env.AWS_S3_BUCKET;
  const endpoint = process.env.AWS_S3_ENDPOINT;

  if (!region || !bucket) {
    throw new Error("Faltan AWS_S3_REGION o AWS_S3_BUCKET");
  }

  return { region, bucket, endpoint: endpoint || undefined };
}

export function getS3CredentialsFromEnv(): S3Credentials {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!accessKeyId || !secretAccessKey) {
    if (process.env.NODE_ENV !== "production") {
      throw new Error("En desarrollo define AWS_ACCESS_KEY_ID y AWS_SECRET_ACCESS_KEY");
    }
    throw new Error("No hay credenciales de AWS en variables de entorno");
  }

  return { accessKeyId, secretAccessKey };
}

export function buildS3PublicUrl(bucket: string, key: string) {
  const explicit = process.env.AWS_S3_PUBLIC_BASE_URL;
  if (explicit) return `${explicit.replace(/\/$/, "")}/${key}`;

  const endpoint = process.env.AWS_S3_ENDPOINT;
  if (endpoint) return `${endpoint.replace(/\/$/, "")}/${bucket}/${key}`;

  const region = process.env.AWS_S3_REGION;
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
  const { bucket, endpoint, region } = getS3ConfigFromEnv();
  const { accessKeyId, secretAccessKey } = getS3CredentialsFromEnv();

  const host = endpoint ? new URL(endpoint).host : `${bucket}.s3.${region}.amazonaws.com`;
  const protocol = endpoint ? new URL(endpoint).protocol : "https:";
  const pathPrefix = endpoint ? `/${bucket}` : "";
  const canonicalUri = `${pathPrefix}/${encodeURIComponent(key).replace(/%2F/g, "/")}`;
  const url = `${protocol}//${host}${canonicalUri}`;

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = sha256Hex(body);

  const canonicalHeaders = `content-type:${contentType}\nhost:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
  const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";
  const canonicalRequest = `PUT\n${canonicalUri}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;

  const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${sha256Hex(canonicalRequest)}`;

  const kDate = hmac(`AWS4${secretAccessKey}`, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, "s3");
  const kSigning = hmac(kService, "aws4_request");
  const signature = createHmac("sha256", kSigning).update(stringToSign, "utf8").digest("hex");

  const authorization = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
      "x-amz-date": amzDate,
      "x-amz-content-sha256": payloadHash,
      Authorization: authorization,
      "Content-Length": String(body.byteLength),
    },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Error subiendo archivo a S3: ${response.status} ${text}`);
  }

  return buildS3PublicUrl(bucket, key);
}
