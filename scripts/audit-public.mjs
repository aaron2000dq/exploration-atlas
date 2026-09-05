import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const textExtensions = new Set([
  ".css", ".html", ".js", ".json", ".jsx", ".md", ".mjs", ".svg", ".ts", ".tsx", ".yml", ".yaml",
]);
const vendoredTextPrefixes = ["public/mediapipe/"];

const forbidden = [
  { label: "local home-directory path", pattern: /\/(?:Users|home)\/[^/\s"']+/i },
  { label: "personal GitHub Pages host", pattern: /\b[a-z0-9_-]+\.github\.io\b/i },
  { label: "personal age copy", pattern: /二十[八九]岁|\b(?:2[89])\s*岁|Happy\s+(?:28th|29th)\b/i },
];

// Optional, ignored local file: one exact private term per line. This keeps a
// project's names, accounts, old PINs and private place names out of the
// scanner source while still allowing a maintainer to check them before export.
if (existsSync(".private-audit-terms")) {
  const privateTerms = readFileSync(".private-audit-terms", "utf8")
    .split(/\r?\n/)
    .map((term) => term.trim())
    .filter((term) => term && !term.startsWith("#"));
  for (const term of privateTerms) {
    forbidden.push({
      label: "maintainer-defined private term",
      pattern: new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"),
    });
  }
}

const files = execFileSync("git", ["ls-files", "-co", "--exclude-standard"], {
  encoding: "utf8",
})
  .split("\n")
  .filter(Boolean);

const findings = [];

for (const file of files) {
  // `git ls-files` also reports tracked files deleted in the working tree. The
  // scanner itself contains the rules it enforces, so neither should be read.
  if (!existsSync(file) || file === "scripts/audit-public.mjs") continue;

  for (const rule of forbidden) {
    if (rule.pattern.test(file)) findings.push(`${file}: path contains ${rule.label}`);
    rule.pattern.lastIndex = 0;
  }

  if (
    !textExtensions.has(path.extname(file).toLowerCase())
    || vendoredTextPrefixes.some((prefix) => file.startsWith(prefix))
  ) continue;

  let source;
  try {
    source = readFileSync(file, "utf8");
  } catch {
    continue;
  }

  source.split(/\r?\n/).forEach((line, index) => {
    for (const rule of forbidden) {
      if (rule.pattern.test(line)) findings.push(`${file}:${index + 1}: ${rule.label}`);
      rule.pattern.lastIndex = 0;
    }
  });
}

if (findings.length) {
  console.error("Public release audit failed:\n");
  findings.forEach((finding) => console.error(`- ${finding}`));
  process.exitCode = 1;
} else {
  console.log(`Public release audit passed (${files.length} visible files checked).`);
}
