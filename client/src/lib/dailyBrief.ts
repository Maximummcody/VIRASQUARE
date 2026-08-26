export type DailyBriefItem = {
  caption?: string | null;
  requiresProduct?: boolean;
  lifecycleStatus?: string | null;
};

export type DailyBriefAction = "prepare_week" | "create_today" | "prepare_product" | "open_ready" | "view_week";
export type WeeklyDateState = "past" | "today" | "future";

export type DailyBriefState = {
  eyebrow: string;
  title: string;
  detail: string;
  actionLabel: string;
  action: DailyBriefAction;
};

export function getDailyBriefState(input: { hasActivePlan: boolean; current: DailyBriefItem | null | undefined }): DailyBriefState {
  const current = input.current;
  if (!input.hasActivePlan) return {
    eyebrow: "YOUR CONTENT WEEK",
    title: "Build your first content week",
    detail: "Prepare a focused posting rhythm, then ViraSquare will guide your first useful move.",
    actionLabel: "Prepare my week",
    action: "prepare_week",
  };
  if (!current) return {
    eyebrow: "TODAY'S RHYTHM",
    title: "Today is a rest day",
    detail: "Your plan left today clear. Rest or make something extra by choice.",
    actionLabel: "View this week",
    action: "view_week",
  };
  if (current.lifecycleStatus === "posted") return {
    eyebrow: "TODAY'S RHYTHM",
    title: "Today is done",
    detail: "Your planned post has been recorded. Keep your rhythm going when the next move is right.",
    actionLabel: "View this week",
    action: "view_week",
  };
  if (current.caption) return {
    eyebrow: "TODAY'S MOVE",
    title: "Your post is ready to review",
    detail: "Check the content, visual, and selling details before you share it.",
    actionLabel: "Open ready post",
    action: "open_ready",
  };
  if (current.requiresProduct) return {
    eyebrow: "TODAY'S MOVE",
    title: "Prepare today's product post",
    detail: "Add or confirm the real product details needed for this content.",
    actionLabel: "Prepare product",
    action: "prepare_product",
  };
  return {
    eyebrow: "TODAY'S MOVE",
    title: "Your next post is ready to shape",
    detail: "ViraSquare has a direction for today. Open it to create and review the post.",
    actionLabel: "Create today's post",
    action: "create_today",
  };
}

export function getWeeklyMomentum(input: { hasActivePlan: boolean; completedCount: number; weeklyGoal: number }) {
  const goal = Math.max(1, input.weeklyGoal);
  const completedCount = Math.max(0, input.completedCount);
  const percentage = Math.min(100, Math.round((completedCount / goal) * 100));
  if (!input.hasActivePlan) return { title: "Set your weekly rhythm", detail: "Prepare a focused week so ViraSquare can guide your next move.", completedCount, goal, percentage: 0 };
  if (completedCount >= goal) return { title: "This week's rhythm is complete", detail: "You can still create something extra if it serves your business.", completedCount, goal, percentage: 100 };
  if (completedCount > 0) return { title: `${completedCount} of ${goal} planned posts completed`, detail: "Your plan is moving forward at your pace.", completedCount, goal, percentage };
  return { title: "Your weekly rhythm is ready", detail: "Your next planned move will be ready when its day arrives.", completedCount, goal, percentage: 0 };
}

export function getWeeklyDateState(date: string, today: string): WeeklyDateState {
  if (date === today) return "today";
  return date < today ? "past" : "future";
}

export function mobileWeeklyDates(dates: string[], today: string) {
  return dates.filter(date => date >= today).slice(0, 3);
}

export function shouldShowJumpToToday(isTodayVisible: boolean) {
  return !isTodayVisible;
}
