import type { ElementType, HTMLAttributes } from "react";

import { createVariants } from "@/components/ui/shared";
import { cn } from "@/utils";

export type TextVariant =
  | "display-xl"
  | "display-lg"
  | "display-md"
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "body-lg"
  | "body-md"
  | "body-sm"
  | "caption"
  | "overline"
  | "button"
  | "label"
  | "code";

const textVariants = createVariants("", {
  variant: {
    "display-xl":
      "text-[length:var(--text-display-xl)] leading-[var(--leading-display)] tracking-[var(--tracking-display)] font-semibold",
    "display-lg":
      "text-[length:var(--text-display-lg)] leading-[var(--leading-display)] tracking-[var(--tracking-display)] font-semibold",
    "display-md":
      "text-[length:var(--text-display-md)] leading-[var(--leading-display)] tracking-[var(--tracking-display)] font-semibold",
    h1: "text-[length:var(--text-h1)] leading-[var(--leading-heading)] tracking-[var(--tracking-heading)] font-semibold",
    h2: "text-[length:var(--text-h2)] leading-[var(--leading-heading)] tracking-[var(--tracking-heading)] font-semibold",
    h3: "text-[length:var(--text-h3)] leading-[var(--leading-heading)] tracking-[var(--tracking-heading)] font-semibold",
    h4: "text-[length:var(--text-h4)] leading-[var(--leading-heading)] tracking-[var(--tracking-heading)] font-medium",
    h5: "text-[length:var(--text-h5)] leading-[var(--leading-heading)] tracking-[var(--tracking-heading)] font-medium",
    h6: "text-[length:var(--text-h6)] leading-[var(--leading-heading)] tracking-[var(--tracking-heading)] font-medium",
    "body-lg":
      "text-[length:var(--text-body-lg)] leading-[var(--leading-body)] tracking-[var(--tracking-body)] font-normal",
    "body-md":
      "text-[length:var(--text-body-md)] leading-[var(--leading-body)] tracking-[var(--tracking-body)] font-normal",
    "body-sm":
      "text-[length:var(--text-body-sm)] leading-[var(--leading-body)] tracking-[var(--tracking-body)] font-normal",
    caption:
      "text-[length:var(--text-caption)] leading-[var(--leading-caption)] tracking-[var(--tracking-caption)] font-normal",
    overline:
      "text-[length:var(--text-overline)] leading-[var(--leading-caption)] tracking-[var(--tracking-overline)] font-medium uppercase",
    button:
      "text-[length:var(--text-button)] leading-none tracking-[var(--tracking-body)] font-medium",
    label:
      "text-[length:var(--text-label)] leading-[var(--leading-caption)] tracking-[var(--tracking-body)] font-medium",
    code: "font-mono text-[length:var(--text-code)] leading-[var(--leading-body)] tracking-normal font-normal",
  },
  tone: {
    default: "text-[var(--color-foreground)]",
    muted: "text-[var(--color-muted-foreground)]",
    primary: "text-[var(--color-primary-text)]",
    accent: "text-[var(--color-accent)]",
    success: "text-[var(--color-success)]",
    warning: "text-[var(--color-warning)]",
    danger: "text-[var(--color-danger)]",
    info: "text-[var(--color-info)]",
  },
});

const defaultElement: Record<TextVariant, ElementType> = {
  "display-xl": "h1",
  "display-lg": "h1",
  "display-md": "h1",
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  h5: "h5",
  h6: "h6",
  "body-lg": "p",
  "body-md": "p",
  "body-sm": "p",
  caption: "span",
  overline: "span",
  button: "span",
  label: "label",
  code: "code",
};

export interface TextProps extends HTMLAttributes<HTMLElement> {
  readonly variant?: TextVariant;
  readonly tone?: "default" | "muted" | "primary" | "accent" | "success" | "warning" | "danger" | "info";
  readonly as?: ElementType;
}

export function Text({
  variant = "body-md",
  tone = "default",
  as,
  className,
  children,
  ...props
}: TextProps) {
  const Component = as ?? defaultElement[variant];

  return (
    <Component
      className={cn(textVariants({ variant, tone }), className)}
      {...props}
    >
      {children}
    </Component>
  );
}

export function DisplayXL(props: Omit<TextProps, "variant">) {
  return <Text variant="display-xl" {...props} />;
}

export function DisplayLarge(props: Omit<TextProps, "variant">) {
  return <Text variant="display-lg" {...props} />;
}

export function DisplayMedium(props: Omit<TextProps, "variant">) {
  return <Text variant="display-md" {...props} />;
}

export function Heading1(props: Omit<TextProps, "variant">) {
  return <Text variant="h1" {...props} />;
}

export function Heading2(props: Omit<TextProps, "variant">) {
  return <Text variant="h2" {...props} />;
}

export function Heading3(props: Omit<TextProps, "variant">) {
  return <Text variant="h3" {...props} />;
}

export function Heading4(props: Omit<TextProps, "variant">) {
  return <Text variant="h4" {...props} />;
}

export function Heading5(props: Omit<TextProps, "variant">) {
  return <Text variant="h5" {...props} />;
}

export function Heading6(props: Omit<TextProps, "variant">) {
  return <Text variant="h6" {...props} />;
}

export function BodyLarge(props: Omit<TextProps, "variant">) {
  return <Text variant="body-lg" {...props} />;
}

export function BodyMedium(props: Omit<TextProps, "variant">) {
  return <Text variant="body-md" {...props} />;
}

export function BodySmall(props: Omit<TextProps, "variant">) {
  return <Text variant="body-sm" {...props} />;
}

export function Caption(props: Omit<TextProps, "variant">) {
  return <Text variant="caption" {...props} />;
}

export function Overline(props: Omit<TextProps, "variant">) {
  return <Text variant="overline" {...props} />;
}

export function Label(props: Omit<TextProps, "variant">) {
  return <Text variant="label" {...props} />;
}

export function CodeText(props: Omit<TextProps, "variant">) {
  return <Text variant="code" {...props} />;
}
