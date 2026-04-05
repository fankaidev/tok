import { describe, it, expect } from "vitest";
import { parseSnapshot } from "./parser.js";

describe("parseSnapshot", () => {
  it("parses simple heading", () => {
    const raw = '- heading "Example Domain" [level=1, ref=e1]';
    const result = parseSnapshot(raw);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      type: "heading",
      name: "Example Domain",
      level: 1,
      ref: "e1",
    });
  });

  it("parses nested structure", () => {
    const raw = `- paragraph
  - StaticText "Hello world"
  - link "Learn more" [ref=e1]`;
    const result = parseSnapshot(raw);

    expect(result).toHaveLength(1);
    expect(result[0]?.type).toBe("paragraph");
    expect(result[0]?.children).toHaveLength(2);
    expect(result[0]?.children[0]).toMatchObject({
      type: "StaticText",
      name: "Hello world",
    });
    expect(result[0]?.children[1]).toMatchObject({
      type: "link",
      name: "Learn more",
      ref: "e1",
    });
  });

  it("parses checkbox with checked attribute", () => {
    const raw = "- checkbox [checked=true, ref=e1]";
    const result = parseSnapshot(raw);

    expect(result[0]).toMatchObject({
      type: "checkbox",
      checked: true,
      ref: "e1",
    });
  });

  it("parses checkbox with mixed state", () => {
    const raw = "- checkbox [checked=mixed, ref=e1]";
    const result = parseSnapshot(raw);

    expect(result[0]?.checked).toBe("mixed");
  });

  it("parses combobox with value", () => {
    const raw = "- combobox [expanded=false, ref=e1]: Option B";
    const result = parseSnapshot(raw);

    expect(result[0]).toMatchObject({
      type: "combobox",
      expanded: false,
      ref: "e1",
      value: "Option B",
    });
  });

  it("parses option with selected", () => {
    const raw = '- option "B" [selected, ref=e1]';
    const result = parseSnapshot(raw);

    expect(result[0]).toMatchObject({
      type: "option",
      name: "B",
      selected: true,
      ref: "e1",
    });
  });

  it("parses button with disabled", () => {
    const raw = '- button "Submit" [disabled, ref=e1]';
    const result = parseSnapshot(raw);

    expect(result[0]).toMatchObject({
      type: "button",
      name: "Submit",
      disabled: true,
      ref: "e1",
    });
  });

  it("parses multiple roots", () => {
    const raw = `- heading "Title" [level=1, ref=e1]
- paragraph
  - StaticText "Content"
- link "More" [ref=e2]`;
    const result = parseSnapshot(raw);

    expect(result).toHaveLength(3);
    expect(result[0]?.type).toBe("heading");
    expect(result[1]?.type).toBe("paragraph");
    expect(result[2]?.type).toBe("link");
  });

  it("handles deeply nested structure", () => {
    const raw = `- navigation
  - list
    - listitem
      - link "Home" [ref=e1]
    - listitem
      - link "About" [ref=e2]`;
    const result = parseSnapshot(raw);

    expect(result).toHaveLength(1);
    expect(result[0]?.type).toBe("navigation");
    expect(result[0]?.children[0]?.type).toBe("list");
    expect(result[0]?.children[0]?.children).toHaveLength(2);
    expect(result[0]?.children[0]?.children[0]?.children[0]).toMatchObject({
      type: "link",
      name: "Home",
      ref: "e1",
    });
  });

  it("handles empty input", () => {
    const result = parseSnapshot("");
    expect(result).toHaveLength(0);
  });

  it("parses real agent-browser output", () => {
    const raw = `- heading "Example Domain" [level=1, ref=e1]
- paragraph
  - StaticText "This domain is for use in documentation examples."
- paragraph
  - link "Learn more" [ref=e2]`;
    const result = parseSnapshot(raw);

    expect(result).toHaveLength(3);
    expect(result[0]).toMatchObject({
      type: "heading",
      name: "Example Domain",
      level: 1,
      ref: "e1",
    });
    expect(result[2]?.children[0]).toMatchObject({
      type: "link",
      name: "Learn more",
      ref: "e2",
    });
  });

  it("parses form elements", () => {
    const raw = `- textbox "Name" [ref=e1]
- checkbox [checked=true, ref=e2]
- combobox [expanded=false, ref=e3]: B
  - option "A" [ref=e5]
  - option "B" [selected, ref=e6]
- button "Submit" [disabled, ref=e4]`;
    const result = parseSnapshot(raw);

    expect(result).toHaveLength(4);
    expect(result[0]).toMatchObject({ type: "textbox", name: "Name", ref: "e1" });
    expect(result[1]).toMatchObject({ type: "checkbox", checked: true, ref: "e2" });
    expect(result[2]).toMatchObject({
      type: "combobox",
      expanded: false,
      ref: "e3",
      value: "B",
    });
    expect(result[2]?.children).toHaveLength(2);
    expect(result[2]?.children[1]).toMatchObject({
      type: "option",
      name: "B",
      selected: true,
      ref: "e6",
    });
    expect(result[3]).toMatchObject({
      type: "button",
      name: "Submit",
      disabled: true,
      ref: "e4",
    });
  });
});
