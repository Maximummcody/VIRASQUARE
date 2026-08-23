export function emptyDayCopy(hasActivePlan: boolean) {
  return hasActivePlan
    ? {
        eyebrow: "REST DAY",
        title: "No post needed today.",
        detail: "Your plan left this day clear.",
      }
    : {
        eyebrow: "WEEK NOT PREPARED",
        title: "Your plan will appear here.",
        detail: "Prepare your week to see which days need a post.",
      };
}

export function todayProgressCopy(lifecycleStatus: string | undefined) {
  return lifecycleStatus === "posted"
    ? { label: "Today complete", detail: "1 planned post marked as posted" }
    : { label: "Today’s progress", detail: "0 of 1 planned posts complete" };
}
