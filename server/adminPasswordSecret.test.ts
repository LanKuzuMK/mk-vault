import { describe, expect, it } from "vitest";

describe("MK Vault administrator password secret", () => {
  it("is present and has sufficient length for the Cloudflare owner session", () => {
    const password = process.env.MK_VAULT_ADMIN_PASSWORD;

    expect(password).toBeTypeOf("string");
    expect(password?.length).toBeGreaterThanOrEqual(8);
  });
});
