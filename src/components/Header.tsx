import React from "react";
import { Box, Text } from "ink";

export interface HeaderProps {
  title: string;
  url: string;
}

export function Header({ title, url }: HeaderProps) {
  return (
    <Box>
      <Text>tok - </Text>
      {title && (
        <>
          <Text>{title}</Text>
          <Text dimColor> | </Text>
        </>
      )}
      <Text dimColor>{url}</Text>
    </Box>
  );
}
