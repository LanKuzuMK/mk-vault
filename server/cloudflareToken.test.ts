import { describe, expect, it } from "vitest";

const token = process.env.CLOUDFLARE_API_TOKEN;
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID ?? "600125d358de768307cf0dba7d5040fd";

describe("Cloudflare deployment token", () => {
  it.skipIf(!token)("can access the authorized D1 account endpoint", async () => {
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await response.json() as { success?: boolean; errors?: Array<{ message?: string }> };

    expect(body.errors?.map((error) => error.message).join(" ")).not.toMatch(/authentication error/i);
    expect(response.status).not.toBe(401);
    expect(response.status).not.toBe(403);
  }, 15_000);
});
