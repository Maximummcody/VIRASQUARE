export type LibraryWorkTab = "drafts" | "ready" | "posted" | "archived";
export type LibraryContentFilter = "all" | "product" | "education" | "carousel" | "caption";
export type LibrarySort = "recent" | "oldest" | "title_asc" | "title_desc";

export type LibraryWorkEntry = {
  lifecycleStatus: string;
  feedbackOutcome?: string | null;
};

export function isSavedDraft(entry: LibraryWorkEntry) {
  return entry.feedbackOutcome === "saved_for_later" && entry.lifecycleStatus !== "archived";
}

export function filterLibraryWork<T extends LibraryWorkEntry>(entries: T[], tab: LibraryWorkTab) {
  if (tab === "drafts") return entries.filter(isSavedDraft);
  if (tab === "ready") return entries.filter(entry => entry.lifecycleStatus !== "posted" && entry.lifecycleStatus !== "archived" && !isSavedDraft(entry) && entry.lifecycleStatus !== "planned");
  return entries.filter(entry => entry.lifecycleStatus === tab);
}

export function libraryWorkCount<T extends LibraryWorkEntry>(entries: T[], tab: LibraryWorkTab) {
  return filterLibraryWork(entries, tab).length;
}

export function getLibraryWorkTab(entry: LibraryWorkEntry): LibraryWorkTab | null {
  if (isSavedDraft(entry)) return "drafts";
  if (entry.lifecycleStatus === "posted") return "posted";
  if (entry.lifecycleStatus === "archived") return "archived";
  if (entry.lifecycleStatus === "planned") return null;
  return "ready";
}

export function searchLibraryWork<T extends LibraryWorkEntry & { title?: string | null; brief?: string | null; entryType?: string | null }>(entries: T[], query: string) {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) return entries;
  return entries.filter(entry => [entry.title, entry.brief, entry.entryType === "product_education" ? "product education" : ""].some(value => value?.toLocaleLowerCase().includes(normalizedQuery)));
}

export function filterLibraryContent<T extends LibraryWorkEntry & { entryType?: string | null; format?: string | null }>(entries: T[], filter: LibraryContentFilter) {
  if (filter === "all") return entries;
  if (filter === "product") return entries.filter(entry => entry.format === "promo");
  if (filter === "education") return entries.filter(entry => entry.entryType === "product_education");
  return entries.filter(entry => entry.format === filter);
}

export function sortLibraryWork<T extends { title?: string | null; updatedAt?: Date | string | null; createdAt?: Date | string | null }>(entries: T[], sort: LibrarySort) {
  const dateValue = (entry: T) => new Date(entry.updatedAt ?? entry.createdAt ?? 0).getTime();
  return [...entries].sort((left, right) => {
    if (sort === "recent") return dateValue(right) - dateValue(left);
    if (sort === "oldest") return dateValue(left) - dateValue(right);
    const comparison = (left.title ?? "").localeCompare(right.title ?? "");
    return sort === "title_asc" ? comparison : -comparison;
  });
}
