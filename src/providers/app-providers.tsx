"use client";

import type { ReactNode } from "react";

import { AuthSessionSync } from "@/features/authentication/components/auth-session-sync";
import { ModalProvider } from "@/components/shell/modal/modal-provider";
import { NotificationProvider } from "@/components/shell/notifications/notification-provider";

interface AppProvidersProps {
  readonly children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <NotificationProvider>
      <AuthSessionSync />
      <ModalProvider>{children}</ModalProvider>
    </NotificationProvider>
  );
}
