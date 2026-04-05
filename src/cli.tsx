#!/usr/bin/env node
import React from "react";
import { render } from "ink";
import { homedir } from "os";
import { App } from "./components/App.js";

function expandTilde(path: string): string {
  if (path.startsWith("~/")) {
    return homedir() + path.slice(1);
  }
  if (path === "~") {
    return homedir();
  }
  return path;
}

interface ParsedArgs {
  url: string;
  profile?: string;
  port?: number;
}

function parseArgs(args: string[]): ParsedArgs | null {
  let url: string | undefined;
  let profile: string | undefined;
  let port: number | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!;

    if (arg === "--profile" || arg === "-p") {
      profile = args[++i];
      if (!profile) {
        console.error("Error: --profile requires a path argument");
        return null;
      }
    } else if (arg === "--port") {
      const portStr = args[++i];
      if (!portStr) {
        console.error("Error: --port requires a number argument");
        return null;
      }
      port = parseInt(portStr, 10);
      if (isNaN(port) || port < 1 || port > 65535) {
        console.error(`Error: Invalid port number: ${portStr}`);
        return null;
      }
    } else if (arg.startsWith("--profile=")) {
      profile = arg.slice("--profile=".length);
    } else if (arg.startsWith("-p=")) {
      profile = arg.slice("-p=".length);
    } else if (arg.startsWith("--port=")) {
      const portStr = arg.slice("--port=".length);
      port = parseInt(portStr, 10);
      if (isNaN(port) || port < 1 || port > 65535) {
        console.error(`Error: Invalid port number: ${portStr}`);
        return null;
      }
    } else if (!arg.startsWith("-")) {
      url = arg;
    } else {
      console.error(`Error: Unknown option: ${arg}`);
      return null;
    }
  }

  // Check environment variables as fallback
  if (!profile && process.env.TOK_CHROME_PROFILE) {
    profile = process.env.TOK_CHROME_PROFILE;
  }
  if (!port && process.env.TOK_CDP_PORT) {
    const envPort = parseInt(process.env.TOK_CDP_PORT, 10);
    if (!isNaN(envPort) && envPort >= 1 && envPort <= 65535) {
      port = envPort;
    }
  }

  if (!url) {
    return null;
  }

  const result: ParsedArgs = { url };
  if (profile) result.profile = expandTilde(profile);
  if (port) result.port = port;
  return result;
}

function printHelp() {
  console.log("Usage: tok <url> [options]");
  console.log("");
  console.log("A terminal browser powered by agent-browser.");
  console.log("");
  console.log("Options:");
  console.log("  --profile, -p <path>  Chrome profile directory");
  console.log("  --port <number>       CDP (Chrome DevTools Protocol) port");
  console.log("  --help, -h            Show this help message");
  console.log("");
  console.log("Environment variables:");
  console.log("  TOK_CHROME_PROFILE    Default Chrome profile directory");
  console.log("  TOK_CDP_PORT          Default CDP port");
  console.log("");
  console.log("Examples:");
  console.log("  tok https://news.ycombinator.com");
  console.log("  tok https://example.com --profile ~/.config/google-chrome/Default");
  console.log("  tok https://example.com --port 9222");
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

  const parsed = parseArgs(args);
  if (!parsed) {
    process.exit(1);
  }

  const { url, profile, port } = parsed;

  // Basic URL validation
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    console.error(`Error: Invalid URL: ${url}`);
    console.error("URL must start with http:// or https://");
    process.exit(1);
  }

  const browserOptions: { profile?: string; port?: number } = {};
  if (profile) browserOptions.profile = profile;
  if (port) browserOptions.port = port;

  render(<App url={url} browserOptions={browserOptions} />);
}

main();
