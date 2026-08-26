import { describe, expect, it } from "vitest";
import { filterLibraryWork, libraryWorkCount } from "../client/src/lib/libraryWork";

const entries = [
  { id: 1, lifecycleStatus: "reviewed", feedbackOutcome: "saved_for_later" },
  { id: 2, lifecycleStatus: "generated", feedbackOutcome: "not_set" },
  { id: 3, lifecycleStatus: "planned", feedbackOutcome: "not_set" },
  { id: 4, lifecycleStatus: "posted", feedbackOutcome: "orders" },
  { id: 5, lifecycleStatus: "archived", feedbackOutcome: "saved_for_later" },
] as const;

describe("Library work-state classification", () => {
  it("keeps explicitly saved drafts separate from ready and archived work", () => {
    expect(filterLibraryWork([...entries], "drafts").map(entry => entry.id)).toEqual([1]);
    expect(filterLibraryWork([...entries], "ready").map(entry => entry.id)).toEqual([2]);
    expect(filterLibraryWork([...entries], "archived").map(entry => entry.id)).toEqual([5]);
  });

  it("counts each work view without treating planned content as ready to post", () => {
    expect(libraryWorkCount([...entries], "drafts")).toBe(1);
    expect(libraryWorkCount([...entries], "ready")).toBe(1);
    expect(libraryWorkCount([...entries], "posted")).toBe(1);
    expect(libraryWorkCount([...entries], "archived")).toBe(1);
  });
});
