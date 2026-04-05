import React from "react";
import { Box, useStdout } from "ink";
import { Header } from "./Header.js";
import { Content } from "./Content.js";
import { StatusBar } from "./StatusBar.js";
import { Input } from "./Input.js";
import { useAppState } from "../state/useAppState.js";
import { useKeyboard } from "../hooks/useKeyboard.js";

export function App() {
  const { stdout } = useStdout();
  const [state, actions] = useAppState();

  const viewportHeight = stdout?.rows ? stdout.rows - 4 : 20;

  useKeyboard(state, actions);

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
