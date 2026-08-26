export type LibraryWorkTab = "drafts" | "ready" | "posted" | "archived";

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
