"use client";

import { useEffect } from "react";

import {
  createAuthenticatedHeaders,
  rememberClientProtectedPath,
  resolveSafeAuthRedirectPath,
  resolveUserTypeFromSupabaseSession,
  setClientAuthUserType,
} from "@/features/authentication";
import { createSupabaseBrowserClient } from "@/lib/supabase";

export function AuthSessionSync() {
  useEffect(() => {
    let isMounted = true;
    const supabase = createSupabaseBrowserClient();

    if (typeof window !== "undefined") {
      const currentPath = `${window.location.pathname}${window.location.search}`;
      if (
        window.location.pathname === "/dealer"
        || window.location.pathname.startsWith("/dealer/")
        || window.location.pathname === "/buyer"
        || window.location.pathname.startsWith("/buyer/")
      ) {
        rememberClientProtectedPath(currentPath);
      }
    }

    const redirectToAuthIfProtectedPath = () => {
      if (typeof window === "undefined") return;

      const pathname = window.location.pathname;
      const search = window.location.search;
      const redirect = encodeURIComponent(
        resolveSafeAuthRedirectPath(`${pathname}${search}`, "/"),
      );

      if (pathname === "/dealer" || pathname.startsWith("/dealer/")) {
        window.location.replace(`/auth/sign-in?portal=dealer&redirect=${redirect}`);
        return;
      }

      if (pathname === "/buyer" || pathname.startsWith("/buyer/")) {
        window.location.replace(`/auth/sign-in?portal=buyer&redirect=${redirect}`);
      }
    };

    const hasClientUserType = () => {
      if (typeof window === "undefined") return false;
      return Boolean(window.localStorage.getItem("surf4cars:auth-user-type"));
    };

    if (!supabase) {
      void createAuthenticatedHeaders();

      const onStorage = (event: StorageEvent) => {
        if (!event.key || !event.key.startsWith("surf4cars:")) return;

        void createAuthenticatedHeaders().then(() => {
          const hasUserType = Boolean(window.localStorage.getItem("surf4cars:auth-user-type"));
          if (!hasUserType) {
            redirectToAuthIfProtectedPath();
          }
        });
      };

      window.addEventListener("storage", onStorage);

      return () => {
        window.removeEventListener("storage", onStorage);
      };
    }

    const onStorage = () => {
      void createAuthenticatedHeaders().then(() => {
        const hasUserType = Boolean(window.localStorage.getItem("surf4cars:auth-user-type"));
        if (!hasUserType) {
          redirectToAuthIfProtectedPath();
        }
      });
    };

    window.addEventListener("storage", onStorage);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void createAuthenticatedHeaders();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    const hydrate = async () => {
      const sessionResult = await supabase.auth.getSession();
      if (!isMounted) return;

      const session = sessionResult.data.session;
      if (!session) {
        await createAuthenticatedHeaders();
        if (!hasClientUserType()) {
          redirectToAuthIfProtectedPath();
        }
        return;
      }

      const userType = resolveUserTypeFromSupabaseSession(session);
      if (userType) {
        setClientAuthUserType(userType);
      }

      await createAuthenticatedHeaders();
    };

    void hydrate();

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;

      if (!session) {
        void createAuthenticatedHeaders().then(() => {
          if (!hasClientUserType()) {
            redirectToAuthIfProtectedPath();
          }
        });
        return;
      }

      const userType = resolveUserTypeFromSupabaseSession(session);
      if (userType) {
        setClientAuthUserType(userType);
      }

      void createAuthenticatedHeaders();
    });

    return () => {
      isMounted = false;
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      subscription.subscription.unsubscribe();
    };
  }, []);

  return null;
}
