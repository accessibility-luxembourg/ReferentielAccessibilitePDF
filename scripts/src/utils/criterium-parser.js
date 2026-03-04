import { headingToMarkdownString, nodeToMarkdownString } from "./markdown-renderer.js";

export function isTopic(node) {
  return node.type === "heading" && node.depth === 3 && node.children[0]?.type === "link";
}

export function parseTopic(node) {
  const raw = headingToMarkdownString(node);

  // Number from "[Thématique N](...)" or "[Topic N](...)"
  const numberMatch = raw.match(/^\[(?:Thématique|Topic) (\d+)\]/);
  const number = numberMatch ? numberMatch[1] : null;

  // Title: everything after ": ", strip trailing {id="..."}
  const titleMatch = raw.match(/:\s*(.+?)(?:\s*\{id="[^"]+"\})?$/);
  const topic = titleMatch ? titleMatch[1].trim() : null;

  return { topic, number };
}

export function isCriterium(node) {
  return node.type === "heading" && node.depth === 4 && node.children[0]?.type === "link";
}

export function parseCriterium(node) {
  const raw = headingToMarkdownString(node);

  // Number from "[Critère N.N](...)" or "[Criterion N.N](...)" — keep only the part after the dot
  const numberMatch = raw.match(/^\[(?:Critère|Criterion) \d+\.(\d+)\]/);
  const number = numberMatch ? numberMatch[1] : null;

  // Level from "[A]" or "[AA]" after the criterion link
  const levelMatch = raw.match(/^\[(?:Critère|Criterion) [\d.]+\]\([^)]+\)\s+\[([^\]]+)\]/);
  const level = levelMatch ? levelMatch[1] : null;

  // Remove leading "[Critère N.N](...) [X] " and trailing " {id="..."}"
  let title = raw
    .replace(/^\[(?:Critère|Criterion) [\d.]+\]\([^)]+\)\s+\[[^\]]+\]\s*/, "")
    .replace(/\s*\{id="[^"]+"\}$/, "")
    .trim();

  return { number, level, title };
}

function isTestListItem(listItem) {
  const firstPara = listItem.children[0];
  if (!firstPara || firstPara.type !== "paragraph") return false;
  const firstStrong = firstPara.children[0];
  if (!firstStrong || firstStrong.type !== "strong") return false;
  const firstLink = firstStrong.children[0];
  if (!firstLink || firstLink.type !== "link") return false;
  const linkText = firstLink.children.map((n) => (n.type === "text" ? n.value : "")).join("");
  return /^Test \d+\.\d+\.\d+$/.test(linkText);
}

export function isTestList(node) {
  return node.type === "list" && node.children.length > 0 && isTestListItem(node.children[0]);
}

export function parseTestList(node) {
  const tests = {};

  for (const listItem of node.children) {
    if (!isTestListItem(listItem)) continue;

    const firstPara = listItem.children[0];
    const firstLink = firstPara.children[0].children[0];

    // Extract test number: last digit of "Test N.N.N"
    const linkText = firstLink.children.map((n) => (n.type === "text" ? n.value : "")).join("");
    const numberMatch = linkText.match(/^Test \d+\.\d+\.(\d+)$/);
    if (!numberMatch) continue;
    const number = numberMatch[1];

    // Title: paragraph content after the strong node, strip trailing {id="..."}
    const title = firstPara.children
      .slice(1)
      .map(nodeToMarkdownString)
      .join("")
      .replace(/\s*\{id="[^"]+"\}$/, "")
      .trim();

    // Conditions: items from the nested list, if any
    const conditions = [];
    const nestedList = listItem.children.find((child) => child.type === "list");
    if (nestedList) {
      for (const condItem of nestedList.children) {
        const condPara = condItem.children[0];
        if (!condPara || condPara.type !== "paragraph") continue;
        conditions.push(condPara.children.map(nodeToMarkdownString).join("").trim());
      }
    }

    tests[number] = [title, ...conditions];
  }

  return tests;
}