export type InputMode = "normal" | "url" | "search";

export type StatusPriority = "error" | "loading" | "hint" | "info";

export interface StatusMessage {
  text: string;
  priority: StatusPriority;
  expiresAt?: number;
}

export interface InteractiveElement {
  ref: string;
  label: number;
  text: string;
  type: "link" | "button";
}

export interface AppState {
  url: string;
  title: string;
  elements: InteractiveElement[];
  highlightIndex: number;
  scrollOffset: number;
  totalLines: number;
  inputMode: InputMode;
  inputBuffer: string;
  statusMessages: StatusMessage[];
}

export const PRIORITY_ORDER: Record<StatusPriority, number> = {
  error: 0,
  loading: 1,
  hint: 2,
  info: 3,
};

export function getHighestPriorityMessage(messages: StatusMessage[]): StatusMessage | null {
  const now = Date.now();
  const active = messages.filter((m) => !m.expiresAt || m.expiresAt > now);
  if (active.length === 0) return null;
  return active.reduce((highest, current) =>
    PRIORITY_ORDER[current.priority] < PRIORITY_ORDER[highest.priority] ? current : highest,
  );
}
