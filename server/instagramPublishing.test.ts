import { describe, expect, it, vi } from "vitest";

const storage = vi.hoisted(() => ({ storageGetSignedUrl: vi.fn(), storagePut: vi.fn() }));
vi.mock("./storage", () => storage);

import { publishInstagramSingleImage, shouldDiscloseInstagramAiGeneration } from "./instagramPublishing";

describe("Instagram single-image publishing safeguards", () => {
  it("sends the exact reviewed caption and honest AI disclosure through Meta’s container then publish sequence", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: [{ quota_usage: 1 }] }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: "container-1" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: "post-1" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ permalink: "https://www.instagram.com/p/example/" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await publishInstagramSingleImage({ accountId: "ig-7", accessToken: "server-only-token", publicImageUrl: "https://media.example/flyer.jpg", caption: "Saved caption.\n\n#MirrorBag", isAiGenerated: true });

    expect(result).toEqual({ containerId: "container-1", postId: "post-1", permalink: "https://www.instagram.com/p/example/" });
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ headers: expect.objectContaining({ Authorization: "Bearer server-only-token" }) });
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ image_url: "https://media.example/flyer.jpg", caption: "Saved caption.\n\n#MirrorBag", is_ai_generated: true });
    expect(JSON.parse(fetchMock.mock.calls[2][1].body)).toEqual({ creation_id: "container-1" });
  });

  it("requires disclosure for an AI-enhanced source and never for the deterministic real-photo source", () => {
    expect(shouldDiscloseInstagramAiGeneration({ sourceMode: "ai_product", generationMode: "stylish" })).toBe(true);
    expect(shouldDiscloseInstagramAiGeneration({ sourceMode: "product", generationMode: "standard" })).toBe(false);
  });
});
