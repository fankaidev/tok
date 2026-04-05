import React from "react";
import { Box, Text } from "ink";
import type { DisplayLine } from "../state/AppState.js";

export interface ContentProps {
  displayLines: DisplayLine[];
  highlightNumber: number | undefined;
  scrollOffset: number;
  viewportHeight: number;
}

export function Content({
  displayLines,
  highlightNumber,
  scrollOffset,
  viewportHeight,
}: ContentProps) {
  const hasMoreAbove = scrollOffset > 0;
  const hasMoreBelow = scrollOffset + viewportHeight < displayLines.length;

  // Reserve 1 line for each scroll indicator when needed
  const indicatorLines = (hasMoreAbove ? 1 : 0) + (hasMoreBelow ? 1 : 0);
  const contentHeight = viewportHeight - indicatorLines;
  const visibleLines = displayLines.slice(scrollOffset, scrollOffset + contentHeight);

  return (
    <Box flexDirection="column" flexGrow={1}>
      {hasMoreAbove && <Text dimColor>▲ more above ({scrollOffset} lines)</Text>}
      {visibleLines.map((line, visibleIndex) => {
        const lineIndex = scrollOffset + visibleIndex;
        const isHighlighted = line.interactive && line.number === highlightNumber;

        if (line.interactive && line.number !== undefined) {
          // Interactive line - show number in yellow, highlight if selected
          return (
            <Box key={lineIndex}>
              <Text inverse={isHighlighted} bold={isHighlighted}>
                {line.text}
              </Text>
            </Box>
          );
        } else {
          // Non-interactive line - dimmed
          return (
            <Box key={lineIndex}>
              <Text dimColor>{line.text}</Text>
            </Box>
          );
        }
      })}
      {hasMoreBelow && (
        <Text dimColor>
          ▼ more below ({displayLines.length - scrollOffset - contentHeight} lines)
        </Text>
      )}
    </Box>
  );
}
