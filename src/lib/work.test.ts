import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { siteConfig } from "./site-config.ts";
import { clientWork, publishedWork } from "./work.ts";

const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];

describe("headline numbers", () => {
  const n = siteConfig.stats.clientSystems;

  it("count every published client case study", () => {
    assert.equal(n, clientWork.filter((w) => w.published).length);
  });

  it("match the hard-coded copy that repeats them", () => {
    assert.match(siteConfig.description, new RegExp(`\\b${n} client systems in production\\b`));
    const processCopy = readFileSync(new URL("../components/sections/process.tsx", import.meta.url), "utf8");
    assert.match(processCopy, new RegExp(`\\b${WORDS[n]} client systems shipped\\b`));
  });
});

describe("work entries", () => {
  it("have unique slugs", () => {
    const slugs = publishedWork.map((w) => w.slug);
    assert.equal(new Set(slugs).size, slugs.length);
  });

  it("give every published case the sections its page renders", () => {
    for (const w of publishedWork) {
      assert.ok(w.summary && w.sections?.length && w.outcomes?.length && w.notes?.length, w.slug);
    }
  });
});
