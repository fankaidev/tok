import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import type { AppState } from "../state/AppState.js";
import type { AppActions } from "../state/useAppState.js";

describe("useKeyboard", () => {
  let state: AppState;
  let actions: AppActions;

  beforeEach(() => {
    vi.useFakeTimers();

    state = {
      url: "https://example.com",
      title: "Example",
      elements: [
        { ref: "a", label: 1, text: "Link 1", type: "link" },
        { ref: "b", label: 2, text: "Link 2", type: "link" },
        { ref: "c", label: 10, text: "Link 10", type: "link" },
        { ref: "d", label: 11, text: "Link 11", type: "link" },
      ],
      displayLines: [
        { text: "[1] Link 1", interactive: true, number: 1 },
        { text: "[2] Link 2", interactive: true, number: 2 },
        { text: "[10] Link 10", interactive: true, number: 10 },
        { text: "[11] Link 11", interactive: true, number: 11 },
      ],
      highlightIndex: 0,
      scrollOffset: 0,
      totalLines: 10,
      inputMode: "normal",
      inputBuffer: "",
      statusMessages: [],
      isLoading: false,
      numberToRef: {},
    };

    actions = {
      setHighlight: vi.fn(),
      moveHighlight: vi.fn(),
      setInputMode: vi.fn(),
      setInputBuffer: vi.fn(),
      appendToBuffer: vi.fn(),
      clearBuffer: vi.fn(),
      pushStatus: vi.fn(),
      clearStatus: vi.fn(),
      setScrollOffset: vi.fn(),
      setLoading: vi.fn(),
      setPage: vi.fn(),
      scrollPage: vi.fn(),
      scrollToEnd: vi.fn(),
    };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("normal mode navigation", () => {
    it("moveHighlight(1) on j key", () => {
      const { handleInput } = createKeyboardHandler(state, actions);
      handleInput("j", {});
      expect(actions.moveHighlight).toHaveBeenCalledWith(1, 20);
    });

    it("moveHighlight(-1) on k key", () => {
      const { handleInput } = createKeyboardHandler(state, actions);
      handleInput("k", {});
      expect(actions.moveHighlight).toHaveBeenCalledWith(-1, 20);
    });

    it("moveHighlight(1) on down arrow", () => {
      const { handleInput } = createKeyboardHandler(state, actions);
      handleInput("", { downArrow: true });
      expect(actions.moveHighlight).toHaveBeenCalledWith(1, 20);
    });

    it("moveHighlight(-1) on up arrow", () => {
      const { handleInput } = createKeyboardHandler(state, actions);
      handleInput("", { upArrow: true });
      expect(actions.moveHighlight).toHaveBeenCalledWith(-1, 20);
    });
  });

  describe("scroll navigation", () => {
    it("scrollPage down on Page Down", () => {
      const { handleInput } = createKeyboardHandler(state, actions);
      handleInput("", { pageDown: true });
      expect(actions.scrollPage).toHaveBeenCalledWith("down", 20);
    });

    it("scrollPage up on Page Up", () => {
      const { handleInput } = createKeyboardHandler(state, actions);
      handleInput("", { pageUp: true });
      expect(actions.scrollPage).toHaveBeenCalledWith("up", 20);
    });

    it("scrollPage down on Ctrl+D", () => {
      const { handleInput } = createKeyboardHandler(state, actions);
      handleInput("d", { ctrl: true });
      expect(actions.scrollPage).toHaveBeenCalledWith("down", 20);
    });

    it("scrollPage up on Ctrl+U", () => {
      const { handleInput } = createKeyboardHandler(state, actions);
      handleInput("u", { ctrl: true });
      expect(actions.scrollPage).toHaveBeenCalledWith("up", 20);
    });

    it("scrollToEnd start on Cmd+Up", () => {
      const { handleInput } = createKeyboardHandler(state, actions);
      handleInput("", { meta: true, upArrow: true });
      expect(actions.scrollToEnd).toHaveBeenCalledWith("start", 20);
    });

    it("scrollToEnd end on Cmd+Down", () => {
      const { handleInput } = createKeyboardHandler(state, actions);
      handleInput("", { meta: true, downArrow: true });
      expect(actions.scrollToEnd).toHaveBeenCalledWith("end", 20);
    });

    it("scrollToEnd end on G key", () => {
      const { handleInput } = createKeyboardHandler(state, actions);
      handleInput("G", {});
      expect(actions.scrollToEnd).toHaveBeenCalledWith("end", 20);
    });
  });

  describe("mode switching", () => {
    it("enters url mode on g key", () => {
      const { handleInput } = createKeyboardHandler(state, actions);
      handleInput("g", {});
      expect(actions.setInputMode).toHaveBeenCalledWith("url");
    });

    it("enters search mode on / key", () => {
      const { handleInput } = createKeyboardHandler(state, actions);
      handleInput("/", {});
      expect(actions.setInputMode).toHaveBeenCalledWith("search");
    });
  });

  describe("url mode", () => {
    beforeEach(() => {
      state.inputMode = "url";
      state.inputBuffer = "https://";
    });

    it("appends characters to buffer", () => {
      const { handleInput } = createKeyboardHandler(state, actions);
      handleInput("a", {});
      expect(actions.appendToBuffer).toHaveBeenCalledWith("a");
    });

    it("removes last char on backspace", () => {
      const { handleInput } = createKeyboardHandler(state, actions);
      handleInput("", { backspace: true });
      expect(actions.setInputBuffer).toHaveBeenCalledWith("https:/");
    });

    it("returns to normal mode on escape", () => {
      const { handleInput } = createKeyboardHandler(state, actions);
      handleInput("", { escape: true });
      expect(actions.setInputMode).toHaveBeenCalledWith("normal");
    });

    it("calls onNavigate and returns to normal mode on enter", () => {
      const onNavigate = vi.fn();
      const { handleInput } = createKeyboardHandler(state, actions, { onNavigate });
      handleInput("", { return: true });
      expect(onNavigate).toHaveBeenCalledWith("https://");
      expect(actions.setInputMode).toHaveBeenCalledWith("normal");
    });
  });

  describe("search mode", () => {
    beforeEach(() => {
      state.inputMode = "search";
      state.inputBuffer = "hello";
    });

    it("appends characters to buffer", () => {
      const { handleInput } = createKeyboardHandler(state, actions);
      handleInput("w", {});
      expect(actions.appendToBuffer).toHaveBeenCalledWith("w");
    });

    it("returns to normal mode on escape", () => {
      const { handleInput } = createKeyboardHandler(state, actions);
      handleInput("", { escape: true });
      expect(actions.setInputMode).toHaveBeenCalledWith("normal");
    });

    it("calls onSearch and returns to normal mode on enter", () => {
      const onSearch = vi.fn();
      const { handleInput } = createKeyboardHandler(state, actions, { onSearch });
      handleInput("", { return: true });
      expect(onSearch).toHaveBeenCalledWith("hello");
      expect(actions.setInputMode).toHaveBeenCalledWith("normal");
    });
  });

  describe("digit input", () => {
    it("clicks element immediately when no higher numbers exist", () => {
      const onClick = vi.fn();
      const { handleInput } = createKeyboardHandler(state, actions, { onClick });
      handleInput("2", {});

      expect(actions.setHighlight).toHaveBeenCalled();
      expect(onClick).toHaveBeenCalledWith("b");
      expect(actions.clearBuffer).toHaveBeenCalled();
    });

    it("waits for second digit when higher numbers exist", () => {
      const onClick = vi.fn();
      const { handleInput } = createKeyboardHandler(state, actions, { onClick });
      handleInput("1", {});

      expect(onClick).not.toHaveBeenCalled();
      expect(actions.setInputBuffer).toHaveBeenCalledWith("1");
    });

    it("clicks after timeout when no second digit", () => {
      const onClick = vi.fn();
      const { handleInput } = createKeyboardHandler(state, actions, { onClick });
      handleInput("1", {});

      vi.advanceTimersByTime(300);

      expect(onClick).toHaveBeenCalledWith("a");
    });

    it("clicks two-digit element when typed quickly", () => {
      const onClick = vi.fn();
      state.inputBuffer = "1";
      const { handleInput } = createKeyboardHandler(state, actions, { onClick });
      handleInput("1", {});

      expect(onClick).toHaveBeenCalledWith("d");
    });
  });

  describe("element actions", () => {
    it("clicks highlighted element on enter", () => {
      const onClick = vi.fn();
      state.highlightIndex = 1;
      const { handleInput } = createKeyboardHandler(state, actions, { onClick });
      handleInput("", { return: true });

      expect(onClick).toHaveBeenCalledWith("b");
      expect(actions.pushStatus).toHaveBeenCalled();
    });

    it("calls onBack on b key", () => {
      const onBack = vi.fn();
      const { handleInput } = createKeyboardHandler(state, actions, { onBack });
      handleInput("b", {});

      expect(onBack).toHaveBeenCalled();
      expect(actions.pushStatus).toHaveBeenCalled();
    });
  });
});

interface KeyInfo {
  upArrow?: boolean;
  downArrow?: boolean;
  return?: boolean;
  escape?: boolean;
  backspace?: boolean;
  delete?: boolean;
  ctrl?: boolean;
  meta?: boolean;
  pageUp?: boolean;
  pageDown?: boolean;
}

interface KeyboardCallbacks {
  onNavigate?: (url: string) => void;
  onClick?: (ref: string) => void;
  onBack?: () => void;
  onSearch?: (query: string) => void;
}

function createKeyboardHandler(
  state: AppState,
  actions: AppActions,
  callbacks: KeyboardCallbacks = {},
  viewportHeight: number = 20,
) {
  const DIGIT_TIMEOUT_MS = 300;
  let digitTimeout: ReturnType<typeof setTimeout> | null = null;

  const handleInput = (input: string, key: KeyInfo) => {
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

    if (input === "g") {
      actions.setInputMode("url");
      return;
    }

    if (input === "/") {
      actions.setInputMode("search");
      return;
    }

    if (key.meta && key.upArrow) {
      actions.scrollToEnd("start", viewportHeight);
      return;
    }

    if (key.meta && key.downArrow) {
      actions.scrollToEnd("end", viewportHeight);
      return;
    }

    if (input === "j" || key.downArrow) {
      actions.moveHighlight(1, viewportHeight);
      return;
    }

    if (input === "k" || key.upArrow) {
      actions.moveHighlight(-1, viewportHeight);
      return;
    }

    if (key.pageDown || (key.ctrl && input === "d")) {
      actions.scrollPage("down", viewportHeight);
      return;
    }

    if (key.pageUp || (key.ctrl && input === "u")) {
      actions.scrollPage("up", viewportHeight);
      return;
    }

    if (input === "G") {
      actions.scrollToEnd("end", viewportHeight);
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
      const newBuffer = state.inputBuffer + input;
      actions.setInputBuffer(newBuffer);

      if (digitTimeout) {
        clearTimeout(digitTimeout);
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
        digitTimeout = setTimeout(() => {
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
    }
  };

  return { handleInput };
}
