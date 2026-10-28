import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { searchCountries, type CountryOption } from "./country-search.ts";

const CODES: Record<string, string> = {
  AU: "61", AT: "43", CI: "225", GB: "44", PH: "63", PE: "51", US: "1", AE: "971", CA: "1",
};

const OPTIONS: CountryOption[] = [
  { label: "International" },
  { label: "", divider: true },
  { value: "AU", label: "Australia" },
  { value: "AT", label: "Austria" },
  { value: "CA", label: "Canada" },
  { value: "CI", label: "Côte d'Ivoire" },
  { value: "PE", label: "Peru" },
  { value: "PH", label: "Philippines" },
  { value: "AE", label: "United Arab Emirates" },
  { value: "GB", label: "United Kingdom" },
  { value: "US", label: "United States" },
];

const search = (q: string) => searchCountries(OPTIONS, q, (c) => CODES[c]).map((o) => o.value ?? o.label);

describe("searchCountries", () => {
  it("returns every option, dividers included, for an empty query", () => {
    assert.equal(searchCountries(OPTIONS, "  ", (c) => CODES[c]), OPTIONS);
  });

  it("narrows letter by letter: P then H lands on the Philippines", () => {
    assert.deepEqual(search("p"), ["PE", "PH"]);
    assert.deepEqual(search("ph")[0], "PH");
  });

  it("puts the ISO code or a short name first", () => {
    assert.equal(search("us")[0], "US");
    assert.equal(search("uk")[0], "GB");
    assert.equal(search("usa")[0], "US");
    assert.equal(search("uae")[0], "AE");
    assert.equal(search("au")[0], "AU");
  });

  it("ranks a name prefix above a later word and a substring", () => {
    assert.deepEqual(search("states"), ["US"]);
    assert.deepEqual(search("king"), ["GB"]);
    assert.deepEqual(search("ralia"), ["AU"]);
  });

  it("ignores case and accents", () => {
    assert.deepEqual(search("COTE"), ["CI"]);
    assert.deepEqual(search("Philippines"), ["PH"]);
  });

  it("matches the dial code, exact codes first", () => {
    assert.deepEqual(search("+63"), ["PH"]);
    assert.deepEqual(search("1"), ["CA", "US"]);
    assert.deepEqual(search("6"), ["AU", "PH"]);
  });

  it("returns nothing for no match", () => {
    assert.deepEqual(search("zzz"), []);
  });
});
