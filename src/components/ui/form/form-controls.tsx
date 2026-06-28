import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

import { createVariants, disabledStyles, focusRing } from "@/components/ui/shared";
import { cn } from "@/utils";

const fieldStyles = createVariants("flex flex-col gap-1.5", {
  state: {
    default: "",
    error: "",
    success: "",
  },
});

const inputStyles = createVariants(
  "w-full rounded-[var(--radius-lg)] border bg-[var(--color-surface-raised)] px-3 text-[length:var(--text-body-sm)] text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] motion-button focus-visible:outline-none",
  {
    size: {
      sm: "h-8",
      md: "h-10",
      lg: "h-12 text-[length:var(--text-body-md)]",
    },
    state: {
      default: "border-[var(--color-border)] focus-visible:border-[var(--color-focus)] focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]",
      error: "border-[var(--color-danger)] focus-visible:ring-2 focus-visible:ring-[var(--color-danger-muted)]",
      success: "border-[var(--color-success)] focus-visible:ring-2 focus-visible:ring-[var(--color-success-muted)]",
    },
  },
);

export interface FormFieldProps {
  readonly label?: ReactNode;
  readonly helperText?: ReactNode;
  readonly error?: ReactNode;
  readonly required?: boolean;
  readonly htmlFor?: string;
  readonly className?: string;
  readonly children: ReactNode;
}

export function FormField({
  label,
  helperText,
  error,
  required,
  htmlFor,
  className,
  children,
}: FormFieldProps) {
  const state = error ? "error" : "default";

  return (
    <div className={cn(fieldStyles({ state }), className)}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="text-[length:var(--text-label)] font-medium leading-[var(--leading-caption)] tracking-[var(--tracking-body)]"
        >
          {label}
          {required && <span className="ml-0.5 text-[var(--color-danger)]" aria-hidden>*</span>}
        </label>
      )}
      {children}
      {(error ?? helperText) && (
        <p
          className={cn(
            "text-[length:var(--text-caption)]",
            error ? "text-[var(--color-danger)]" : "text-[var(--color-muted-foreground)]",
          )}
          role={error ? "alert" : undefined}
        >
          {error ?? helperText}
        </p>
      )}
    </div>
  );
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  readonly inputSize?: "sm" | "md" | "lg";
  readonly state?: "default" | "error" | "success";
}

export function Input({
  inputSize = "md",
  state = "default",
  className,
  disabled,
  ...props
}: InputProps) {
  return (
    <input
      disabled={disabled}
      className={cn(
        inputStyles({ size: inputSize, state }),
        focusRing,
        disabledStyles,
        className,
      )}
      {...props}
    />
  );
}

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  readonly state?: "default" | "error" | "success";
}

export function Textarea({
  state = "default",
  className,
  disabled,
  rows = 4,
  ...props
}: TextareaProps) {
  return (
    <textarea
      rows={rows}
      disabled={disabled}
      className={cn(
        inputStyles({ size: "md", state }),
        "h-auto min-h-24 resize-y py-2",
        focusRing,
        disabledStyles,
        className,
      )}
      {...props}
    />
  );
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  readonly inputSize?: "sm" | "md" | "lg";
  readonly state?: "default" | "error" | "success";
}

export function Select({
  inputSize = "md",
  state = "default",
  className,
  disabled,
  children,
  ...props
}: SelectProps) {
  return (
    <select
      disabled={disabled}
      className={cn(
        inputStyles({ size: inputSize, state }),
        "cursor-pointer appearance-none bg-[length:1rem] bg-[right_0.75rem_center] bg-no-repeat pr-10",
        focusRing,
        disabledStyles,
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  readonly label?: ReactNode;
}

export function Checkbox({ label, className, id, ...props }: CheckboxProps) {
  return (
    <label
      htmlFor={id}
      className={cn("inline-flex cursor-pointer items-center gap-2", className)}
    >
      <input
        id={id}
        type="checkbox"
        className={cn(
          "size-4 shrink-0 rounded-[var(--radius-sm)] border border-[var(--color-border)] accent-[var(--color-primary)]",
          focusRing,
        )}
        {...props}
      />
      {label && (
        <span className="text-[length:var(--text-body-sm)]">{label}</span>
      )}
    </label>
  );
}

export interface RadioProps extends InputHTMLAttributes<HTMLInputElement> {
  readonly label?: ReactNode;
}

export function Radio({ label, className, id, ...props }: RadioProps) {
  return (
    <label
      htmlFor={id}
      className={cn("inline-flex cursor-pointer items-center gap-2", className)}
    >
      <input
        id={id}
        type="radio"
        className={cn(
          "size-4 shrink-0 accent-[var(--color-primary)]",
          focusRing,
        )}
        {...props}
      />
      {label && (
        <span className="text-[length:var(--text-body-sm)]">{label}</span>
      )}
    </label>
  );
}

export interface ToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  readonly label?: ReactNode;
}

export function Toggle({ label, className, id, ...props }: ToggleProps) {
  return (
    <label
      htmlFor={id}
      className={cn("inline-flex cursor-pointer items-center gap-3", className)}
    >
      <span className="relative inline-flex">
        <input
          id={id}
          type="checkbox"
          role="switch"
          className="peer sr-only"
          {...props}
        />
        <span className="h-6 w-11 rounded-[var(--radius-pill)] bg-[var(--color-border-strong)] motion-button peer-checked:bg-[var(--color-primary)] peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--color-focus-ring)]" />
        <span className="absolute left-0.5 top-0.5 size-5 rounded-[var(--radius-pill)] bg-white shadow-sm motion-button peer-checked:translate-x-5" />
      </span>
      {label && (
        <span className="text-[length:var(--text-body-sm)]">{label}</span>
      )}
    </label>
  );
}
