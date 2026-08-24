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
    ? { label: "Today complete · 1 of 1", detail: "You showed up today. Your post is marked as posted." }
    : { label: "Today’s progress · 0 of 1", detail: "Open today’s post, then mark it as posted when you have used it." };
}
