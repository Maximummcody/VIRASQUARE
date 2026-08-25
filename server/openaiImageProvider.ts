const imageEndpoint = "https://api.openai.com/v1/images/edits";
const imageModel = process.env.OPENAI_IMAGE_MODEL || "gpt-image-2";

export type OpenAiImageInput = {
  bytes: Buffer;
  mimeType: "image/png" | "image/jpeg" | "image/webp";
  fileName: string;
};

function readProviderError(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object" && "error" in payload) {
    const error = (payload as { error?: { message?: unknown } }).error;
    if (typeof error?.message === "string") return error.message;
  }
  return fallback;
}

export async function createOpenAiProductVisual({ image, prompt }: { image: OpenAiImageInput; prompt: string }) {
  if (process.env.VIRASQUARE_TEST_OPENAI_IMAGE_FAILURE === "unavailable") {
    throw new Error("OpenAI image generation is unavailable for this test.");
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OpenAI image generation is not configured.");

  const form = new FormData();
  form.set("model", imageModel);
  form.set("image", new Blob([new Uint8Array(image.bytes)], { type: image.mimeType }), image.fileName);
  form.set("prompt", prompt);
  form.set("size", "1024x1536");
  form.set("quality", "medium");
  form.set("output_format", "png");

  const response = await fetch(imageEndpoint, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });
  const payload = await response.json().catch(() => null) as { data?: Array<{ b64_json?: unknown }> } | null;
  if (!response.ok) {
    throw new Error(`OpenAI image request failed (${response.status}): ${readProviderError(payload, "The product visual service did not return a usable image.")}`);
  }

  const encoded = payload?.data?.[0]?.b64_json;
  if (typeof encoded !== "string" || !encoded.trim()) {
    throw new Error("OpenAI did not return a usable product visual.");
  }
  return Buffer.from(encoded, "base64");
}
