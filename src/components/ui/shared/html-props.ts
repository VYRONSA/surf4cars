import type { HTMLAttributes } from "react";

/** Omits HTML attributes that commonly conflict with component prop names. */
export type DivProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "title" | "onChange" | "onSelect"
>;

export type CardBaseProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "title"
>;
