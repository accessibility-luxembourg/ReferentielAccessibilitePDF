/**
 * Translate a markdown AST node back to markdown text, preserving links.
 */
export function nodeToMarkdownString(node) {
  if (node.type === "text") return node.value;
  if (node.type === "link") {
    const text = node.children.map(nodeToMarkdownString).join("");
    return `[${text}](${node.url})`;
  }

  // Recursively process children for other node types (e.g. emphasis, strong, etc.)
  return node.children ? node.children.map(nodeToMarkdownString).join("") : "";
}

/**
 * Convert a heading node to a markdown string (preserving links).
 */
export function headingToMarkdownString(node) {
  return node.children.map(nodeToMarkdownString).join("");
}