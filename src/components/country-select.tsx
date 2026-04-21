"use client";

import {
  useCallback,
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
  const wrapRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listId = useId();

  const selectable = useMemo(() => options.filter((o) => !o.divider), [options]);
  const selectedLabel = useMemo(
    () => selectable.find((o) => o.value === value)?.label ?? ariaLabel ?? "Select country",
    [selectable, value, ariaLabel],
  );

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    const selected = listRef.current.querySelector<HTMLButtonElement>(
      "[data-selected='true']",
    );
    (selected ?? listRef.current.querySelector<HTMLButtonElement>("button"))?.focus();
  }, [open]);

  const handleItemKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>) => {
      const items = Array.from(
        listRef.current?.querySelectorAll<HTMLButtonElement>("button") ?? [],
      );
      const idx = items.indexOf(e.currentTarget);
      if (e.key === "ArrowDown") {
        e.preventDefault();
        items[(idx + 1) % items.length]?.focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        items[(idx - 1 + items.length) % items.length]?.focus();
      } else if (e.key === "Home") {
        e.preventDefault();
        items[0]?.focus();
      } else if (e.key === "End") {
        e.preventDefault();
        items[items.length - 1]?.focus();
      }
    },
    [],
  );

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
        onClick={() => setOpen((v) => !v)}
        onFocus={onFocus}
        onBlur={onBlur}
        className="jc-country-trigger"
      >
        <Icon country={value} countryName={selectedLabel} aria-hidden />
        <svg
          className="jc-country-chevron"
          viewBox="0 0 10 6"
          width="10"
          height="6"
          aria-hidden
        >
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
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label={ariaLabel ?? "Country"}
          className="jc-country-menu"
        >
          {options.map((opt, i) => {
            if (opt.divider) {
              return <li key={`divider-${i}`} className="jc-country-divider" role="presentation" />;
            }
            const isSelected = opt.value === value;
            const code = opt.value ? getCountryCallingCode(opt.value) : null;
            return (
              <li key={opt.value ?? "intl"} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  data-selected={isSelected}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                    buttonRef.current?.focus();
                  }}
                  onKeyDown={handleItemKeyDown}
                  className="jc-country-option"
                >
                  <Icon country={opt.value} countryName={opt.label} aria-hidden />
                  <span className="jc-country-name">{opt.label}</span>
                  {code && <span className="jc-country-code">+{code}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
