import { describe, expect, it, vi } from "vitest";

const storage = vi.hoisted(() => ({
  storageGetSignedUrl: vi.fn(),
  storagePut: vi.fn(),
}));

vi.mock("./storage", () => storage);

import { createVisualArchive } from "./visualExport";

describe("createVisualArchive", () => {
  it("packages every ready slide and stores one downloadable ZIP export", async () => {
    storage.storageGetSignedUrl.mockResolvedValue("https://assets.example.test/slide.png");
    storage.storagePut.mockResolvedValue({ key: "exports/7/watch-guide.zip", url: "/manus-storage/exports/7/watch-guide.zip" });
    vi.stubGlobal("fetch", vi.fn().mockImplementation(() => Promise.resolve(new Response(new Uint8Array([137, 80, 78, 71]), { status: 200 }))));

    const result = await createVisualArchive({
      userId: 7,
      title: "Everyday watch guide",
      slides: [{ slideNumber: 1, assetKey: "visuals/one.png" }, { slideNumber: 2, assetKey: "visuals/two.png" }],
    });

    expect(storage.storageGetSignedUrl).toHaveBeenCalledTimes(2);
    expect(storage.storagePut).toHaveBeenCalledWith(expect.stringContaining("exports/7/everyday-watch-guide"), expect.any(Buffer), "application/zip");
    expect(result).toEqual({ key: "exports/7/watch-guide.zip", url: "/manus-storage/exports/7/watch-guide.zip", slideCount: 2 });
  });

  it("refuses to export a set without rendered slides", async () => {
    await expect(createVisualArchive({ userId: 7, title: "Empty", slides: [{ slideNumber: 1, assetKey: null }] })).rejects.toThrow("no finished visual slides");
  });
});
