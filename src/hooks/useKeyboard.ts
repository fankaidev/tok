import { useCallback, useEffect, useRef } from "react";
import { useApp, useInput } from "ink";
import type { AppState } from "../state/AppState.js";
import type { AppActions } from "../state/useAppState.js";

const DIGIT_TIMEOUT_MS = 300;

export interface KeyboardCallbacks {
  onNavigate?: (url: string) => void;
  onClick?: (ref: string) => void;
  onBack?: () => void;
  onSearch?: (query: string) => void;
}

export function useKeyboard(
  state: AppState,
  actions: AppActions,
  callbacks: KeyboardCallbacks = {},
): void {
  const { exit } = useApp();
  const digitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleDigitInput = useCallback(
    (digit: string) => {
      const newBuffer = state.inputBuffer + digit;
      actions.setInputBuffer(newBuffer);

      if (digitTimeoutRef.current) {
        clearTimeout(digitTimeoutRef.current);
      }

      const num = parseInt(newBuffer, 10);
      const maxLabel = Math.max(...state.elements.map((e) => e.label), 0);
      const couldHaveMore = num * 10 <= maxLabel;

      if (!couldHaveMore || newBuffer.length >= 2) {
        const element = state.elements.find((e) => e.label === num);
        if (element) {
          actions.setHighlight(state.elements.indexOf(element));
          actions.pushStatus(`Clicked [${num}] ${element.text}`, "info", 2000);
          callbacks.onClick?.(element.ref);
        }
        actions.clearBuffer();
      } else {
        digitTimeoutRef.current = setTimeout(() => {
          const finalNum = parseInt(newBuffer, 10);
          const element = state.elements.find((e) => e.label === finalNum);
          if (element) {
            actions.setHighlight(state.elements.indexOf(element));
            actions.pushStatus(`Clicked [${finalNum}] ${element.text}`, "info", 2000);
            callbacks.onClick?.(element.ref);
          }
          actions.clearBuffer();
        }, DIGIT_TIMEOUT_MS);
      }
    },
    [state.inputBuffer, state.elements, actions, callbacks],
  );

  useEffect(() => {
    return () => {
      if (digitTimeoutRef.current) {
        clearTimeout(digitTimeoutRef.current);
      }
    };
  }, []);

  useInput((input, key) => {
    // URL input mode
    if (state.inputMode === "url") {
      if (key.escape) {
        actions.setInputMode("normal");
      } else if (key.return) {
        if (state.inputBuffer) {
          actions.pushStatus(`Navigating to ${state.inputBuffer}`, "loading", 2000);
          callbacks.onNavigate?.(state.inputBuffer);
        }
        actions.setInputMode("normal");
      } else if (key.backspace || key.delete) {
        actions.setInputBuffer(state.inputBuffer.slice(0, -1));
      } else if (input && !key.ctrl && !key.meta) {
        actions.appendToBuffer(input);
      }
      return;
    }

    // Search input mode
    if (state.inputMode === "search") {
      if (key.escape) {
        actions.setInputMode("normal");
      } else if (key.return) {
        if (state.inputBuffer) {
          actions.pushStatus(`Searching: ${state.inputBuffer}`, "info", 2000);
          callbacks.onSearch?.(state.inputBuffer);
        }
        actions.setInputMode("normal");
      } else if (key.backspace || key.delete) {
        actions.setInputBuffer(state.inputBuffer.slice(0, -1));
      } else if (input && !key.ctrl && !key.meta) {
        actions.appendToBuffer(input);
      }
      return;
    }

    // Normal mode
    if (input === "q") {
      exit();
      return;
    }

    if (input === "g") {
      actions.setInputMode("url");
      return;
    }

    if (input === "/") {
      actions.setInputMode("search");
      return;
    }

    if (input === "j" || key.downArrow) {
      actions.moveHighlight(1);
      return;
    }

    if (input === "k" || key.upArrow) {
      actions.moveHighlight(-1);
      return;
    }

    if (input === "b") {
      actions.pushStatus("Going back...", "loading", 1000);
      callbacks.onBack?.();
      return;
    }

    if (key.return) {
      const element = state.elements[state.highlightIndex];
      if (element) {
        actions.pushStatus(`Clicked [${element.label}] ${element.text}`, "info", 2000);
        callbacks.onClick?.(element.ref);
      }
      return;
    }

    if (/^[0-9]$/.test(input)) {
      handleDigitInput(input);
    }
  });
}
