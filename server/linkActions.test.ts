import { afterEach, describe, expect, it, vi } from "vitest";
import { copyProjectLink, shareProjectLink } from "../client/src/lib/linkActions";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("project link actions", () => {
  it("copies a project URL through the Clipboard API", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });

    await expect(copyProjectLink("https://example.com/project")).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith("https://example.com/project");
  });

  it("uses native sharing when the browser supports it", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { share });

    await expect(shareProjectLink({ title: "Example", url: "https://example.com", note: "A project" })).resolves.toBe("shared");
    expect(share).toHaveBeenCalledWith({ title: "Example", text: "Example — A project", url: "https://example.com" });
  });
});
