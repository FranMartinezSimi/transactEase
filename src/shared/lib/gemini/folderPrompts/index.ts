import fs from "fs";
import path from "path";


export const getFolderPrompts = (folderPath: string): string[] => {
  try {
    const files = fs.readdirSync(folderPath);
    const prompts: string[] = [];

    files.forEach((file) => {
      const fullPath = path.join(folderPath, file);
      const stats = fs.statSync(fullPath);

      if (stats.isFile() && path.extname(file) === ".txt") {
        const content = fs.readFileSync(fullPath, "utf-8");
        prompts.push(content);
      }
    });

    return prompts;
  } catch (error) {
    console.error(`Error reading folder prompts from ${folderPath}:`, error);
    return [];
  }
}