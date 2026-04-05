import { useCallback, useState } from "react";
import type {
  AppState,
  InputMode,
  InteractiveElement,
  StatusMessage,
  StatusPriority,
} from "./AppState.js";

const DEFAULT_HINT: StatusMessage = { text: "q:quit g:url /:search j/k:nav", priority: "hint" };

function createInitialState(url?: string): AppState {
  return {
    url: url ?? "",
    title: "",
    elements: [],
    highlightIndex: 0,
    scrollOffset: 0,
    totalLines: 0,
    inputMode: "normal",
    inputBuffer: "",
    statusMessages: [DEFAULT_HINT],
    isLoading: false,
    numberToRef: {},
  };
}

export interface PageData {
  url: string;
  title: string;
  elements: InteractiveElement[];
  totalLines: number;
  numberToRef: Record<number, string>;
}

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
  setLoading: (loading: boolean) => void;
  setPage: (data: PageData) => void;
}

export function useAppState(initialUrl?: string): [AppState, AppActions] {
  const [state, setState] = useState<AppState>(() => createInitialState(initialUrl));

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

  const setLoading = useCallback((loading: boolean) => {
    setState((s) => ({ ...s, isLoading: loading }));
  }, []);

  const setPage = useCallback((data: PageData) => {
    setState((s) => ({
      ...s,
      url: data.url,
      title: data.title,
      elements: data.elements,
      totalLines: data.totalLines,
      numberToRef: data.numberToRef,
      highlightIndex: 0,
      scrollOffset: 0,
      isLoading: false,
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
    setLoading,
    setPage,
  };

  return [state, actions];
}
