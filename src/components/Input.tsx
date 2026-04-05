import React from "react";
import { Box, Text } from "ink";
import type { InputMode } from "../state/AppState.js";

export interface InputProps {
  mode: InputMode;
  buffer: string;
}

export function Input({ mode, buffer }: InputProps) {
  if (mode === "url") {
    return (
      <Box>
        <Text color="cyan">Go to: </Text>
        <Text>{buffer}</Text>
        <Text>_</Text>
      </Box>
    );
  }

  if (mode === "search") {
    return (
      <Box>
        <Text color="cyan">Search: </Text>
        <Text>{buffer}</Text>
        <Text>_</Text>
      </Box>
    );
  }

  return (
    <Box>
      <Text color="cyan">&gt; </Text>
      {buffer && <Text dimColor>{buffer}</Text>}
      <Text>_</Text>
    </Box>
  );
}
