import { describe, expect, it } from "vitest";
import { vaultObjectKeys } from "./r2Vault";

describe("MK Vault R2 object layout", () => {
  it("keeps each user’s latest and historical backups in a separate immutable path", () => {
    const keys = vaultObjectKeys(42, "2026-08-17T09:30:00.000Z");

    expect(keys.prefix).toBe("vaults/42");
    expect(keys.latest).toBe("vaults/42/latest.json");
    expect(keys.historical).toBe("vaults/42/history/2026-08-17T09-30-00-000Z.json");
  });
});
