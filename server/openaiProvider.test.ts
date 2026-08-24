import { describe, expect, it } from "vitest";
import { requestOpenAiStructuredText } from "./openaiProvider";

describe.runIf(process.env.RUN_OPENAI_LIVE_TESTS === "true")("OpenAI API credential", () => {
  it("can access the OpenAI model catalog from the server", async () => {
    const apiKey = process.env.OPENAI_API_KEY;

    expect(apiKey).toBeTruthy();

    const response = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const body = await response.text();

    expect(response.ok, body).toBe(true);
  }, 20_000);

  it("returns a valid minimal structured text response without creating user content", async () => {
    const response = await requestOpenAiStructuredText({
      schemaName: "availability_probe",
      schema: {
        type: "object",
        properties: { status: { type: "string", enum: ["available"] } },
        required: ["status"],
        additionalProperties: false,
      },
      messages: [
        { role: "system", content: "Return only the requested JSON." },
        { role: "user", content: "Confirm the text service is available." },
      ],
    });

    expect(JSON.parse(response)).toEqual({ status: "available" });
  }, 45_000);
});
