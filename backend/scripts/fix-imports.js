import fs from "fs";
import path from "path";

const rootDir = path.resolve("src");

function fixImportsInFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");

  // Agregar .js solo en imports locales (./ o ../)
  const updated = content.replace(
    /(from\s+["'](\.?\.\/[^"']+))(["'])/g,
    (match, p1, p2, p3) => {
      if (p2.endsWith(".js") || p2.endsWith(".json")) return match; // evitar duplicados
      return `${p1}.js${p3}`;
    }
  );

  if (updated !== content) {
    fs.writeFileSync(filePath, updated, "utf8");
    console.log(`✅ Fixed imports in: ${filePath}`);
  }
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walk(fullPath);
    } else if (file.endsWith(".ts")) {
      fixImportsInFile(fullPath);
    }
  }
}

console.log("🛠️  Corrigiendo imports locales en src...");
walk(rootDir);
console.log("✅ Proceso completado.");
