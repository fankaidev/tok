import React from "react";
import { Box, Text } from "ink";
import type { StatusMessage } from "../state/AppState.js";
import { getHighestPriorityMessage } from "../state/AppState.js";

export interface StatusBarProps {
  messages: StatusMessage[];
  scrollOffset: number;
  totalLines: number;
  viewportHeight: number;
}

const PRIORITY_COLORS: Record<string, string | undefined> = {
  error: "red",
  loading: "yellow",
  hint: undefined,
  info: undefined,
};

export function StatusBar({ messages, scrollOffset, totalLines, viewportHeight }: StatusBarProps) {
  const message = getHighestPriorityMessage(messages);
  const showScroll = totalLines > viewportHeight;
  const scrollPercent = totalLines > 0 ? Math.round(((scrollOffset + viewportHeight) / totalLines) * 100) : 0;

  const renderStatusText = () => {
    if (!message) return null;
    const color = PRIORITY_COLORS[message.priority];
    const isDim = message.priority === "hint" || message.priority === "info";
    if (color) {
      return <Text color={color}>{message.text}</Text>;
    }
    return <Text dimColor={isDim}>{message.text}</Text>;
  };

  return (
    <Box flexDirection="column">
      <Text>{"─".repeat(60)}</Text>
      <Box justifyContent="space-between">
        <Box>{renderStatusText()}</Box>
        {showScroll && <Text dimColor>{scrollPercent}%</Text>}
      </Box>
    </Box>
  );
}
