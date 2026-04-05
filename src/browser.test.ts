import { describe, it, expect, afterEach } from "vitest";
import { Browser, BrowserError } from "./browser.js";

function uniqueSession() {
  return `test-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

describe("Browser", () => {
  let browser: Browser;

  afterEach(async () => {
    if (browser) {
      await browser.close().catch(() => {});
    }
  });

  it("open and snapshot", async () => {
    browser = new Browser({ sessionName: uniqueSession(), headless: true });
    await browser.open("data:text/html,<h1>Hello</h1>");
    const tree = await browser.snapshot({ compact: true });
    expect(tree).toContain("Hello");
  });

  it("getUrl", async () => {
    browser = new Browser({ sessionName: uniqueSession(), headless: true });
    await browser.open("data:text/html,<h1>Test</h1>");
    const url = await browser.getUrl();
    expect(url).toContain("data:text/html");
  });

  it("fill", async () => {
    browser = new Browser({ sessionName: uniqueSession(), headless: true });
    await browser.open('data:text/html,<input id="email" placeholder="Email">');
    const tree = await browser.snapshot({ interactive: true });
    const match = tree.match(/ref=(e\d+)/);
    expect(match?.[1]).toBeDefined();
    await browser.fill(match![1]!, "test@example.com");
  });

  it("click", async () => {
    browser = new Browser({ sessionName: uniqueSession(), headless: true });
    await browser.open('data:text/html,<button id="btn">Click me</button>');
    const tree = await browser.snapshot({ interactive: true });
    const match = tree.match(/ref=(e\d+)/);
    expect(match?.[1]).toBeDefined();
    await browser.click(match![1]!);
  });

  it("creates Browser with session name", () => {
    browser = new Browser("test-session");
    expect(browser).toBeDefined();
  });

  it("BrowserError has correct properties", () => {
    const error = new BrowserError("test message", "test command", "test stderr");
    expect(error.message).toBe("test message");
    expect(error.command).toBe("test command");
    expect(error.stderr).toBe("test stderr");
    expect(error.name).toBe("BrowserError");
  });
});
