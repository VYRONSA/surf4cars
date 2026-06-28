import type { HTMLAttributes } from "react";

import { createVariants } from "@/components/ui/shared";
import { cn } from "@/utils";

const glassVariants = createVariants("motion-card", {
  variant: {
    default: "glass",
    subtle: "glass-subtle",
    strong: "glass-strong",
    header: "glass-header",
    sidebar: "glass-sidebar",
    card: "glass-card",
    panel: "glass-panel",
    dialog: "glass-dialog",
    overlay: "glass-overlay",
  },
});

export interface GlassSurfaceProps extends HTMLAttributes<HTMLDivElement> {
  readonly variant?:
    | "default"
    | "subtle"
    | "strong"
    | "header"
    | "sidebar"
    | "card"
    | "panel"
    | "dialog"
    | "overlay";
}

export function GlassSurface({
  variant = "default",
  className,
  children,
  ...props
}: GlassSurfaceProps) {
  return (
    <div className={cn(glassVariants({ variant }), className)} {...props}>
      {children}
    </div>
  );
}
