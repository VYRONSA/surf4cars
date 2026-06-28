"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { Toast } from "@/components/ui/feedback";
import { cn } from "@/utils";

export type ToastVariant = "default" | "success" | "warning" | "danger" | "info";

export interface ToastItem {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly variant?: ToastVariant;
  readonly duration?: number;
}

export interface BannerItem {
  readonly id: string;
  readonly message: ReactNode;
  readonly variant?: "default" | "info" | "warning" | "danger";
  readonly dismissible?: boolean;
}

interface NotificationContextValue {
  readonly toasts: readonly ToastItem[];
  readonly banner: BannerItem | null;
  readonly showToast: (toast: Omit<ToastItem, "id">) => void;
  readonly dismissToast: (id: string) => void;
  readonly showBanner: (banner: Omit<BannerItem, "id">) => void;
  readonly dismissBanner: () => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

let toastCounter = 0;

export function NotificationProvider({ children }: { readonly children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [banner, setBanner] = useState<BannerItem | null>(null);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (toast: Omit<ToastItem, "id">) => {
      const id = `toast-${++toastCounter}`;
      const item: ToastItem = { ...toast, id };
      setToasts((prev) => [...prev, item]);
      const duration = toast.duration ?? 5000;
      if (duration > 0) {
        window.setTimeout(() => dismissToast(id), duration);
      }
    },
    [dismissToast],
  );

  const showBanner = useCallback((next: Omit<BannerItem, "id">) => {
    setBanner({ ...next, id: `banner-${++toastCounter}` });
  }, []);

  const dismissBanner = useCallback(() => setBanner(null), []);

  const value = useMemo(
    () => ({
      toasts,
      banner,
      showToast,
      dismissToast,
      showBanner,
      dismissBanner,
    }),
    [toasts, banner, showToast, dismissToast, showBanner, dismissBanner],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <ToastHost toasts={toasts} onDismiss={dismissToast} />
      <BannerHost banner={banner} onDismiss={dismissBanner} />
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}

function ToastHost({
  toasts,
  onDismiss,
}: {
  readonly toasts: readonly ToastItem[];
  readonly onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-[100] flex max-w-sm flex-col gap-2"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast
            title={toast.title}
            description={toast.description}
            action={
              <button
                type="button"
                onClick={() => onDismiss(toast.id)}
                className="text-[length:var(--text-caption)] text-[var(--color-muted-foreground)] motion-hover hover:text-[var(--color-foreground)]"
                aria-label="Dismiss notification"
              >
                Dismiss
              </button>
            }
          />
        </div>
      ))}
    </div>
  );
}

function BannerHost({
  banner,
  onDismiss,
}: {
  readonly banner: BannerItem | null;
  readonly onDismiss: () => void;
}) {
  if (!banner) return null;

  const variantStyles = {
    default: "border-[var(--color-border)] bg-[var(--color-surface-raised)]",
    info: "border-[var(--color-info)]/20 bg-[var(--color-info-muted)]",
    warning: "border-[var(--color-warning)]/20 bg-[var(--color-warning-muted)]",
    danger: "border-[var(--color-danger)]/20 bg-[var(--color-danger-muted)]",
  }[banner.variant ?? "default"];

  return (
    <div
      role="status"
      className={cn(
        "fixed inset-x-0 top-0 z-[90] flex items-center justify-between gap-4 border-b px-4 py-3 lg:px-6",
        variantStyles,
      )}
    >
      <div className="text-[length:var(--text-body-sm)]">{banner.message}</div>
      {banner.dismissible !== false && (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded-[var(--radius-md)] px-2 py-1 text-[length:var(--text-caption)] motion-hover hover:bg-[var(--color-hover)]"
          aria-label="Dismiss banner"
        >
          Dismiss
        </button>
      )}
    </div>
  );
}
