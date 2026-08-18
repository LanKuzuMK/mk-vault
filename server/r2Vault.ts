/* MK Vault: private, versioned R2 backup objects are isolated by authenticated user ID. */
import { GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const vaultEntrySchema = z.object({
  id: z.string().min(1).max(128),
  url: z.string().url().max(2_048),
  title: z.string().min(1).max(80),
  category: z.enum(["Game", "Tool", "App", "Portfolio", "Other"]),
  note: z.string().max(160),
  createdAt: z.string().datetime(),
});

export const vaultBackupInputSchema = z.object({
  entries: z.array(vaultEntrySchema).max(2_500),
});

const storedBackupSchema = vaultBackupInputSchema.extend({
  schemaVersion: z.literal(1),
  exportedAt: z.string().datetime(),
});

export type VaultBackupInput = z.infer<typeof vaultBackupInputSchema>;
export type StoredVaultBackup = z.infer<typeof storedBackupSchema>;

function r2Config() {
  const endpoint = process.env.CLOUDFLARE_R2_ENDPOINT;
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
  const bucket = process.env.CLOUDFLARE_R2_BUCKET;

  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Remote vault storage is not configured." });
  }

  return { endpoint, accessKeyId, secretAccessKey, bucket };
}

function r2Client() {
  const { endpoint, accessKeyId, secretAccessKey } = r2Config();
  return new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export function vaultObjectKeys(userId: number, stamp = new Date().toISOString()) {
  const safeStamp = stamp.replace(/[:.]/g, "-");
  const prefix = `vaults/${userId}`;
  return {
    prefix,
    latest: `${prefix}/latest.json`,
    historical: `${prefix}/history/${safeStamp}.json`,
  };
}

async function bodyToText(body: unknown): Promise<string> {
  if (body && typeof body === "object" && "transformToString" in body && typeof body.transformToString === "function") {
    return body.transformToString();
  }

  if (body && typeof body === "object" && Symbol.asyncIterator in body) {
    const chunks: Buffer[] = [];
    for await (const chunk of body as AsyncIterable<Uint8Array>) chunks.push(Buffer.from(chunk));
    return Buffer.concat(chunks).toString("utf8");
  }

  throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Remote vault data could not be read." });
}

export async function getRemoteVaultStatus(userId: number) {
  const { bucket } = r2Config();
  const { latest } = vaultObjectKeys(userId);

  try {
    const object = await r2Client().send(new HeadObjectCommand({ Bucket: bucket, Key: latest }));
    return {
      exists: true,
      savedAt: object.LastModified?.toISOString() ?? null,
      size: object.ContentLength ?? 0,
    };
  } catch (error: unknown) {
    const metadata = error as { name?: string; $metadata?: { httpStatusCode?: number } };
    if (metadata.name === "NotFound" || metadata.$metadata?.httpStatusCode === 404) {
      return { exists: false, savedAt: null, size: 0 };
    }
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "The remote vault could not be reached." });
  }
}

export async function saveRemoteVault(userId: number, input: VaultBackupInput) {
  const { bucket } = r2Config();
  const exportedAt = new Date().toISOString();
  const payload: StoredVaultBackup = { schemaVersion: 1, exportedAt, entries: input.entries };
  const body = JSON.stringify(payload);
  const { latest, historical } = vaultObjectKeys(userId, exportedAt);

  try {
    await Promise.all([
      r2Client().send(new PutObjectCommand({ Bucket: bucket, Key: latest, Body: body, ContentType: "application/json", CacheControl: "no-store" })),
      r2Client().send(new PutObjectCommand({ Bucket: bucket, Key: historical, Body: body, ContentType: "application/json", CacheControl: "no-store" })),
    ]);
    return { savedAt: exportedAt, entryCount: payload.entries.length };
  } catch {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "The vault backup could not be sealed in remote storage." });
  }
}

export async function restoreRemoteVault(userId: number): Promise<StoredVaultBackup> {
  const { bucket } = r2Config();
  const { latest } = vaultObjectKeys(userId);

  try {
    const response = await r2Client().send(new GetObjectCommand({ Bucket: bucket, Key: latest }));
    const parsed = storedBackupSchema.safeParse(JSON.parse(await bodyToText(response.Body)));
    if (!parsed.success) throw new Error("Invalid vault backup");
    return parsed.data;
  } catch (error: unknown) {
    const metadata = error as { name?: string; $metadata?: { httpStatusCode?: number } };
    if (metadata.name === "NoSuchKey" || metadata.$metadata?.httpStatusCode === 404) {
      throw new TRPCError({ code: "NOT_FOUND", message: "No remote backup has been sealed for this vault yet." });
    }
    if (error instanceof TRPCError) throw error;
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "The remote vault backup could not be restored." });
  }
}
