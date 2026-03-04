import { program } from "commander";
import { parseFile } from "./utils/markdown-parser.js";
import { isTopic, isCriterium, parseCriterium, parseTopic, isTestList, parseTestList } from "./utils/criterium-parser.js";
import { getInputPath, getOutputPath, writeJsonFile } from "./utils/filesystem.js";
import { isCorrespondancesHeading, parseReferences } from "./utils/references-parser.js";

program
  .requiredOption("-l, --language <lang>", "Language to process (fr or en)", (value) => {
    if (!["fr", "en"].includes(value)) {
      console.error(`Error: language must be "fr" or "en", got "${value}"`);
      process.exit(1);
    }
    return value;
  })
  .parse();

const { language } = program.opts();

const inputPath = getInputPath("referentiel-technique.md", language);
const outputPath = getOutputPath("criteres.json", language);

const markdownTree = parseFile(inputPath);

const topics = [];
let currentTopic = null;
let currentCriterium = null;
let inCorrespondances = false;

for (const node of markdownTree.children) {
  if (isTopic(node)) {
    const { topic, number } = parseTopic(node);
    currentTopic = { topic, number, criteria: [] };
    currentCriterium = null;
    inCorrespondances = false;
    topics.push(currentTopic);
  } else if (isCriterium(node) && currentTopic) {
    const { number, level, title } = parseCriterium(node);
    currentCriterium = { number, level, title, tests: {}, references: {} };
    inCorrespondances = false;
    currentTopic.criteria.push({ criterium: currentCriterium });
  } else if (isTestList(node) && currentCriterium) {
    currentCriterium.tests = parseTestList(node);
  } else if (isCorrespondancesHeading(node)) {
    inCorrespondances = true;
  } else if (inCorrespondances && node.type === "list" && currentCriterium) {
    currentCriterium.references = parseReferences(node);
    inCorrespondances = false;
  }
}

const result = {
  wcag: { version: "2.1" },
  en301549: { version: "3.2.1" },
  pdfua: { version: "2" },
  topics,
};

writeJsonFile(outputPath, result);

console.log(`Successfully written JSON to ${outputPath}`);
