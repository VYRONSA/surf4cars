import type { ComponentPropsWithoutRef, ReactNode } from "react";

export type Size = "sm" | "md" | "lg" | "xl";
export type Variant =
  | "primary"
  | "secondary"
  | "ghost"
  | "outline"
  | "text"
  | "danger"
  | "success";

export interface BaseComponentProps {
  readonly className?: string;
  readonly children?: ReactNode;
}

export type PolymorphicRef<C extends React.ElementType> =
  ComponentPropsWithoutRef<C> & { as?: C };

export const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]";

export const disabledStyles =
  "disabled:pointer-events-none disabled:opacity-40 disabled:cursor-not-allowed";
