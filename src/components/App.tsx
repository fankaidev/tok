import React, { useCallback, useEffect, useRef } from "react";
import { Box, useApp, useInput, useStdout } from "ink";
import { Header } from "./Header.js";
import { Content } from "./Content.js";
import { StatusBar } from "./StatusBar.js";
import { Input } from "./Input.js";
import { useAppState } from "../state/useAppState.js";

const DIGIT_TIMEOUT_MS = 300;

export function App() {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const [state, actions] = useAppState();
  const digitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const viewportHeight = stdout?.rows ? stdout.rows - 4 : 20;

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
        }
        actions.clearBuffer();
      } else {
        digitTimeoutRef.current = setTimeout(() => {
          const finalNum = parseInt(newBuffer, 10);
          const element = state.elements.find((e) => e.label === finalNum);
          if (element) {
            actions.setHighlight(state.elements.indexOf(element));
            actions.pushStatus(`Clicked [${finalNum}] ${element.text}`, "info", 2000);
          }
          actions.clearBuffer();
        }, DIGIT_TIMEOUT_MS);
      }
    },
    [state.inputBuffer, state.elements, actions]
  );

  useEffect(() => {
    return () => {
      if (digitTimeoutRef.current) {
        clearTimeout(digitTimeoutRef.current);
      }
    };
  }, []);

  useInput((input, key) => {
    if (state.inputMode === "url") {
      if (key.escape) {
        actions.setInputMode("normal");
      } else if (key.return) {
        if (state.inputBuffer) {
          actions.pushStatus(`Navigating to ${state.inputBuffer}`, "loading", 2000);
        }
        actions.setInputMode("normal");
      } else if (key.backspace || key.delete) {
        actions.setInputBuffer(state.inputBuffer.slice(0, -1));
      } else if (input && !key.ctrl && !key.meta) {
        actions.appendToBuffer(input);
      }
      return;
    }

    if (input === "q") {
      exit();
      return;
    }

    if (input === "g") {
      actions.setInputMode("url");
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
      return;
    }

    if (key.return) {
      const element = state.elements[state.highlightIndex];
      if (element) {
        actions.pushStatus(`Clicked [${element.label}] ${element.text}`, "info", 2000);
      }
      return;
    }

    if (/^[0-9]$/.test(input)) {
      handleDigitInput(input);
    }
  });

  return (
    <Box flexDirection="column" height={stdout?.rows}>
      <Header title={state.title} url={state.url} />
      <Content elements={state.elements} highlightIndex={state.highlightIndex} />
      <StatusBar
        messages={state.statusMessages}
        scrollOffset={state.scrollOffset}
        totalLines={state.totalLines}
        viewportHeight={viewportHeight}
      />
      <Input mode={state.inputMode} buffer={state.inputBuffer} />
    </Box>
  );
}
