export type OwnerConfirmedOutcome = "conversations" | "orders" | "engagement" | "profile_visits";

export type OwnerFeedbackSignal = {
  id: number;
  title: string;
  objective: string;
  format: string;
  outcome: OwnerConfirmedOutcome;
  postedAt: Date | null;
  note: string | null;
};

export type OwnerLearningMemory = {
  signals: Array<Pick<OwnerFeedbackSignal, "title" | "objective" | "format" | "outcome">>;
  summary: string | null;
};

const outcomeLabels: Record<OwnerConfirmedOutcome, string> = {
  conversations: "started conversations",
  orders: "helped an order",
  engagement: "received useful engagement",
  profile_visits: "brought profile visits",
};

export function buildOwnerLearningMemory(signals: Array<Omit<OwnerFeedbackSignal, "outcome"> & { outcome: string }>): OwnerLearningMemory {
  const recentSignals = signals
    .filter((signal): signal is OwnerFeedbackSignal => ["conversations", "orders", "engagement", "profile_visits"].includes(signal.outcome))
    .slice(0, 4)
    .map(({ title, objective, format, outcome }) => ({ title, objective, format, outcome }));
  const latest = recentSignals[0];
  return {
    signals: recentSignals,
    summary: latest ? `You said “${latest.title}” ${outcomeLabels[latest.outcome]}. ViraSquare will treat that as a gentle preference, not a guaranteed result.` : null,
  };
}

export function feedbackLearningInstruction(memory: OwnerLearningMemory) {
  if (memory.signals.length === 0) return "";
  return `Owner-confirmed learning signals: ${JSON.stringify(memory.signals)}. These are the owner's own observations, not verified analytics. Use them only as a soft preference when choosing a relevant future angle. Never repeat them as a claim, promise a result, or assume they apply to all customers.`;
}
