import { describe, it, expect } from "vitest";
import { render } from "./renderer.js";
import type { SnapshotNode } from "./parser.js";

describe("render", () => {
  it("renders heading with markdown style", () => {
    const nodes: SnapshotNode[] = [
      { type: "heading", name: "Welcome", level: 1, ref: "e1", children: [] },
    ];
    const result = render(nodes);

    expect(result.lines[0]).toMatchObject({
      text: "# Welcome",
      interactive: false,
    });
  });

  it("renders heading levels correctly", () => {
    const nodes: SnapshotNode[] = [{ type: "heading", name: "Title", level: 2, children: [] }];
    const result = render(nodes);

    expect(result.lines[0]?.text).toBe("## Title");
  });

  it("renders static text", () => {
    const nodes: SnapshotNode[] = [
      { type: "StaticText", name: "Some paragraph text.", children: [] },
    ];
    const result = render(nodes);

    expect(result.lines[0]).toMatchObject({
      text: "Some paragraph text.",
      interactive: false,
    });
  });

  it("renders link with number", () => {
    const nodes: SnapshotNode[] = [{ type: "link", name: "Learn more", ref: "e2", children: [] }];
    const result = render(nodes);

    expect(result.lines[0]).toMatchObject({
      text: "[1] Learn more",
      interactive: true,
      number: 1,
    });
    expect(result.numberToRef[1]).toBe("e2");
  });

  it("renders button with number", () => {
    const nodes: SnapshotNode[] = [{ type: "button", name: "Sign In", ref: "e3", children: [] }];
    const result = render(nodes);

    expect(result.lines[0]).toMatchObject({
      text: "[1] Sign In",
      interactive: true,
      number: 1,
    });
    expect(result.numberToRef[1]).toBe("e3");
  });

  it("renders disabled button", () => {
    const nodes: SnapshotNode[] = [
      { type: "button", name: "Submit", ref: "e1", disabled: true, children: [] },
    ];
    const result = render(nodes);

    expect(result.lines[0]?.text).toBe("[1] Submit (disabled)");
  });

  it("renders checkbox unchecked", () => {
    const nodes: SnapshotNode[] = [
      { type: "checkbox", name: "Remember me", ref: "e1", checked: false, children: [] },
    ];
    const result = render(nodes);

    expect(result.lines[0]?.text).toBe("[1] [ ] Remember me");
  });

  it("renders checkbox checked", () => {
    const nodes: SnapshotNode[] = [
      { type: "checkbox", name: "I agree", ref: "e1", checked: true, children: [] },
    ];
    const result = render(nodes);

    expect(result.lines[0]?.text).toBe("[1] [x] I agree");
  });

  it("renders checkbox mixed state", () => {
    const nodes: SnapshotNode[] = [
      { type: "checkbox", name: "Select all", ref: "e1", checked: "mixed", children: [] },
    ];
    const result = render(nodes);

    expect(result.lines[0]?.text).toBe("[1] [-] Select all");
  });

  it("renders radio button", () => {
    const nodes: SnapshotNode[] = [
      { type: "radio", name: "Option A", ref: "e1", checked: true, children: [] },
      { type: "radio", name: "Option B", ref: "e2", checked: false, children: [] },
    ];
    const result = render(nodes);

    expect(result.lines[0]?.text).toBe("[1] ● Option A");
    expect(result.lines[1]?.text).toBe("[2] ○ Option B");
  });

  it("renders textbox with label", () => {
    const nodes: SnapshotNode[] = [{ type: "textbox", name: "Email", ref: "e1", children: [] }];
    const result = render(nodes);

    expect(result.lines[0]?.text).toBe("[1] Email: [____]");
  });

  it("renders textbox with value", () => {
    const nodes: SnapshotNode[] = [
      { type: "textbox", name: "Email", ref: "e1", value: "test@example.com", children: [] },
    ];
    const result = render(nodes);

    expect(result.lines[0]?.text).toBe("[1] Email: [test@example.com]");
  });

  it("renders required textbox", () => {
    const nodes: SnapshotNode[] = [
      { type: "textbox", name: "Email", ref: "e1", required: true, children: [] },
    ];
    const result = render(nodes);

    expect(result.lines[0]?.text).toBe("[1] Email *: [____]");
  });

  it("renders combobox with value", () => {
    const nodes: SnapshotNode[] = [
      {
        type: "combobox",
        name: "Country",
        ref: "e1",
        value: "United States",
        expanded: false,
        children: [],
      },
    ];
    const result = render(nodes);

    expect(result.lines[0]?.text).toBe("[1] Country ▶ United States");
  });

  it("renders expanded combobox", () => {
    const nodes: SnapshotNode[] = [
      {
        type: "combobox",
        name: "Country",
        ref: "e1",
        value: "US",
        expanded: true,
        children: [
          { type: "option", name: "US", ref: "e2", selected: true, children: [] },
          { type: "option", name: "UK", ref: "e3", children: [] },
        ],
      },
    ];
    const result = render(nodes);

    expect(result.lines[0]?.text).toBe("[1] Country ▼ US");
    expect(result.lines[1]?.text).toBe("  [2] ● US");
    expect(result.lines[2]?.text).toBe("  [3] ○ UK");
  });

  it("assigns sequential numbers to interactive elements", () => {
    const nodes: SnapshotNode[] = [
      { type: "heading", name: "Title", level: 1, ref: "e1", children: [] },
      { type: "StaticText", name: "Some text", children: [] },
      { type: "link", name: "Link 1", ref: "e2", children: [] },
      { type: "button", name: "Button 1", ref: "e3", children: [] },
      { type: "textbox", name: "Input", ref: "e4", children: [] },
    ];
    const result = render(nodes);

    expect(result.numberToRef).toEqual({
      1: "e2",
      2: "e3",
      3: "e4",
    });
  });

  it("handles nested paragraph with link", () => {
    const nodes: SnapshotNode[] = [
      {
        type: "paragraph",
        children: [
          { type: "StaticText", name: "Click ", children: [] },
          { type: "link", name: "here", ref: "e1", children: [] },
          { type: "StaticText", name: " to continue.", children: [] },
        ],
      },
    ];
    const result = render(nodes);

    expect(result.lines).toContainEqual({ text: "Click ", interactive: false });
    expect(result.lines).toContainEqual({ text: "[1] here", interactive: true, number: 1 });
    expect(result.lines).toContainEqual({ text: " to continue.", interactive: false });
  });

  it("removes consecutive empty lines", () => {
    const nodes: SnapshotNode[] = [
      { type: "heading", name: "Title 1", level: 1, children: [] },
      { type: "heading", name: "Title 2", level: 2, children: [] },
    ];
    const result = render(nodes);

    // Should have: "# Title 1", "", "## Title 2" (not two empty lines)
    const emptyLines = result.lines.filter((l) => l.text === "");
    expect(emptyLines.length).toBeLessThanOrEqual(1);
  });

  it("handles empty input", () => {
    const result = render([]);
    expect(result.lines).toHaveLength(0);
    expect(result.numberToRef).toEqual({});
  });

  it("renders full example from issue", () => {
    const nodes: SnapshotNode[] = [
      { type: "heading", name: "Welcome", level: 1, ref: "e1", children: [] },
      { type: "StaticText", name: "Some paragraph text here.", children: [] },
      { type: "link", name: "Learn more", ref: "e2", children: [] },
      { type: "button", name: "Sign In", ref: "e3", children: [] },
    ];
    const result = render(nodes);

    expect(result.lines[0]?.text).toBe("# Welcome");
    expect(result.lines).toContainEqual({ text: "Some paragraph text here.", interactive: false });
    expect(result.lines).toContainEqual({ text: "[1] Learn more", interactive: true, number: 1 });
    expect(result.lines).toContainEqual({ text: "[2] Sign In", interactive: true, number: 2 });
    expect(result.numberToRef).toEqual({ 1: "e2", 2: "e3" });
  });
});
