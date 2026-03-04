import { writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

export function writeJsonFile(filePath, data) {
    const jsonDirectory = dirname(filePath);

    mkdirSync(jsonDirectory, { recursive: true });
    
    writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

export function getInputPath(file, language) {
    const currentDirectory = dirname(fileURLToPath(import.meta.url));
    const projectDirectory = resolve(currentDirectory, "../../../");

    return resolve(projectDirectory, language, file);
}

export function getOutputPath(file, language) {
    const currentDirectory = dirname(fileURLToPath(import.meta.url));
    const projectDirectory = resolve(currentDirectory, "../../../");

    return resolve(projectDirectory, language, "json", file);
}