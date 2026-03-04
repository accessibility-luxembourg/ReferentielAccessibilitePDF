import { readFileSync } from "fs";
import { remark } from "remark";

/**
 * Get the markdown file path and returns the AST tree of the file content.
 */
export function parseFile(filePath) {
    const content = readFileSync(filePath, "utf-8");

    return remark().parse(content);
}