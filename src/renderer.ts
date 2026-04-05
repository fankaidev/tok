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

function renderNode(node: SnapshotNode, ctx: RenderContext): void {
  // Handle headings
  if (node.type === "heading") {
    ctx.lines.push({ text: formatHeading(node), interactive: false });
    ctx.lines.push({ text: "", interactive: false });
    return;
  }

  // Handle static text
  if (node.type === "StaticText" || node.type === "paragraph") {
    const text = node.name ?? "";
    if (text) {
      ctx.lines.push({ text, interactive: false });
    }
    // Render children for paragraph
    for (const child of node.children) {
      renderNode(child, ctx);
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
