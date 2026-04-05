import React, { useEffect } from "react";
import { Box, useApp, useStdout } from "ink";
import { Header } from "./Header.js";
import { Content } from "./Content.js";
import { StatusBar } from "./StatusBar.js";
import { Input } from "./Input.js";
import { useAppState } from "../state/useAppState.js";
import { useKeyboard } from "../hooks/useKeyboard.js";
import { useBrowser } from "../hooks/useBrowser.js";

export interface AppProps {
  url?: string;
}

export function App({ url }: AppProps) {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const [state, actions] = useAppState(url);
  const { navigate, click, back, cleanup } = useBrowser(state, actions);

  const viewportHeight = stdout?.rows ? stdout.rows - 4 : 20;

  useKeyboard(
    state,
    actions,
    {
      onNavigate: navigate,
      onClick: (ref) => {
        click(ref);
      },
      onBack: back,
    },
    { viewportHeight },
  );

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  useEffect(() => {
    const handleExit = () => {
      cleanup().then(() => exit());
    };

    process.on("SIGINT", handleExit);
    process.on("SIGTERM", handleExit);

    return () => {
      process.off("SIGINT", handleExit);
      process.off("SIGTERM", handleExit);
    };
  }, [cleanup, exit]);

  return (
    <Box flexDirection="column" height={stdout?.rows}>
      <Header title={state.title} url={state.url} />
      <Content
        displayLines={state.displayLines}
        highlightNumber={state.elements[state.highlightIndex]?.label}
        scrollOffset={state.scrollOffset}
        viewportHeight={viewportHeight}
      />
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
