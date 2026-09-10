// Content-level disclosure gate: fails the build if any client-identifying
// string from local/disclosure-denylist.txt appears in src/ or public/.
// The denylist is intentionally gitignored, so on machines without it
// (Vercel, fresh clones) the script warns and passes.
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const LIST = join(ROOT, "local", "disclosure-denylist.txt");
const SCAN = ["src", "public"];
const TEXT_EXT = /\.(tsx?|jsx?|mjs|css|md|mdx|json|svg|txt|html|xml)$/i;

if (!existsSync(LIST)) {
  console.warn("[disclosure] local/disclosure-denylist.txt not found — skipping (expected on Vercel / fresh clones).");
  process.exit(0);
}

const terms = readFileSync(LIST, "utf8")
  .split("\n")
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith("#"))
  .map((l) => l.toLowerCase());

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) yield* walk(p);
    else if (TEXT_EXT.test(name)) yield p;
  }
}

const hits = [];
for (const base of SCAN) {
  const dir = join(ROOT, base);
  if (!existsSync(dir)) continue;
  for (const file of walk(dir)) {
    const lines = readFileSync(file, "utf8").split("\n");
    lines.forEach((line, i) => {
      const lower = line.toLowerCase();
      for (const t of terms) {
        if (lower.includes(t)) hits.push(`${relative(ROOT, file)}:${i + 1}  [${t}]`);
      }
    });
  }
}

if (hits.length) {
  console.error(`[disclosure] ${hits.length} hit(s) — client-identifying content in public paths:`);
  for (const h of hits) console.error("  " + h);
  process.exit(1);
}
console.log(`[disclosure] clean — ${terms.length} terms, ${SCAN.join("+")} scanned.`);
