import { describe, expect, it } from "vitest";
import { filterLibraryWork, getLibraryWorkTab, libraryWorkCount, searchLibraryWork } from "../client/src/lib/libraryWork";

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

  it("searches titles, briefs, and product-education work across Library states", () => {
    const searchable = [
      { ...entries[0], title: "Silver handbag post", brief: "A selling caption" },
      { ...entries[1], title: "Handbag colour guide", brief: "Product education for buyers", entryType: "product_education" },
      { ...entries[3], title: "Watch post", brief: "A style angle" },
    ];

    expect(searchLibraryWork(searchable, "handbag").map(entry => entry.id)).toEqual([1, 2]);
    expect(searchLibraryWork(searchable, "education").map(entry => entry.id)).toEqual([2]);
    expect(getLibraryWorkTab(entries[0])).toBe("drafts");
    expect(getLibraryWorkTab(entries[2])).toBeNull();
  });
});
