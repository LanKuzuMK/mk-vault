import { describe, expect, it } from "vitest";
import { featuredProjectInputSchema } from "./catalog";

describe("featured project ordering input", () => {
  it("accepts explicit positions 0 through 999", () => {
    expect(featuredProjectInputSchema.parse({ id: "project-1", featuredRank: 0 })).toMatchObject({ featuredRank: 0 });
    expect(featuredProjectInputSchema.parse({ id: "project-1", featuredRank: 3 })).toMatchObject({ featuredRank: 3 });
  });

  it("rejects negative and out-of-range positions", () => {
    expect(() => featuredProjectInputSchema.parse({ id: "project-1", featuredRank: -1 })).toThrow();
    expect(() => featuredProjectInputSchema.parse({ id: "project-1", featuredRank: 1_000 })).toThrow();
  });
});
