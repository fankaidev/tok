#!/usr/bin/env node
import React from "react";
import { render } from "ink";
import { App } from "./components/App.js";

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    console.log("Usage: tok <url>");
    console.log("");
    console.log("A terminal browser powered by agent-browser.");
    console.log("");
    console.log("Examples:");
    console.log("  tok https://news.ycombinator.com");
    console.log("  tok https://example.com");
    process.exit(args.length === 0 ? 1 : 0);
  }

  const url = args[0]!;

  // Basic URL validation
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    console.error(`Invalid URL: ${url}`);
    console.error("URL must start with http:// or https://");
    process.exit(1);
  }

  render(<App url={url} />);
}

main();
