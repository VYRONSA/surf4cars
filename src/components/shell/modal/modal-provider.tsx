"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/utils";

export type ModalSize = "sm" | "md" | "lg" | "xl" | "fullscreen" | "drawer";

export interface ModalOptions {
  readonly id?: string;
  readonly title?: ReactNode;
  readonly description?: ReactNode;
  readonly content: ReactNode;
  readonly size?: ModalSize;
  readonly confirmLabel?: string;
  readonly cancelLabel?: string;
  readonly onConfirm?: () => void;
  readonly onCancel?: () => void;
  readonly hideClose?: boolean;
}

interface ActiveModal extends ModalOptions {
  readonly id: string;
}

interface ModalContextValue {
  readonly modals: readonly ActiveModal[];
  readonly openModal: (options: ModalOptions) => string;
  readonly closeModal: (id: string) => void;
  readonly closeAll: () => void;
  readonly confirm: (options: Omit<ModalOptions, "content"> & { readonly message: ReactNode }) => Promise<boolean>;
}

const ModalContext = createContext<ModalContextValue | null>(null);

let modalCounter = 0;

const sizeClasses: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
  fullscreen: "max-w-none w-full h-full m-0 rounded-none",
  drawer: "max-w-md ml-auto h-full rounded-none rounded-l-[var(--radius-2xl)]",
};

export function ModalProvider({ children }: { readonly children: ReactNode }) {
  const [modals, setModals] = useState<ActiveModal[]>([]);
  const confirmResolversRef = useRef<Map<string, (value: boolean) => void>>(new Map());

  const closeModal = useCallback((id: string) => {
    setModals((prev) => prev.filter((m) => m.id !== id));
    const resolver = confirmResolversRef.current.get(id);
    if (resolver) {
      resolver(false);
      confirmResolversRef.current.delete(id);
    }
  }, []);

  const closeAll = useCallback(() => {
    setModals([]);
    confirmResolversRef.current.forEach((resolve) => resolve(false));
    confirmResolversRef.current.clear();
  }, []);

  const openModal = useCallback((options: ModalOptions): string => {
    const id = options.id ?? `modal-${++modalCounter}`;
    setModals((prev) => [...prev, { ...options, id }]);
    return id;
  }, []);

  const confirm = useCallback(
    (options: Omit<ModalOptions, "content"> & { readonly message: ReactNode }) =>
      new Promise<boolean>((resolve) => {
        const id = openModal({
          ...options,
          size: options.size ?? "sm",
          content: (
            <p className="text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
              {options.message}
            </p>
          ),
          onConfirm: () => {
            resolve(true);
            closeModal(id);
          },
          onCancel: () => {
            resolve(false);
            closeModal(id);
          },
        });
        confirmResolversRef.current.set(id, resolve);
      }),
    [openModal, closeModal],
  );

  const value = useMemo(
    () => ({ modals, openModal, closeModal, closeAll, confirm }),
    [modals, openModal, closeModal, closeAll, confirm],
  );

  return (
    <ModalContext.Provider value={value}>
      {children}
      <ModalHost modals={modals} onClose={closeModal} />
    </ModalContext.Provider>
  );
}

export function useModal(): ModalContextValue {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useModal must be used within ModalProvider");
  return ctx;
}

function ModalHost({
  modals,
  onClose,
}: {
  readonly modals: readonly ActiveModal[];
  readonly onClose: (id: string) => void;
}) {
  if (modals.length === 0) return null;

  const top = modals[modals.length - 1]!;
  const isDrawer = top.size === "drawer";
  const isFullscreen = top.size === "fullscreen";

  return (
    <div className="fixed inset-0 z-[80] flex" role="presentation">
      <div
        className="glass-overlay absolute inset-0 motion-modal"
        onClick={() => onClose(top.id)}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={top.title ? "modal-title" : undefined}
        className={cn(
          "glass-dialog relative z-10 flex flex-col motion-modal animate-slide-up-sfc",
          isDrawer ? "ml-auto h-full" : "m-auto w-full",
          isFullscreen && "h-full",
          sizeClasses[top.size ?? "md"],
        )}
      >
        {(top.title ?? !top.hideClose) && (
          <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border-subtle)] px-6 py-4">
            <div>
              {top.title && (
                <h2
                  id="modal-title"
                  className="text-[length:var(--text-h5)] font-semibold tracking-[var(--tracking-heading)]"
                >
                  {top.title}
                </h2>
              )}
              {top.description && (
                <p className="mt-1 text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
                  {top.description}
                </p>
              )}
            </div>
            {!top.hideClose && (
              <button
                type="button"
                onClick={() => onClose(top.id)}
                className="rounded-[var(--radius-md)] p-1.5 text-[var(--color-muted-foreground)] motion-hover hover:bg-[var(--color-hover)] hover:text-[var(--color-foreground)]"
                aria-label="Close dialog"
              >
                ✕
              </button>
            )}
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-6 py-4">{top.content}</div>
        {(top.onConfirm ?? top.onCancel) && (
          <div className="flex justify-end gap-2 border-t border-[var(--color-border-subtle)] px-6 py-4">
            {top.onCancel && (
              <Button variant="outline" size="sm" onClick={top.onCancel}>
                {top.cancelLabel ?? "Cancel"}
              </Button>
            )}
            {top.onConfirm && (
              <Button size="sm" onClick={top.onConfirm}>
                {top.confirmLabel ?? "Confirm"}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
