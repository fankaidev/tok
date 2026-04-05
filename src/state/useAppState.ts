import { useCallback, useState } from "react";
import type {
  AppState,
  DisplayLine,
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
    displayLines: [],
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
  displayLines: DisplayLine[];
  totalLines: number;
  numberToRef: Record<number, string>;
}

export interface AppActions {
  setHighlight: (index: number, viewportHeight?: number) => void;
  moveHighlight: (delta: number, viewportHeight?: number) => void;
  setInputMode: (mode: InputMode) => void;
  setInputBuffer: (buffer: string) => void;
  appendToBuffer: (char: string) => void;
  clearBuffer: () => void;
  pushStatus: (text: string, priority: StatusPriority, ttl?: number) => void;
  clearStatus: (priority?: StatusPriority) => void;
  setScrollOffset: (offset: number) => void;
  setLoading: (loading: boolean) => void;
  setPage: (data: PageData) => void;
  scrollPage: (direction: "up" | "down", viewportHeight: number) => void;
  scrollToEnd: (position: "start" | "end", viewportHeight: number) => void;
}

export function useAppState(initialUrl?: string): [AppState, AppActions] {
  const [state, setState] = useState<AppState>(() => createInitialState(initialUrl));

  const setHighlight = useCallback((index: number, viewportHeight?: number) => {
    setState((s) => {
      const newIndex = Math.max(0, Math.min(index, s.elements.length - 1));
      let newOffset = s.scrollOffset;

      if (viewportHeight) {
        // Auto-scroll to keep highlight visible
        if (newIndex < newOffset) {
          newOffset = newIndex;
        } else if (newIndex >= newOffset + viewportHeight) {
          newOffset = newIndex - viewportHeight + 1;
        }
      }

      return {
        ...s,
        highlightIndex: newIndex,
        scrollOffset: Math.max(0, newOffset),
      };
    });
  }, []);

  const moveHighlight = useCallback((delta: number, viewportHeight?: number) => {
    setState((s) => {
      const newIndex = Math.max(0, Math.min(s.highlightIndex + delta, s.elements.length - 1));
      let newOffset = s.scrollOffset;

      if (viewportHeight) {
        // Auto-scroll to keep highlight visible
        if (newIndex < newOffset) {
          newOffset = newIndex;
        } else if (newIndex >= newOffset + viewportHeight) {
          newOffset = newIndex - viewportHeight + 1;
        }
      }

      return {
        ...s,
        highlightIndex: newIndex,
        scrollOffset: Math.max(0, newOffset),
      };
    });
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
      scrollOffset: Math.max(0, Math.min(offset, Math.max(0, s.displayLines.length - 1))),
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
      displayLines: data.displayLines,
      totalLines: data.totalLines,
      numberToRef: data.numberToRef,
      highlightIndex: 0,
      scrollOffset: 0,
      isLoading: false,
    }));
  }, []);

  const scrollPage = useCallback((direction: "up" | "down", viewportHeight: number) => {
    setState((s) => {
      const pageSize = Math.max(1, viewportHeight - 1);
      const delta = direction === "down" ? pageSize : -pageSize;
      const maxOffset = Math.max(0, s.displayLines.length - viewportHeight);
      const newOffset = Math.max(0, Math.min(s.scrollOffset + delta, maxOffset));

      // Find first interactive line in visible area for highlight
      let newHighlight = s.highlightIndex;
      const visibleStart = newOffset;
      const visibleEnd = Math.min(newOffset + viewportHeight, s.displayLines.length);

      // Check if current highlight is still visible
      const highlightLineIndex = s.displayLines.findIndex(
        (line) => line.interactive && line.number === s.elements[s.highlightIndex]?.label,
      );

      if (highlightLineIndex < visibleStart || highlightLineIndex >= visibleEnd) {
        // Find first interactive element in visible area
        for (let i = visibleStart; i < visibleEnd; i++) {
          const line = s.displayLines[i];
          if (line?.interactive && line.number !== undefined) {
            const elemIdx = s.elements.findIndex((e) => e.label === line.number);
            if (elemIdx >= 0) {
              newHighlight = elemIdx;
              break;
            }
          }
        }
      }

      return {
        ...s,
        scrollOffset: newOffset,
        highlightIndex: newHighlight,
      };
    });
  }, []);

  const scrollToEnd = useCallback((position: "start" | "end", viewportHeight: number) => {
    setState((s) => {
      if (position === "start") {
        return {
          ...s,
          scrollOffset: 0,
          highlightIndex: 0,
        };
      } else {
        const maxOffset = Math.max(0, s.displayLines.length - viewportHeight);
        return {
          ...s,
          scrollOffset: maxOffset,
          highlightIndex: s.elements.length - 1,
        };
      }
    });
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
    scrollPage,
    scrollToEnd,
  };

  return [state, actions];
}
