"use client";

export { AppShell, type AppShellProps } from "./app-shell/app-shell";
export { AppHeader } from "./header/app-header";
export { AppSidebar, MobileSidebarDrawer } from "./sidebar/app-sidebar";
export { CommandPalette } from "./command-palette/command-palette";
export { GlobalSearchDialog, GlobalSearchTrigger } from "./global-search/global-search";
export { ShellProvider, useShell, useShellOptional, type ShellPortal } from "./context";
export { NotificationProvider, useNotifications } from "./notifications/notification-provider";
export { ModalProvider, useModal, type ModalSize, type ModalOptions } from "./modal/modal-provider";
export { PageContainer, PageHeader, PageSection, type PageVariant } from "./page/page-container";
export {
  AiLoadingSkeleton,
  CardLoadingSkeleton,
  InlineLoading,
  PageLoading,
  TableLoadingSkeleton,
} from "./loading/loading-states";
export {
  EmptyAiResults,
  EmptyAnalytics,
  EmptyCampaigns,
  EmptyMessages,
  EmptyNotifications,
  EmptyResults,
  EmptyVehicles,
} from "./empty-states/empty-state-presets";
export { ErrorView, ERROR_CONFIG, type ErrorType } from "./errors/error-view";
export { MarketplaceNotFound } from "./errors/not-found-view";
export * from "./navigation";
