"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type FocusEvent,
  type KeyboardEvent,
} from "react";
import { getCountryCallingCode, type Country } from "react-phone-number-input";
import { searchCountries } from "@/lib/country-search";

type Option = { value?: Country | undefined; label: string; divider?: boolean };

type IconProps = { country?: Country; countryName?: string; "aria-hidden"?: boolean };

type Props = {
  name?: string;
  value?: Country;
  options: Option[];
  onChange: (v: Country | undefined) => void;
  onFocus?: (e: FocusEvent<HTMLElement>) => void;
  onBlur?: (e: FocusEvent<HTMLElement>) => void;
  disabled?: boolean;
  readOnly?: boolean;
  iconComponent: ComponentType<IconProps>;
  "aria-label"?: string;
};

export function CountrySelect({
  name,
  value,
  options,
  onChange,
  onFocus,
  onBlur,
  disabled,
  readOnly,
  iconComponent: Icon,
  "aria-label": ariaLabel,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listId = useId();
  const optionId = (i: number) => `${listId}-opt-${i}`;

  const selectedLabel = useMemo(
    () => options.find((o) => !o.divider && o.value === value)?.label ?? ariaLabel ?? "Select country",
    [options, value, ariaLabel],
  );
  const shown = useMemo(
    () => searchCountries(options, query, getCountryCallingCode),
    [options, query],
  );
  // Indexes into `shown` that can be picked (dividers are skipped by the arrow keys).
  const pickable = useMemo(
    () => shown.flatMap((o, i) => (o.divider ? [] : [i])),
    [shown],
  );

  const openMenu = (initialQuery = "") => {
    setQuery(initialQuery);
    const start = initialQuery ? 0 : options.findIndex((o) => !o.divider && o.value === value);
    setActive(Math.max(start, 0));
    setOpen(true);
  };
  const closeMenu = (refocus: boolean) => {
    setOpen(false);
    setQuery("");
    if (refocus) buttonRef.current?.focus();
  };
  const pick = (opt: Option) => {
    onChange(opt.value);
    closeMenu(true);
  };

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (wrapRef.current?.contains(e.target as Node)) return;
      setOpen(false);
      setQuery("");
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelector<HTMLElement>(`[id="${listId}-opt-${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [open, active, shown, listId]);

  const move = (step: number) => {
    if (!pickable.length) return;
    const at = pickable.indexOf(active);
    const next = at < 0 ? 0 : (at + step + pickable.length) % pickable.length;
    setActive(pickable[next]);
  };

  const onSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      move(1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      move(-1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const opt = shown[active];
      if (opt && !opt.divider) pick(opt);
    } else if (e.key === "Escape") {
      e.preventDefault();
      closeMenu(true);
    } else if (e.key === "Tab") {
      closeMenu(false);
    }
  };

  // Typing a letter on the closed flag button opens the menu with that letter searched.
  const onButtonKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key.length === 1 && /\S/.test(e.key) && !e.metaKey && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      openMenu(e.key);
    } else if (e.key === "ArrowDown" && !open) {
      e.preventDefault();
      openMenu();
    }
  };

  return (
    <div className="PhoneInputCountry jc-country-select" ref={wrapRef}>
      <button
        ref={buttonRef}
        type="button"
        name={name}
        disabled={disabled || readOnly}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={`${ariaLabel ?? "Country"}: ${selectedLabel}`}
        onClick={() => (open ? closeMenu(true) : openMenu())}
        onKeyDown={onButtonKeyDown}
        onFocus={onFocus}
        onBlur={onBlur}
        className="jc-country-trigger"
      >
        <Icon country={value} countryName={selectedLabel} aria-hidden />
        <svg className="jc-country-chevron" viewBox="0 0 10 6" width="10" height="6" aria-hidden>
          <path
            d="M1 1l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open && (
        <div className="jc-country-menu">
          <input
            ref={searchRef}
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={shown[active] && !shown[active].divider ? optionId(active) : undefined}
            aria-label="Search countries"
            placeholder="Search country or code"
            autoComplete="off"
            spellCheck={false}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onSearchKeyDown}
            className="jc-country-search"
          />
          <ul ref={listRef} id={listId} role="listbox" aria-label={ariaLabel ?? "Country"} className="jc-country-list">
            {shown.length === 0 && (
              <li className="jc-country-empty" role="presentation">
                No country matches “{query.trim()}”
              </li>
            )}
            {shown.map((opt, i) => {
              if (opt.divider) {
                return <li key={`divider-${i}`} className="jc-country-divider" role="presentation" />;
              }
              const code = opt.value ? getCountryCallingCode(opt.value) : null;
              return (
                <li
                  key={opt.value ?? "intl"}
                  id={optionId(i)}
                  role="option"
                  aria-selected={opt.value === value}
                  data-active={i === active}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseMove={() => setActive(i)}
                  onClick={() => pick(opt)}
                  className="jc-country-option"
                >
                  <Icon country={opt.value} countryName={opt.label} aria-hidden />
                  <span className="jc-country-name">{opt.label}</span>
                  {code && <span className="jc-country-code">+{code}</span>}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
