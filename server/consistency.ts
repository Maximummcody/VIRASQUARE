function parseDate(value: string) { return new Date(`${value}T12:00:00`); }
function isoDate(date: Date) { return date.toISOString().slice(0, 10); }

export function calculateStreak(completedDates: string[], referenceDate: string) {
  const completed = new Set(completedDates);
  let cursor = parseDate(referenceDate);
  let streak = 0;
  while (completed.has(isoDate(cursor))) { streak += 1; cursor.setDate(cursor.getDate() - 1); }
  return streak;
}

export function calculateWeeklyProgress(completedCount: number, weeklyGoal: number) {
  if (weeklyGoal <= 0) return 0;
  return Math.min(100, Math.round((completedCount / weeklyGoal) * 100));
}
