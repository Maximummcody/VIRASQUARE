export function emptyDayCopy(hasActivePlan: boolean) {
  return hasActivePlan
    ? {
        eyebrow: "REST DAY",
        title: "No post needed today.",
        detail: "Your plan left this day clear.",
      }
    : {
        eyebrow: "NO PLAN YET",
        title: "Plan when you are ready.",
        detail: "",
      };
}

export function todayProgressCopy(lifecycleStatus: string | undefined) {
  return lifecycleStatus === "posted"
    ? { label: "Today complete", detail: "1 planned post marked as posted" }
    : { label: "Today’s progress", detail: "0 of 1 planned posts complete" };
}
