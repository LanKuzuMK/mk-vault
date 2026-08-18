import { describe, expect, it } from "vitest";
import { shouldRetryTransientRequest, transientRequestRetryDelay } from "../client/src/lib/queryRetry";

describe("transient query retry policy", () => {
  it("retries only short-lived fetch failures up to three times", () => {
    const networkFailure = new Error("Failed to fetch");

    expect(shouldRetryTransientRequest(0, networkFailure)).toBe(true);
    expect(shouldRetryTransientRequest(2, networkFailure)).toBe(true);
    expect(shouldRetryTransientRequest(3, networkFailure)).toBe(false);
  });

  it("does not retry authorization or application errors", () => {
    expect(shouldRetryTransientRequest(0, new Error("You do not have required permission (10002)"))).toBe(false);
    expect(shouldRetryTransientRequest(0, new Error("Invalid project URL"))).toBe(false);
    expect(transientRequestRetryDelay(0)).toBe(600);
    expect(transientRequestRetryDelay(5)).toBe(3_000);
  });
});
