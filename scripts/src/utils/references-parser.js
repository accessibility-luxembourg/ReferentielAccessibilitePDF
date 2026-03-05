import { headingToMarkdownString } from "./markdown-renderer.js";

// Detects the "Correspondances" (fr) or "Mapping" (en) h5 heading
// Both use {class="disclosure mapping"} as a reliable identifier
export function isCorrespondancesHeading(node) {
  if (node.type !== "heading" || node.depth !== 5) return false;
  return headingToMarkdownString(node).includes('class="disclosure mapping"');
}

// Extracts link texts from a list item's paragraph
function getLinksFromItem(listItem) {
  const firstPara = listItem.children[0];
  if (!firstPara || firstPara.type !== "paragraph") return [];
  return firstPara.children
    .filter((n) => n.type === "link")
    .map((n) => n.children.filter((c) => c.type === "text").map((c) => c.value).join(""));
}

// Returns true if a list item is the WCAG success criteria item
function isWcagItem(listItem) {
  const firstPara = listItem.children[0];
  if (!firstPara || firstPara.type !== "paragraph") return false;
  const text = firstPara.children
    .filter((n) => n.type === "text")
    .map((n) => n.value)
    .join("");
  return text.includes("WCAG");
}

// Collects all links from all items of the nested techniques list
// Handles both FR (multiple links in one item) and EN (one link per item)
function getTechniquesFromWcagItem(listItem) {
  const nestedList = listItem.children.find((child) => child.type === "list");
  if (!nestedList) return [];

  return nestedList.children.flatMap((item) => getLinksFromItem(item));
}

// Returns true if a list item is the EN 301 549 norm item
function isNormItem(listItem) {
  const firstPara = listItem.children[0];
  if (!firstPara || firstPara.type !== "paragraph") return false;
  return firstPara.children
    .filter((n) => n.type === "text")
    .map((n) => n.value)
    .join("")
    .includes("EN 301 549");
}

// FR: values are in emphasis nodes (*...*{lang=en})
// EN: value is plain text after the colon
function getNormFromItem(listItem) {
  const firstPara = listItem.children[0];
  if (!firstPara || firstPara.type !== "paragraph") return [];

  const emphasisValues = firstPara.children
    .filter((n) => n.type === "emphasis")
    .map((n) => n.children.filter((c) => c.type === "text").map((c) => c.value).join("").trim());

  if (emphasisValues.length > 0) return emphasisValues;

  // EN fallback: extract plain text after the colon, strip trailing period
  const fullText = firstPara.children
    .filter((n) => n.type === "text")
    .map((n) => n.value)
    .join("");
  const afterColon = fullText.replace(/^.*?:\s*/, "").replace(/\.$/, "").trim();
  return afterColon ? [afterColon] : [];
}

// Returns true if a list item is the PDF/UA-2 item
function isPdfuaItem(listItem) {
  const firstPara = listItem.children[0];
  if (!firstPara || firstPara.type !== "paragraph") return false;
  return firstPara.children
    .filter((n) => n.type === "text")
    .map((n) => n.value)
    .join("")
    .includes("PDF/UA");
}

// FR: values are in emphasis nodes (*...*{lang=en})
// EN: comma-separated plain text after the colon
function getPdfuaFromItem(listItem) {
  const firstPara = listItem.children[0];
  if (!firstPara || firstPara.type !== "paragraph") return [];

  const emphasisValues = firstPara.children
    .filter((n) => n.type === "emphasis")
    .map((n) => n.children.filter((c) => c.type === "text").map((c) => c.value).join("").trim());

  if (emphasisValues.length > 0) return emphasisValues;

  // EN fallback: split by comma, strip trailing period
  const fullText = firstPara.children
    .filter((n) => n.type === "text")
    .map((n) => n.value)
    .join("");
  const afterColon = fullText.replace(/^.*?:\s*/, "").trim();
  return afterColon
    .split(",")
    .map((v) => v.trim().replace(/\.$/, ""))
    .filter(Boolean);
}

export function parseReferences(listNode) {
  const references = {};

  for (const listItem of listNode.children) {
    if (isWcagItem(listItem)) {
      references.wcag = getLinksFromItem(listItem);
      references.techniques = getTechniquesFromWcagItem(listItem);
    } else if (isNormItem(listItem)) {
      references.norm = getNormFromItem(listItem);
    } else if (isPdfuaItem(listItem)) {
      references.pdfua = getPdfuaFromItem(listItem);
    }
  }

  return references;
}
