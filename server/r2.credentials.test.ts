import { DeleteObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { describe, expect, it } from "vitest";

const endpoint = process.env.CLOUDFLARE_R2_ENDPOINT;
const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const bucket = process.env.CLOUDFLARE_R2_BUCKET;

describe("Cloudflare R2 credentials", () => {
  it("lists the MK Vault backup bucket with server-only credentials", async () => {
    expect(endpoint).toBeTruthy();
    expect(accessKeyId).toBeTruthy();
    expect(secretAccessKey).toBeTruthy();
    expect(bucket).toBe("mk-vault-backups");

    const client = new S3Client({
      region: "auto",
      endpoint,
      credentials: { accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey! },
    });

    const response = await client.send(new ListObjectsV2Command({ Bucket: bucket!, MaxKeys: 1 }));
    expect(response).toHaveProperty("KeyCount");
  }, 15_000);

  it("writes and removes a short-lived permission check object", async () => {
    const client = new S3Client({
      region: "auto",
      endpoint,
      credentials: { accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey! },
    });
    const key = `vaults/__credential-check__/${crypto.randomUUID()}.txt`;

    await client.send(new PutObjectCommand({ Bucket: bucket!, Key: key, Body: "MK Vault R2 credential validation", ContentType: "text/plain" }));
    await expect(client.send(new DeleteObjectCommand({ Bucket: bucket!, Key: key }))).resolves.toBeDefined();
  }, 15_000);
});
