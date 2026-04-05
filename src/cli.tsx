#!/usr/bin/env node
import React from "react";
import { render } from "ink";
import { App } from "./components/App.js";

function printHelp() {
  console.log("Usage: tok <url>");
  console.log("");
  console.log("A terminal browser powered by agent-browser.");
  console.log("");
  console.log("Options:");
  console.log("  --help, -h  Show this help message");
  console.log("");
  console.log("Environment variables (passed to agent-browser):");
  console.log("  AGENT_BROWSER_PROFILE  Chrome profile directory");
  console.log("  AGENT_BROWSER_CDP      CDP port to connect to");
  console.log("");
  console.log("Examples:");
  console.log("  tok https://news.ycombinator.com");
  console.log("  AGENT_BROWSER_PROFILE=~/.chrome-profile tok https://example.com");
}

function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    printHelp();
    process.exit(0);
  }

  if (args.length === 0) {
    printHelp();
    process.exit(1);
  }

  const url = args[0]!;

  // Basic URL validation
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    console.error(`Error: Invalid URL: ${url}`);
    console.error("URL must start with http:// or https://");
    process.exit(1);
  }

  render(<App url={url} />);
}

main();
