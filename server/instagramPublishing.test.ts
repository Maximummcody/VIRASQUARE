import { afterEach, describe, expect, it, vi } from "vitest";
import { InstagramPublishError, publishInstagramSingleImage, shouldDiscloseInstagramAiGeneration } from "./instagramPublishing";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

describe("Group 4A Instagram Publish Now", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("checks the provider limit, creates one image container, then publishes it with an AI disclosure when needed", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ data: [{ quota_usage: 3, config: { quota_total: 100 } }] }))
      .mockResolvedValueOnce(jsonResponse({ id: "container-42" }))
      .mockResolvedValueOnce(jsonResponse({ id: "media-99" }))
      .mockResolvedValueOnce(jsonResponse({ permalink: "https://www.instagram.com/p/example/" }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await publishInstagramSingleImage({
      accountId: "ig-user-1",
      accessToken: "server-only-token",
      publicImageUrl: "https://storage.example.com/flyer.jpg",
      caption: "A verified ViraSquare caption",
      isAiGenerated: true,
    });

    expect(result).toMatchObject({ containerId: "container-42", postId: "media-99", permalink: "https://www.instagram.com/p/example/", limit: { remaining: 97 } });
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(String(fetchMock.mock.calls[1]?.[0])).toContain("/ig-user-1/media");
    expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({ headers: { Authorization: "Bearer server-only-token" } });
    expect(JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body))).toMatchObject({ image_url: "https://storage.example.com/flyer.jpg", caption: "A verified ViraSquare caption", is_ai_generated: true });
    expect(JSON.parse(String(fetchMock.mock.calls[2]?.[1]?.body))).toEqual({ creation_id: "container-42" });
  });

  it("refuses invalid image URLs and oversized captions before contacting Instagram", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(publishInstagramSingleImage({ accountId: "ig-user-1", accessToken: "token", publicImageUrl: "http://not-secure.example.com/post.jpg", caption: "Caption", isAiGenerated: false })).rejects.toMatchObject<Partial<InstagramPublishError>>({ code: "media_url_invalid" });
    await expect(publishInstagramSingleImage({ accountId: "ig-user-1", accessToken: "token", publicImageUrl: "https://storage.example.com/post.jpg", caption: "x".repeat(2201), isAiGenerated: false })).rejects.toMatchObject<Partial<InstagramPublishError>>({ code: "caption_too_long" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("marks only AI-created or stylish flyer paths for Meta’s AI disclosure", () => {
    expect(shouldDiscloseInstagramAiGeneration({ sourceMode: "product", generationMode: "standard" })).toBe(false);
    expect(shouldDiscloseInstagramAiGeneration({ sourceMode: "ai_product", generationMode: "standard" })).toBe(true);
    expect(shouldDiscloseInstagramAiGeneration({ sourceMode: "product", generationMode: "stylish" })).toBe(true);
  });
});
