/** Searches the phone field's country menu by name, ISO code, common short name or dial code. */

export type CountryOption<C extends string = string> = {
  value?: C;
  label: string;
  divider?: boolean;
};

const ALIASES: Record<string, string> = {
  usa: "US",
  america: "US",
  uk: "GB",
  britain: "GB",
  england: "GB",
  uae: "AE",
  emirates: "AE",
  korea: "KR",
  holland: "NL",
};

const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();

/**
 * Countries matching `query`, best match first: ISO code or short name, then names that start
 * with it, then names with a word that starts with it, then names that contain it. Digits match
 * the dial code. Ties keep the menu's order. An empty query returns the options unchanged.
 */
export function searchCountries<C extends string>(
  options: CountryOption<C>[],
  query: string,
  callingCode: (country: C) => string,
): CountryOption<C>[] {
  const q = normalize(query);
  if (!q) return options;
  const countries = options.filter((o) => !o.divider);

  const digits = q.replace(/[\s+]/g, "");
  if (/^\d+$/.test(digits)) {
    return countries
      .filter((o) => o.value && callingCode(o.value).startsWith(digits))
      .map((o) => ({ o, rank: o.value && callingCode(o.value) === digits ? 0 : 1 }))
      .sort((a, b) => a.rank - b.rank)
      .map(({ o }) => o);
  }

  const alias = ALIASES[q];
  const rank = (o: CountryOption<C>): number => {
    const name = normalize(o.label);
    const code = o.value?.toLowerCase();
    if (code === q || (alias && o.value === alias)) return 0;
    if (name.startsWith(q)) return 1;
    if (name.split(/[\s(),.'-]+/).some((w) => w.startsWith(q))) return 2;
    if (name.includes(q)) return 3;
    return -1;
  };

  return countries
    .map((o) => ({ o, rank: rank(o) }))
    .filter(({ rank }) => rank >= 0)
    .sort((a, b) => a.rank - b.rank)
    .map(({ o }) => o);
}
