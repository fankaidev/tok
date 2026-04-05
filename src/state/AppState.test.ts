import { describe, expect, it } from "vitest";
import { getHighestPriorityMessage, type StatusMessage } from "./AppState.js";

describe("getHighestPriorityMessage", () => {
  it("returns null for empty array", () => {
    expect(getHighestPriorityMessage([])).toBeNull();
  });

  it("returns the only message", () => {
    const messages: StatusMessage[] = [{ text: "hello", priority: "info" }];
    expect(getHighestPriorityMessage(messages)?.text).toBe("hello");
  });

  it("returns highest priority message (error > loading)", () => {
    const messages: StatusMessage[] = [
      { text: "loading", priority: "loading" },
      { text: "error", priority: "error" },
    ];
    expect(getHighestPriorityMessage(messages)?.text).toBe("error");
  });

  it("returns highest priority message (loading > hint)", () => {
    const messages: StatusMessage[] = [
      { text: "hint", priority: "hint" },
      { text: "loading", priority: "loading" },
    ];
    expect(getHighestPriorityMessage(messages)?.text).toBe("loading");
  });

  it("filters out expired messages", () => {
    const messages: StatusMessage[] = [
      { text: "expired", priority: "error", expiresAt: Date.now() - 1000 },
      { text: "active", priority: "info" },
    ];
    expect(getHighestPriorityMessage(messages)?.text).toBe("active");
  });

  it("returns null if all messages expired", () => {
    const messages: StatusMessage[] = [
      { text: "expired1", priority: "error", expiresAt: Date.now() - 1000 },
      { text: "expired2", priority: "loading", expiresAt: Date.now() - 500 },
    ];
    expect(getHighestPriorityMessage(messages)).toBeNull();
  });
});
