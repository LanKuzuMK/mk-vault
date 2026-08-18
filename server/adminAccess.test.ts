import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createUserContext(role: "user" | "admin"): TrpcContext {
  return {
    user: {
      id: 17,
      openId: "role-check-user",
      name: "Role Check",
      email: "role-check@example.com",
      loginMethod: "oauth",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("administrator-only archive controls", () => {
  it("rejects a signed-in non-administrator before catalog access reaches storage", async () => {
    const caller = appRouter.createCaller(createUserContext("user"));
    await expect(caller.adminCatalog.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects a signed-in non-administrator before R2 backup access", async () => {
    const caller = appRouter.createCaller(createUserContext("user"));
    await expect(caller.vaultBackup.status()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects a signed-in non-administrator before featured ordering access", async () => {
    const caller = appRouter.createCaller(createUserContext("user"));
    await expect(caller.adminCatalog.setFeaturedRank({ id: "record-1", featuredRank: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
