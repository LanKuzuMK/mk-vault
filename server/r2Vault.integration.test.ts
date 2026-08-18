import { DeleteObjectsCommand, ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import { afterAll, describe, expect, it } from "vitest";
import { restoreRemoteVault, saveRemoteVault } from "./r2Vault";

const testUserId = 9_900_000_000 + Math.floor(Math.random() * 100_000);
const endpoint = process.env.CLOUDFLARE_R2_ENDPOINT!;
const bucket = process.env.CLOUDFLARE_R2_BUCKET!;
const client = new S3Client({
  region: "auto",
  endpoint,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
});

afterAll(async () => {
  const listed = await client.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: `vaults/${testUserId}/` }));
  const objects = listed.Contents?.flatMap((object) => object.Key ? [{ Key: object.Key }] : []) ?? [];
  if (objects.length) await client.send(new DeleteObjectsCommand({ Bucket: bucket, Delete: { Objects: objects, Quiet: true } }));
});

describe("MK Vault R2 remote backup", () => {
  it("saves and restores a per-user archive through the secured R2 path", async () => {
    const backup = {
      entries: [{
        id: "r2-integration-entry",
        url: "https://example.com",
        title: "Temporary R2 Integration Check",
        category: "Tool" as const,
        note: "This entry is created and removed by the integration test.",
        createdAt: "2026-08-17T09:00:00.000Z",
      }],
    };

    const saved = await saveRemoteVault(testUserId, backup);
    const restored = await restoreRemoteVault(testUserId);

    expect(saved.entryCount).toBe(1);
    expect(restored.entries).toEqual(backup.entries);
  }, 20_000);
});
