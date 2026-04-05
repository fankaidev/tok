import React from "react";
import { Box, Text } from "ink";
import type { InteractiveElement } from "../state/AppState.js";

export interface ContentProps {
  elements: InteractiveElement[];
  highlightIndex: number;
}

export function Content({ elements, highlightIndex }: ContentProps) {
  return (
    <Box flexDirection="column" flexGrow={1}>
      {elements.map((element, index) => {
        const isHighlighted = index === highlightIndex;
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
    </Box>
  );
}
