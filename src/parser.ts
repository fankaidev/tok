export interface SnapshotNode {
  type: string;
  name?: string;
  ref?: string;
  level?: number;
  checked?: boolean | "mixed";
  expanded?: boolean;
  selected?: boolean;
  disabled?: boolean;
  required?: boolean;
  value?: string;
  children: SnapshotNode[];
}

interface ParsedLine {
  indent: number;
  node: SnapshotNode;
}

function parseLine(line: string): ParsedLine | null {
  // Count indent (2 spaces = 1 level)
  const trimmed = line.trimStart();
  if (!trimmed.startsWith("- ")) return null;

  const indent = (line.length - trimmed.length) / 2;
  const content = trimmed.slice(2); // Remove "- "

  // Parse: {type} ["name"] [{attrs}] [: value]
  const node: SnapshotNode = { type: "", children: [] };

  // Extract type (first word)
  const typeMatch = content.match(/^(\w+)/);
  if (!typeMatch?.[1]) return null;
  node.type = typeMatch[1];

  let rest = content.slice(typeMatch[0].length).trim();

  // Extract quoted name
  if (rest.startsWith('"')) {
    const nameMatch = rest.match(/^"((?:[^"\\]|\\.)*)"/);
    if (nameMatch?.[1] !== undefined) {
      node.name = nameMatch[1].replace(/\\"/g, '"').replace(/\\n/g, "\n");
      rest = rest.slice(nameMatch[0].length).trim();
    }
  }

  // Extract value after ": " (before parsing attrs, as value comes at the end)
  const valueMatch = rest.match(/:\s*(.+)$/);
  if (valueMatch?.[1]) {
    node.value = valueMatch[1].trim();
    rest = rest.slice(0, rest.length - valueMatch[0].length).trim();
  }

  // Extract attributes [key=value, key2, ...]
  const attrMatch = rest.match(/\[([^\]]+)\]/);
  if (attrMatch?.[1]) {
    const attrs = attrMatch[1].split(",").map((a) => a.trim());
    for (const attr of attrs) {
      if (attr.startsWith("ref=")) {
        node.ref = attr.slice(4);
      } else if (attr.startsWith("level=")) {
        node.level = parseInt(attr.slice(6), 10);
      } else if (attr.startsWith("checked=")) {
        const val = attr.slice(8);
        node.checked = val === "mixed" ? "mixed" : val === "true";
      } else if (attr.startsWith("expanded=")) {
        node.expanded = attr.slice(9) === "true";
      } else if (attr === "selected") {
        node.selected = true;
      } else if (attr === "disabled") {
        node.disabled = true;
      } else if (attr === "required") {
        node.required = true;
      }
    }
  }

  return { indent, node };
}

export function parseSnapshot(raw: string): SnapshotNode[] {
  const lines = raw.split("\n").filter((line) => line.trim());
  const roots: SnapshotNode[] = [];
  const stack: { indent: number; node: SnapshotNode }[] = [];

  for (const line of lines) {
    const parsed = parseLine(line);
    if (!parsed) continue;

    const { indent, node } = parsed;

    // Pop stack until we find the parent
    while (stack.length > 0 && stack[stack.length - 1]!.indent >= indent) {
      stack.pop();
    }

    if (stack.length === 0) {
      roots.push(node);
    } else {
      stack[stack.length - 1]!.node.children.push(node);
    }

    stack.push({ indent, node });
  }

  return roots;
}
