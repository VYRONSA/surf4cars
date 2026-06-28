"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { SearchMode, SearchViewMode } from "@/features/search/config";

export interface SearchUiContextValue {
  readonly searchMode: SearchMode;
  readonly viewMode: SearchViewMode;
  readonly advancedDrawerOpen: boolean;
  readonly mobileFiltersOpen: boolean;
  readonly activeQuickFilters: readonly string[];
  readonly setSearchMode: (mode: SearchMode) => void;
  readonly setViewMode: (mode: SearchViewMode) => void;
  readonly setAdvancedDrawerOpen: (open: boolean) => void;
  readonly setMobileFiltersOpen: (open: boolean) => void;
  readonly toggleQuickFilter: (id: string) => void;
  readonly clearQuickFilters: () => void;
}

const SearchUiContext = createContext<SearchUiContextValue | null>(null);

export interface SearchUiProviderProps {
  readonly children: ReactNode;
}

export function SearchUiProvider({ children }: SearchUiProviderProps) {
  const [searchMode, setSearchMode] = useState<SearchMode>("intelligent");
  const [viewMode, setViewMode] = useState<SearchViewMode>("grid");
  const [advancedDrawerOpen, setAdvancedDrawerOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [activeQuickFilters, setActiveQuickFilters] = useState<readonly string[]>([]);

  const toggleQuickFilter = useCallback((id: string) => {
    setActiveQuickFilters((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }, []);

  const clearQuickFilters = useCallback(() => {
    setActiveQuickFilters([]);
  }, []);

  const value = useMemo<SearchUiContextValue>(
    () => ({
      searchMode,
      viewMode,
      advancedDrawerOpen,
      mobileFiltersOpen,
      activeQuickFilters,
      setSearchMode,
      setViewMode,
      setAdvancedDrawerOpen,
      setMobileFiltersOpen,
      toggleQuickFilter,
      clearQuickFilters,
    }),
    [
      searchMode,
      viewMode,
      advancedDrawerOpen,
      mobileFiltersOpen,
      activeQuickFilters,
      toggleQuickFilter,
      clearQuickFilters,
    ],
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
