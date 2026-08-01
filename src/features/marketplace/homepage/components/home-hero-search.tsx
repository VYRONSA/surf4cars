"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState, useSyncExternalStore, type FormEvent } from "react";

import { Icon } from "@/components/ui/icons";
import { Search, Sparkles } from "@/components/ui/icons/registry";
import { PRICE_BANDS, type SearchFacets } from "@/features/marketplace/homepage/server/homepage-facets";
import { cn } from "@/utils";

/**
 * The hero search.
 *
 * NOTHING HERE IS DECORATIVE
 * ==========================
 * Every control on this panel produces a real query against the real marketplace. The options come
 * from `SearchFacets`, which is derived from the same published stock the search will look through,
 * so a make cannot be offered unless there is a car behind it. Selecting Toyota then opening Model
 * shows Toyota's models and nothing else.
 *
 * That constraint is the reason this is worth writing carefully. A hero search that returns nothing
 * is not a cosmetic fault — it is the first thing a visitor does, and it teaches them the platform
 * does not work before they have seen a single vehicle.
 *
 * WHY FIVE MODES
 * ==============
 * They are five genuinely different ways people arrive:
 *
 *   Search vehicles  they know roughly what they want and will narrow it        → the control row
 *   Describe it      they know the life, not the car                            → free text
 *   Body type        they want "a bakkie", not a marque                         → one tap
 *   Make             they are loyal to a brand                                  → one tap
 *   Price            budget is the binding constraint, everything else follows  → one tap
 *
 * The last three are one tap to a result rather than four dropdowns to the same place, which is the
 * whole reason they earn a tab. "Describe it" is the existing natural-language search, kept intact —
 * it is a working feature and the brief forbids removing one.
 *
 * EVERY MODE LANDS ON /search
 * ===========================
 * No mode has its own result path, its own parsing or its own SEO. They all build query parameters
 * that `parseSearchState` already understands, which is why adding these did not require touching
 * the search route at all.
 */

const RECENT_KEY = "surf4cars:recent-searches";
const RECENT_LIMIT = 4;

type Mode = "controls" | "describe" | "body" | "make" | "price";

const MODES: readonly { readonly id: Mode; readonly label: string }[] = [
  { id: "controls", label: "Search vehicles" },
  { id: "describe", label: "Describe it" },
  { id: "body", label: "Body type" },
  { id: "make", label: "Make" },
  { id: "price", label: "Price" },
];

const DESCRIBE_EXAMPLES = [
  "Family SUV under R500 000 in Cape Town",
  "Reliable first car with low mileage",
  "Double cab that can tow a boat",
  "Something economical for the N1 commute",
] as const;

export interface HomeHeroSearchProps {
  readonly facets: SearchFacets;
  readonly vehicleCount: number;
}

interface RecentSearch {
  readonly label: string;
  readonly href: string;
}

export function HomeHeroSearch({ facets, vehicleCount }: HomeHeroSearchProps) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("controls");

  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [bodyType, setBodyType] = useState("");
  const [province, setProvince] = useState("");
  const [query, setQuery] = useState("");

  /*
    Recent searches come from localStorage via `useSyncExternalStore`, not an effect.
    ===============================================================================
    localStorage is external mutable state, which is exactly what this hook exists for. Reading it in
    an effect and calling `setState` works, but it renders once with an empty row and once with a
    full one — a visible flash of "Recent searches:" appearing a frame late, and a cascading render
    on the most performance-sensitive component on the site.

    It also cannot be read during render: the server has no localStorage, so a render-time read makes
    the first client render disagree with the server's and React throws away the tree. The hook
    handles precisely that with a separate server snapshot.
  */
  const storedRecent = useSyncExternalStore(subscribeToRecent, readRecent, () => null);
  const recent = useMemo(() => parseRecent(storedRecent), [storedRecent]);

  const models = useMemo(
    () => (make ? (facets.modelsByMake[make] ?? []) : []),
    [facets.modelsByMake, make],
  );

  const remember = useCallback(
    (entry: RecentSearch) => {
      const next = [entry, ...recent.filter((item) => item.href !== entry.href)].slice(0, RECENT_LIMIT);
      writeRecent(next);
    },
    [recent],
  );

  function go(params: Record<string, string>, label: string) {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value) search.set(key, value);
    }
    const href = search.size > 0 ? `/search?${search.toString()}` : "/search";
    remember({ label, href });
    router.push(href);
  }

  function submitControls(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const label =
      [make, model, bodyType, province].filter(Boolean).join(" · ") ||
      (priceMax ? `Up to ${PRICE_BANDS.find((b) => String(b.cents) === priceMax)?.label}` : "") ||
      "All vehicles";
    go({ make, model, priceMin, priceMax, bodyType, province }, label);
  }

  function submitDescribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = query.trim();
    if (!next) {
      router.push("/search");
      return;
    }
    go({ query: next }, next);
  }

  const countLabel = `Search ${vehicleCount.toLocaleString("en-ZA").replace(/,/g, " ")} vehicles`;

  /* A select whose only option is "Any …" is a control that cannot do anything. Disabling it says
     so honestly, rather than opening an empty list. */
  const hasMakes = facets.makes.length > 0;

  return (
    <div className="glass-hero-float w-full rounded-[var(--radius-2xl)] border border-[var(--color-glass-border)] p-3 sm:p-4">
      {/* ── Modes ───────────────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-1 pb-3">
        <div role="tablist" aria-label="Search mode" className="flex flex-wrap items-center gap-1">
          {MODES.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={mode === item.id}
              onClick={() => setMode(item.id)}
              className={cn(
                "motion-button inline-flex items-center gap-2 rounded-[var(--radius-pill)] px-4 py-2 text-[length:var(--text-body-sm)] font-medium",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]",
                mode === item.id
                  ? "bg-[var(--color-primary)] text-white"
                  : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-hover)] hover:text-[var(--color-foreground)]",
              )}
            >
              {item.id === "controls" && <Icon icon={Search} aria-hidden className="size-4" />}
              {item.id === "describe" && <Icon icon={Sparkles} aria-hidden className="size-4" />}
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Mode: the control row ───────────────────────────────────────────────────────────── */}
      {mode === "controls" && (
        <form onSubmit={submitControls} className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[repeat(6,minmax(7.5rem,1fr))_minmax(13rem,auto)]">
          <HeroSelect
            id="hero-make"
            label="Make"
            value={make}
            disabled={!hasMakes}
            onChange={(value) => {
              setMake(value);
              /* A model from the previous make would produce a query with no results. */
              setModel("");
            }}
            placeholder="Any make"
            options={facets.makes.map((option) => ({ value: option.value, label: option.value }))}
          />
          <HeroSelect
            id="hero-model"
            label="Model"
            value={model}
            onChange={setModel}
            placeholder={make ? "Any model" : "Any model"}
            disabled={!make || models.length === 0}
            options={models.map((option) => ({ value: option.value, label: option.value }))}
          />
          <HeroSelect
            id="hero-price-min"
            label="Min price"
            value={priceMin}
            onChange={setPriceMin}
            placeholder="No min"
            options={PRICE_BANDS.map((band) => ({ value: String(band.cents), label: band.label }))}
          />
          <HeroSelect
            id="hero-price-max"
            label="Max price"
            value={priceMax}
            onChange={setPriceMax}
            placeholder="No max"
            options={PRICE_BANDS.map((band) => ({ value: String(band.cents), label: band.label }))}
          />
          <HeroSelect
            id="hero-body"
            label="Body type"
            value={bodyType}
            onChange={setBodyType}
            placeholder="Any body type"
            options={facets.bodyTypes.map((option) => ({ value: option.value, label: option.value }))}
          />
          <HeroSelect
            id="hero-province"
            label="Location"
            value={province}
            onChange={setProvince}
            placeholder="Any location"
            options={facets.provinces.map((option) => ({ value: option.value, label: option.value }))}
          />

          <button
            type="submit"
            className="motion-button inline-flex h-[4.25rem] items-center justify-center gap-2.5 rounded-[var(--radius-xl)] bg-[var(--color-primary)] px-7 text-[length:var(--text-body-md)] font-semibold text-white shadow-[0_8px_24px_-8px_rgba(0,0,0,0.55)] hover:bg-[var(--color-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
          >
            <Icon icon={Search} aria-hidden className="size-5" />
            {countLabel}
          </button>
        </form>
      )}

      {/* ── Mode: describe ──────────────────────────────────────────────────────────────────── */}
      {mode === "describe" && (
        <div>
          <form onSubmit={submitDescribe} className="flex flex-col gap-2 sm:flex-row">
            <label htmlFor="hero-describe" className="sr-only">
              Describe the vehicle you want
            </label>
            <div className="relative flex-1">
              <Icon
                icon={Sparkles}
                aria-hidden
                className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[var(--color-muted)]"
              />
              <input
                id="hero-describe"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Family SUV under R500 000 in Cape Town"
                className="h-[4.25rem] w-full rounded-[var(--radius-xl)] border border-[var(--color-border-interactive)] bg-[var(--color-surface)]/75 pl-12 pr-4 text-[length:var(--text-body-md)] text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] focus-visible:border-[var(--color-focus)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
              />
            </div>
            <button
              type="submit"
              className="motion-button inline-flex h-[4.25rem] shrink-0 items-center justify-center gap-2.5 rounded-[var(--radius-xl)] bg-[var(--color-primary)] px-7 text-[length:var(--text-body-md)] font-semibold text-white hover:bg-[var(--color-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
            >
              <Icon icon={Search} aria-hidden className="size-5" />
              {countLabel}
            </button>
          </form>
          <div className="flex flex-wrap gap-2 pt-3">
            {DESCRIBE_EXAMPLES.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => setQuery(example)}
                className="motion-hover rounded-[var(--radius-pill)] border border-[var(--color-border)] px-3.5 py-1.5 text-[length:var(--text-caption)] text-[var(--color-muted-foreground)] hover:border-[var(--color-primary)] hover:text-[var(--color-foreground)]"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Modes: one tap to a result ──────────────────────────────────────────────────────── */}
      {mode === "body" && (
        <QuickChips
          emptyLabel="No body types in stock yet."
          items={facets.bodyTypes.map((option) => ({
            key: option.value,
            label: option.value,
            meta: String(option.count),
            onSelect: () => go({ bodyType: option.value }, option.value),
          }))}
        />
      )}

      {mode === "make" && (
        <QuickChips
          emptyLabel="No marques in stock yet."
          items={facets.makes.map((option) => ({
            key: option.value,
            label: option.value,
            meta: String(option.count),
            onSelect: () => go({ make: option.value }, option.value),
          }))}
        />
      )}

      {mode === "price" && (
        <QuickChips
          emptyLabel="No price bands available."
          items={PRICE_BANDS.slice(1, 9).map((band) => ({
            key: band.label,
            label: `Under ${band.label}`,
            onSelect: () => go({ priceMax: String(band.cents) }, `Under ${band.label}`),
          }))}
        />
      )}

      {/* ── Recent searches ─────────────────────────────────────────────────────────────────── */}
      {/*
        Real, or absent.
        ===============
        The concept shows a populated "Recent searches" row on a first visit, which cannot be honest:
        a visitor who has never searched has no recent searches, and pre-filling the row with four
        plausible ones is a fabricated history presented as the visitor's own. So the row renders only
        once there is something in it, and "Clear all" genuinely clears it.
      */}
      {recent.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-t border-[var(--color-border-subtle)] pt-3 mt-3">
          <span className="text-[length:var(--text-caption)] text-[var(--color-muted)]">
            Recent searches:
          </span>
          {recent.map((item) => (
            <button
              key={item.href}
              type="button"
              onClick={() => router.push(item.href)}
              className="motion-hover max-w-[16rem] truncate rounded-[var(--radius-pill)] border border-[var(--color-border)] px-3.5 py-1.5 text-[length:var(--text-caption)] text-[var(--color-muted-foreground)] hover:border-[var(--color-primary)] hover:text-[var(--color-foreground)]"
            >
              {item.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => writeRecent([])}
            className="motion-hover ml-auto text-[length:var(--text-caption)] text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Recent-search store ──────────────────────────────────────────────────────────────────────
   A tiny external store over localStorage. Writes notify subscribers in this tab through a custom
   event, because the native `storage` event only fires in *other* tabs — without it, clicking
   "Clear all" would leave the row on screen until something else caused a render.
   ──────────────────────────────────────────────────────────────────────────────────────────── */

const RECENT_EVENT = "surf4cars:recent-searches-changed";

function subscribeToRecent(onChange: () => void): () => void {
  window.addEventListener(RECENT_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(RECENT_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/* Returns the raw string so the snapshot is a primitive. Returning a parsed array here would build a
   new object on every call, and `useSyncExternalStore` compares snapshots by identity — an infinite
   render loop, which is the classic way to get this hook wrong. */
function readRecent(): string | null {
  try {
    return window.localStorage.getItem(RECENT_KEY);
  } catch {
    return null;
  }
}

function parseRecent(raw: string | null): readonly RecentSearch[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is RecentSearch =>
          typeof (item as RecentSearch)?.label === "string" &&
          typeof (item as RecentSearch)?.href === "string",
      )
      .slice(0, RECENT_LIMIT);
  } catch {
    return [];
  }
}

function writeRecent(next: readonly RecentSearch[]): void {
  try {
    if (next.length === 0) window.localStorage.removeItem(RECENT_KEY);
    else window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* Private browsing. The search still runs; only the memory of it is lost. */
  }
  window.dispatchEvent(new Event(RECENT_EVENT));
}

/* ── Controls ─────────────────────────────────────────────────────────────────────────────────
   A native <select>. Deliberately: it is keyboard-navigable, type-ahead searchable, screen-reader
   correct and uses the platform picker on a phone — all of which a custom listbox has to rebuild,
   usually incompletely. The premium appearance is the frame around it, not a replacement for it.
   ──────────────────────────────────────────────────────────────────────────────────────────── */

function HeroSelect(props: {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly placeholder: string;
  readonly options: readonly { readonly value: string; readonly label: string }[];
  readonly disabled?: boolean;
}) {
  return (
    <div
      className={cn(
        "group relative rounded-[var(--radius-xl)] border border-[var(--color-border-interactive)] bg-[var(--color-surface)]/70 px-4 pb-2.5 pt-2 transition-colors",
        "focus-within:border-[var(--color-focus)] focus-within:ring-2 focus-within:ring-[var(--color-focus-ring)]",
        props.disabled ? "opacity-55" : "hover:border-[var(--color-border-strong)]",
      )}
    >
      <label
        htmlFor={props.id}
        className="pointer-events-none block text-[length:var(--text-caption)] text-[var(--color-muted)]"
      >
        {props.label}
      </label>
      <select
        id={props.id}
        value={props.value}
        disabled={props.disabled}
        onChange={(event) => props.onChange(event.target.value)}
        className="w-full appearance-none truncate bg-transparent pr-7 text-[length:var(--text-body-sm)] font-medium text-[var(--color-foreground)] focus:outline-none disabled:cursor-not-allowed"
      >
        <option value="">{props.placeholder}</option>
        {props.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <svg
        aria-hidden
        viewBox="0 0 12 8"
        className="pointer-events-none absolute bottom-3.5 right-4 h-2 w-3 fill-none stroke-[var(--color-muted)] stroke-[1.5]"
      >
        <path d="M1 1.5 6 6.5 11 1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function QuickChips(props: {
  readonly items: readonly {
    readonly key: string;
    readonly label: string;
    readonly meta?: string;
    readonly onSelect: () => void;
  }[];
  readonly emptyLabel: string;
}) {
  if (props.items.length === 0) {
    return (
      <p className="px-1 py-6 text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
        {props.emptyLabel}
      </p>
    );
  }

  return (
    <div data-quick-chips className="flex flex-wrap gap-2 py-1">
      {props.items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={item.onSelect}
          className="motion-hover inline-flex items-center gap-2 rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-[var(--color-surface)]/50 px-4 py-2.5 text-[length:var(--text-body-sm)] font-medium text-[var(--color-foreground)] hover:border-[var(--color-primary)] hover:bg-[var(--color-surface)]/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
        >
          {item.label}
          {item.meta && (
            <span className="text-[length:var(--text-caption)] font-normal text-[var(--color-muted)]">
              {item.meta}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
