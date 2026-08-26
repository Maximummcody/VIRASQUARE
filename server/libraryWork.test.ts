import { describe, expect, it } from "vitest";
import { filterLibraryContent, filterLibraryWork, getLibraryWorkTab, libraryWorkCount, paginateLibraryWork, searchLibraryWork, sortLibraryWork } from "../client/src/lib/libraryWork";

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

  it("filters content type and sorts saved work without changing its lifecycle state", () => {
    const sortable = [
      { ...entries[0], title: "Zara product", brief: "A flyer", format: "promo", updatedAt: "2026-08-03" },
      { ...entries[1], title: "Ada carousel", brief: "A guide", format: "carousel", entryType: "product_education", updatedAt: "2026-08-01" },
      { ...entries[3], title: "Bella caption", brief: "A caption", format: "caption", updatedAt: "2026-08-02" },
    ];

    expect(filterLibraryContent(sortable, "product").map(entry => entry.id)).toEqual([1]);
    expect(filterLibraryContent(sortable, "education").map(entry => entry.id)).toEqual([2]);
    expect(filterLibraryContent(sortable, "carousel").map(entry => entry.id)).toEqual([2]);
    expect(sortLibraryWork(sortable, "recent").map(entry => entry.id)).toEqual([1, 4, 2]);
    expect(sortLibraryWork(sortable, "title_asc").map(entry => entry.id)).toEqual([2, 4, 1]);
  });

  it("paginates large work collections and clamps out-of-range pages", () => {
    const entries = Array.from({ length: 19 }, (_, index) => ({ id: index + 1 }));
    expect(paginateLibraryWork(entries, 1).items.map(entry => entry.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(paginateLibraryWork(entries, 2).items.map(entry => entry.id)).toEqual([10, 11, 12, 13, 14, 15, 16, 17, 18]);
    expect(paginateLibraryWork(entries, 9)).toMatchObject({ currentPage: 3, totalPages: 3, totalItems: 19, items: [{ id: 19 }] });
  });
});
