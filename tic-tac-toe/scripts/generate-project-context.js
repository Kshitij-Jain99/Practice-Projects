const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = path.resolve(__dirname, "..");
const OUTPUT_FILE = path.join(PROJECT_ROOT, "public", "project-context.json");

const IGNORED_DIRS = new Set([
  ".git",
  "node_modules",
  "build",
  "coverage",
  ".vscode",
  ".idea",
]);

const INCLUDED_EXTENSIONS = new Set([
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".json",
  ".css",
  ".md",
  ".txt",
  ".html",
]);

const EXCLUDED_FILES = new Set([
  ".env.local",
  ".env",
  "package-lock.json",
]);

const MAX_FILES = 120;
const MAX_CHARS_PER_FILE = 12000;
const MAX_TOTAL_CHARS = 500000;

function toPosixPath(filePath) {
  return filePath.split(path.sep).join("/");
}

function isBinaryLike(content) {
  return content.includes("\u0000");
}

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".json":
      return "application/json";
    case ".md":
      return "text/markdown";
    case ".css":
      return "text/css";
    case ".html":
      return "text/html";
    default:
      return "text/plain";
  }
}

function collectFiles(dirPath, acc) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const relativePath = path.relative(PROJECT_ROOT, fullPath);
    const normalized = toPosixPath(relativePath);

    if (entry.isDirectory()) {
      if (IGNORED_DIRS.has(entry.name)) continue;
      collectFiles(fullPath, acc);
      continue;
    }

    if (!INCLUDED_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) continue;
    if (EXCLUDED_FILES.has(entry.name)) continue;
    if (normalized.startsWith("public/") && normalized !== "public/index.html") continue;

    acc.push({
      fullPath,
      relativePath: normalized,
    });
  }
}

function loadResources() {
  const files = [];
  collectFiles(PROJECT_ROOT, files);

  files.sort((a, b) => a.relativePath.localeCompare(b.relativePath));

  const resources = [];
  let totalChars = 0;

  for (const file of files) {
    if (resources.length >= MAX_FILES) break;
    if (totalChars >= MAX_TOTAL_CHARS) break;

    const rawContent = fs.readFileSync(file.fullPath, "utf8");
    if (isBinaryLike(rawContent)) continue;

    const availableChars = Math.max(0, MAX_TOTAL_CHARS - totalChars);
    const cap = Math.min(MAX_CHARS_PER_FILE, availableChars);
    if (cap === 0) break;

    const isTruncated = rawContent.length > cap;
    const text = isTruncated
      ? `${rawContent.slice(0, cap)}\n\n/* content truncated */`
      : rawContent;

    totalChars += text.length;

    resources.push({
      uri: `file:///${file.relativePath}`,
      path: file.relativePath,
      name: path.basename(file.relativePath),
      mimeType: getMimeType(file.relativePath),
      text,
      truncated: isTruncated,
    });
  }

  return resources;
}

function buildSummary(resources) {
  const sourceFiles = resources.filter((file) => file.path.startsWith("src/")).length;
  const configFiles = resources.filter((file) => !file.path.startsWith("src/")).length;

  return [
    "This is a React tic-tac-toe project with a Tambo chat interface.",
    `Context contains ${resources.length} files (${sourceFiles} source, ${configFiles} config/docs).`,
    "Use listed resources to answer project-specific questions and include file paths when possible.",
  ].join(" ");
}

function main() {
  const resources = loadResources();
  const payload = {
    generatedAt: new Date().toISOString(),
    summary: buildSummary(resources),
    resources,
  };

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(payload, null, 2), "utf8");

  console.log(
    `Generated ${path.relative(PROJECT_ROOT, OUTPUT_FILE)} with ${resources.length} resources.`
  );
}

main();
