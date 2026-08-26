import { describe, expect, it } from "vitest";
import { attachmentDownloadUrl } from "../client/src/lib/downloads";

describe("attachmentDownloadUrl", () => {
  it("keeps the storage path and requests an attachment download with a friendly filename", () => {
    const url = attachmentDownloadUrl("/manus-storage/72/visuals/flyer.png", "virasquare-product-flyer.png", "https://virasquare.example");
    const parsed = new URL(url);

    expect(parsed.origin).toBe("https://virasquare.example");
    expect(parsed.pathname).toBe("/manus-storage/72/visuals/flyer.png");
    expect(parsed.searchParams.get("download")).toBe("1");
    expect(parsed.searchParams.get("filename")).toBe("virasquare-product-flyer.png");
  });
});
