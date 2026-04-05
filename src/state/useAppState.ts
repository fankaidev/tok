import { useCallback, useState } from "react";
import type {
  AppState,
  InputMode,
  InteractiveElement,
  StatusMessage,
  StatusPriority,
} from "./AppState.js";

const MOCK_ELEMENTS: InteractiveElement[] = [
  { ref: "1", label: 1, text: "Hacker News", type: "link" },
  { ref: "2", label: 2, text: "new", type: "link" },
  { ref: "3", label: 3, text: "past", type: "link" },
  { ref: "4", label: 4, text: "comments", type: "link" },
  { ref: "5", label: 5, text: "77 comments", type: "link" },
  { ref: "6", label: 6, text: "161 comments", type: "link" },
];

const initialState: AppState = {
  url: "https://news.ycombinator.com",
  title: "Hacker News",
  elements: MOCK_ELEMENTS,
  highlightIndex: 0,
  scrollOffset: 0,
  totalLines: 20,
  inputMode: "normal",
  inputBuffer: "",
  statusMessages: [{ text: "Press q to quit, g to go to URL", priority: "hint" }],
};

export interface AppActions {
  setHighlight: (index: number) => void;
  moveHighlight: (delta: number) => void;
  setInputMode: (mode: InputMode) => void;
  setInputBuffer: (buffer: string) => void;
  appendToBuffer: (char: string) => void;
  clearBuffer: () => void;
  pushStatus: (text: string, priority: StatusPriority, ttl?: number) => void;
  clearStatus: (priority?: StatusPriority) => void;
  setScrollOffset: (offset: number) => void;
}

export function useAppState(): [AppState, AppActions] {
  const [state, setState] = useState<AppState>(initialState);

  const setHighlight = useCallback((index: number) => {
    setState((s) => ({
      ...s,
      highlightIndex: Math.max(0, Math.min(index, s.elements.length - 1)),
    }));
  }, []);

  const moveHighlight = useCallback((delta: number) => {
    setState((s) => ({
      ...s,
      highlightIndex: Math.max(0, Math.min(s.highlightIndex + delta, s.elements.length - 1)),
    }));
  }, []);

  const setInputMode = useCallback((mode: InputMode) => {
    setState((s) => ({ ...s, inputMode: mode, inputBuffer: "" }));
  }, []);

  const setInputBuffer = useCallback((buffer: string) => {
    setState((s) => ({ ...s, inputBuffer: buffer }));
  }, []);

  const appendToBuffer = useCallback((char: string) => {
    setState((s) => ({ ...s, inputBuffer: s.inputBuffer + char }));
  }, []);

  const clearBuffer = useCallback(() => {
    setState((s) => ({ ...s, inputBuffer: "" }));
  }, []);

  const pushStatus = useCallback((text: string, priority: StatusPriority, ttl?: number) => {
    const message: StatusMessage = ttl
      ? { text, priority, expiresAt: Date.now() + ttl }
      : { text, priority };
    setState((s) => ({ ...s, statusMessages: [...s.statusMessages, message] }));
  }, []);

  const clearStatus = useCallback((priority?: StatusPriority) => {
    setState((s) => ({
      ...s,
      statusMessages: priority ? s.statusMessages.filter((m) => m.priority !== priority) : [],
    }));
  }, []);

  const setScrollOffset = useCallback((offset: number) => {
    setState((s) => ({
      ...s,
      scrollOffset: Math.max(0, Math.min(offset, Math.max(0, s.totalLines - 1))),
    }));
  }, []);

  const actions: AppActions = {
    setHighlight,
    moveHighlight,
    setInputMode,
    setInputBuffer,
    appendToBuffer,
    clearBuffer,
    pushStatus,
    clearStatus,
    setScrollOffset,
  };

  return [state, actions];
}
