import { describe, expect, it } from "vitest";
import { authenticateOwner, createAdminSession, hasAdminSession, type Env } from "../cloudflare/functions/api/_shared";

const env = { MK_VAULT_ADMIN_PASSWORD: "owner-password-for-test" } as Env;

describe("Cloudflare owner session", () => {
  it("accepts only the configured password and verifies its signed session cookie", async () => {
    expect(await authenticateOwner("owner-password-for-test", env)).toBe(true);
    expect(await authenticateOwner("incorrect-password", env)).toBe(false);

    const session = await createAdminSession(env);
    const request = new Request("https://mk-vault.pages.dev/api/admin/projects", { headers: { cookie: `mk_vault_admin=${session}` } });
    expect(await hasAdminSession(request, env)).toBe(true);
  });
});
