import type { SnapshotNode } from "./parser.js";

export interface DisplayLine {
  text: string;
  interactive: boolean;
  number?: number;
}

export interface RenderResult {
  lines: DisplayLine[];
  numberToRef: Record<number, string>;
}

const INTERACTIVE_TYPES = new Set([
  "link",
  "button",
  "textbox",
  "checkbox",
  "radio",
  "combobox",
  "listbox",
  "menuitem",
  "menuitemcheckbox",
  "menuitemradio",
  "option",
  "searchbox",
  "slider",
  "spinbutton",
  "switch",
  "tab",
  "treeitem",
]);

function isInteractive(node: SnapshotNode): boolean {
  return INTERACTIVE_TYPES.has(node.type) && node.ref !== undefined;
}

function formatHeading(node: SnapshotNode): string {
  const level = node.level ?? 1;
  const prefix = "#".repeat(Math.min(level, 6));
  return `${prefix} ${node.name ?? ""}`;
}

function formatCheckbox(node: SnapshotNode, number: number): string {
  const checked = node.checked === true ? "x" : node.checked === "mixed" ? "-" : " ";
  const label = node.name ?? "";
  const disabled = node.disabled ? " (disabled)" : "";
  return `[${number}] [${checked}] ${label}${disabled}`;
}

function formatRadio(node: SnapshotNode, number: number): string {
  const checked = node.checked === true ? "●" : "○";
  const label = node.name ?? "";
  const disabled = node.disabled ? " (disabled)" : "";
  return `[${number}] ${checked} ${label}${disabled}`;
}

function formatTextbox(node: SnapshotNode, number: number): string {
  const label = node.name ?? "";
  const value = node.value ?? "";
  const placeholder = value ? `[${value}]` : "[____]";
  const disabled = node.disabled ? " (disabled)" : "";
  const required = node.required ? " *" : "";
  return `[${number}] ${label}${required}: ${placeholder}${disabled}`;
}

function formatCombobox(node: SnapshotNode, number: number): string {
  const label = node.name ?? "";
  const value = node.value ?? "";
  const expanded = node.expanded ? "▼" : "▶";
  const disabled = node.disabled ? " (disabled)" : "";
  return `[${number}] ${label} ${expanded} ${value}${disabled}`;
}

function formatLink(node: SnapshotNode, number: number): string {
  const text = node.name ?? "";
  return `[${number}] ${text}`;
}

function formatButton(node: SnapshotNode, number: number): string {
  const text = node.name ?? "";
  const disabled = node.disabled ? " (disabled)" : "";
  return `[${number}] ${text}${disabled}`;
}

function formatOption(node: SnapshotNode, number: number): string {
  const selected = node.selected ? "●" : "○";
  const text = node.name ?? "";
  return `  [${number}] ${selected} ${text}`;
}

function formatInteractive(node: SnapshotNode, number: number): string {
  switch (node.type) {
    case "checkbox":
      return formatCheckbox(node, number);
    case "radio":
      return formatRadio(node, number);
    case "textbox":
    case "searchbox":
      return formatTextbox(node, number);
    case "combobox":
    case "listbox":
      return formatCombobox(node, number);
    case "link":
      return formatLink(node, number);
    case "button":
    case "menuitem":
    case "menuitemcheckbox":
    case "menuitemradio":
    case "tab":
    case "switch":
    case "treeitem":
      return formatButton(node, number);
    case "option":
      return formatOption(node, number);
    case "slider":
    case "spinbutton":
      return formatTextbox(node, number);
    default:
      return `[${number}] ${node.name ?? node.type}`;
  }
}

interface RenderContext {
  lines: DisplayLine[];
  numberToRef: Record<number, string>;
  nextNumber: number;
}

// Collect inline content from a node and its children into segments
interface Segment {
  text: string;
  interactive: boolean;
  number?: number;
  ref?: string;
}

function collectInlineSegments(node: SnapshotNode, ctx: RenderContext): Segment[] {
  const segments: Segment[] = [];

  // Handle static text
  if (node.type === "StaticText") {
    const text = node.name ?? "";
    if (text) {
      segments.push({ text, interactive: false });
    }
    return segments;
  }

  // Handle interactive elements with ref
  if (isInteractive(node)) {
    const number = ctx.nextNumber++;
    const ref = node.ref!;
    ctx.numberToRef[number] = ref;
    const segment: Segment = {
      text: formatInteractive(node, number),
      interactive: true,
      number,
      ref,
    };
    segments.push(segment);
    // Options in combobox are handled separately (not inline)
    return segments;
  }

  // Handle interactive elements without ref - display as plain text
  if (INTERACTIVE_TYPES.has(node.type)) {
    const text = node.name ?? "";
    if (text) {
      segments.push({ text, interactive: false });
    }
    return segments;
  }

  // For other elements, collect from children
  for (const child of node.children) {
    segments.push(...collectInlineSegments(child, ctx));
  }

  return segments;
}

// Render a row as a single line with elements separated by spaces
function renderRow(node: SnapshotNode, ctx: RenderContext, prefix: string = ""): void {
  const segments: Segment[] = [];

  for (const cell of node.children) {
    const cellSegments = collectInlineSegments(cell, ctx);
    segments.push(...cellSegments);
  }

  if (segments.length === 0) return;

  // Join segments with appropriate spacing
  const parts: string[] = [];
  let hasInteractive = false;
  let firstInteractiveNumber: number | undefined;

  for (const seg of segments) {
    if (seg.interactive) {
      hasInteractive = true;
      if (firstInteractiveNumber === undefined) {
        firstInteractiveNumber = seg.number;
      }
    }
    parts.push(seg.text);
  }

  const text = prefix + parts.join("  ");
  const line: DisplayLine = { text, interactive: hasInteractive };
  if (firstInteractiveNumber !== undefined) {
    line.number = firstInteractiveNumber;
  }
  ctx.lines.push(line);
}

// Render a table structure
function renderTable(node: SnapshotNode, ctx: RenderContext): void {
  for (const child of node.children) {
    if (child.type === "row") {
      renderRow(child, ctx);
    } else if (child.type === "rowgroup") {
      // Handle rowgroup (thead, tbody, tfoot)
      for (const row of child.children) {
        if (row.type === "row") {
          renderRow(row, ctx);
        }
      }
    } else {
      renderNode(child, ctx);
    }
  }
}

// Render a list structure
function renderList(node: SnapshotNode, ctx: RenderContext, ordered: boolean = false): void {
  let itemNumber = 1;
  for (const child of node.children) {
    if (child.type === "listitem") {
      const prefix = ordered ? `${itemNumber}. ` : "";
      const segments = collectInlineSegments(child, ctx);

      if (segments.length > 0) {
        const parts: string[] = [];
        let hasInteractive = false;
        let firstInteractiveNumber: number | undefined;

        for (const seg of segments) {
          if (seg.interactive) {
            hasInteractive = true;
            if (firstInteractiveNumber === undefined) {
              firstInteractiveNumber = seg.number;
            }
          }
          parts.push(seg.text);
        }

        const text = prefix + parts.join("  ");
        const line: DisplayLine = { text, interactive: hasInteractive };
        if (firstInteractiveNumber !== undefined) {
          line.number = firstInteractiveNumber;
        }
        ctx.lines.push(line);
      }
      itemNumber++;
    } else {
      renderNode(child, ctx);
    }
  }
}

function renderNode(node: SnapshotNode, ctx: RenderContext): void {
  // Handle headings
  if (node.type === "heading") {
    ctx.lines.push({ text: formatHeading(node), interactive: false });
    ctx.lines.push({ text: "", interactive: false });
    return;
  }

  // Handle tables
  if (node.type === "table") {
    renderTable(node, ctx);
    return;
  }

  // Handle lists
  if (node.type === "list") {
    renderList(node, ctx, false);
    return;
  }

  // Handle rows outside of tables
  if (node.type === "row") {
    renderRow(node, ctx);
    return;
  }

  // Handle static text
  if (node.type === "StaticText") {
    const text = node.name ?? "";
    if (text) {
      ctx.lines.push({ text, interactive: false });
    }
    return;
  }

  // Handle paragraph - collect inline content
  if (node.type === "paragraph") {
    const segments = collectInlineSegments(node, ctx);
    if (segments.length > 0) {
      const parts: string[] = [];
      let hasInteractive = false;
      let firstInteractiveNumber: number | undefined;

      for (const seg of segments) {
        if (seg.interactive) {
          hasInteractive = true;
          if (firstInteractiveNumber === undefined) {
            firstInteractiveNumber = seg.number;
          }
        }
        parts.push(seg.text);
      }

      const text = parts.join("");
      const line: DisplayLine = { text, interactive: hasInteractive };
      if (firstInteractiveNumber !== undefined) {
        line.number = firstInteractiveNumber;
      }
      ctx.lines.push(line);
    }
    return;
  }

  // Handle interactive elements with ref
  if (isInteractive(node)) {
    const number = ctx.nextNumber++;
    ctx.numberToRef[number] = node.ref!;
    ctx.lines.push({
      text: formatInteractive(node, number),
      interactive: true,
      number,
    });
    // Render children (e.g., options in combobox)
    for (const child of node.children) {
      renderNode(child, ctx);
    }
    return;
  }

  // Handle interactive elements without ref - display as plain text
  if (INTERACTIVE_TYPES.has(node.type)) {
    const text = node.name ?? "";
    if (text) {
      ctx.lines.push({ text, interactive: false });
    }
    for (const child of node.children) {
      renderNode(child, ctx);
    }
    return;
  }

  // Handle structural elements - just render children
  for (const child of node.children) {
    renderNode(child, ctx);
  }
}

export function render(nodes: SnapshotNode[]): RenderResult {
  const ctx: RenderContext = {
    lines: [],
    numberToRef: {},
    nextNumber: 1,
  };

  for (const node of nodes) {
    renderNode(node, ctx);
  }

  // Clean up consecutive empty lines
  const cleaned: DisplayLine[] = [];
  for (const line of ctx.lines) {
    if (line.text === "" && cleaned.length > 0 && cleaned[cleaned.length - 1]?.text === "") {
      continue;
    }
    cleaned.push(line);
  }

  // Remove trailing empty line
  if (cleaned.length > 0 && cleaned[cleaned.length - 1]?.text === "") {
    cleaned.pop();
  }

  return {
    lines: cleaned,
    numberToRef: ctx.numberToRef,
  };
}
