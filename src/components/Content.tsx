import React from "react";
import { Box, Text } from "ink";
import type { InteractiveElement } from "../state/AppState.js";

export interface ContentProps {
  elements: InteractiveElement[];
  highlightIndex: number;
  scrollOffset: number;
  viewportHeight: number;
}

export function Content({ elements, highlightIndex, scrollOffset, viewportHeight }: ContentProps) {
  const hasMoreAbove = scrollOffset > 0;
  const hasMoreBelow = scrollOffset + viewportHeight < elements.length;

  // Reserve 1 line for each scroll indicator when needed
  const indicatorLines = (hasMoreAbove ? 1 : 0) + (hasMoreBelow ? 1 : 0);
  const contentHeight = viewportHeight - indicatorLines;
  const visibleElements = elements.slice(scrollOffset, scrollOffset + contentHeight);

  return (
    <Box flexDirection="column" flexGrow={1}>
      {hasMoreAbove && <Text dimColor>▲ more above ({scrollOffset} items)</Text>}
      {visibleElements.map((element, visibleIndex) => {
        const actualIndex = scrollOffset + visibleIndex;
        const isHighlighted = actualIndex === highlightIndex;
        return (
          <Box key={element.ref}>
            <Text color="yellow">[{element.label}]</Text>
            <Text> </Text>
            <Text inverse={isHighlighted} bold={isHighlighted}>
              {element.text}
            </Text>
          </Box>
        );
      })}
      {hasMoreBelow && (
        <Text dimColor>▼ more below ({elements.length - scrollOffset - contentHeight} items)</Text>
      )}
    </Box>
  );
}
