"use client";

import type { ReactNode } from "react";

import { ModalProvider } from "@/components/shell/modal/modal-provider";
import { NotificationProvider } from "@/components/shell/notifications/notification-provider";

interface AppProvidersProps {
  readonly children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <NotificationProvider>
      <ModalProvider>{children}</ModalProvider>
    </NotificationProvider>
  );
}
