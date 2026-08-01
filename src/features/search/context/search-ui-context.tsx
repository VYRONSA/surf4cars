"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

/**
 * What is left of the search UI state.
 *
 * It used to carry five slices. Four of them were only ever read by the controls that set them:
 *
 *   searchMode           an Intelligent/Classic pair whose two branches rendered identical markup
 *   viewMode             grid, list and a disabled map — only grid was ever reachable in practice
 *   advancedDrawerOpen   a second filter drawer, duplicating this one
 *   activeQuickFilters   chips that highlighted themselves and filtered nothing
 *
 * The real filter state has always lived in the URL, which is where it belongs: it survives a reload,
 * it can be shared, and the server component can read it. Local state that shadows it is how a page
 * ends up with controls that look active and change nothing.
 */
export interface SearchUiContextValue {
  readonly mobileFiltersOpen: boolean;
  readonly setMobileFiltersOpen: (open: boolean) => void;
}

const SearchUiContext = createContext<SearchUiContextValue | null>(null);

export interface SearchUiProviderProps {
  readonly children: ReactNode;
}

export function SearchUiProvider({ children }: SearchUiProviderProps) {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const value = useMemo<SearchUiContextValue>(
    () => ({ mobileFiltersOpen, setMobileFiltersOpen }),
    [mobileFiltersOpen],
  );

  return (
    <SearchUiContext.Provider value={value}>{children}</SearchUiContext.Provider>
  );
}

export function useSearchUi(): SearchUiContextValue {
  const context = useContext(SearchUiContext);
  if (!context) {
    throw new Error("useSearchUi must be used within SearchUiProvider");
  }
  return context;
}
