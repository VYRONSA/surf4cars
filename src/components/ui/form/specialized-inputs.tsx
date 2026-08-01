import type { InputHTMLAttributes, ReactNode } from "react";

import { FormField, Input } from "@/components/ui/form/form-controls";
import { Icon } from "@/components/ui/icons";
import { Search, X } from "@/components/ui/icons/registry";
import { cn } from "@/utils";

export interface SearchInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  readonly onClear?: () => void;
  readonly wrapperClassName?: string;
}

export function SearchInput({
  onClear,
  wrapperClassName,
  className,
  value,
  ...props
}: SearchInputProps) {
  const hasValue = Boolean(value);

  return (
    <div className={cn("relative", wrapperClassName)}>
      <Icon
        icon={Search}
        size="sm"
        tone="muted"
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
      />
      <Input
        type="search"
        value={value}
        className={cn("pl-9", hasValue && onClear && "pr-9", className)}
        {...props}
      />
      {hasValue && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-[var(--radius-sm)] p-1 text-[var(--color-muted-foreground)] motion-hover hover:bg-[var(--color-hover)] hover:text-[var(--color-foreground)]"
          aria-label="Clear search"
        >
          <Icon icon={X} size="sm" />
        </button>
      )}
    </div>
  );
}

export interface DatePickerProps extends InputHTMLAttributes<HTMLInputElement> {
  readonly label?: ReactNode;
  readonly helperText?: ReactNode;
  readonly error?: ReactNode;
}

export function DatePicker({ label, helperText, error, id, ...props }: DatePickerProps) {
  const fieldId = id ?? "date-picker";

  return (
    <FormField label={label} helperText={helperText} error={error} htmlFor={fieldId}>
      <Input id={fieldId} type="date" state={error ? "error" : "default"} {...props} />
    </FormField>
  );
}

export interface UploadAreaProps {
  readonly label?: ReactNode;
  readonly description?: ReactNode;
  readonly accept?: string;
  readonly multiple?: boolean;
  readonly onFilesSelected?: (files: FileList) => void;
  readonly className?: string;
}

export function UploadArea({
  label,
  description,
  accept,
  multiple,
  onFilesSelected,
  className,
}: UploadAreaProps) {
  return (
    <label
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[var(--radius-xl)] border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-6 py-10 text-center motion-hover hover:border-[var(--color-border-strong)] hover:bg-[var(--color-hover)]",
        className,
      )}
    >
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        onChange={(e) => {
          const files = e.target.files;
          if (files) onFilesSelected?.(files);
        }}
      />
      {label && (
        <span className="text-[length:var(--text-body-md)] font-medium">{label}</span>
      )}
      {description && (
        <span className="text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
          {description}
        </span>
      )}
    </label>
  );
}

export interface ImagePickerProps extends UploadAreaProps {
  readonly preview?: ReactNode;
}

export function ImagePicker({ preview, ...props }: ImagePickerProps) {
  return (
    <div className="space-y-3">
      {preview && (
        <div className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border)]">
          {preview}
        </div>
      )}
      <UploadArea accept="image/*" {...props} />
    </div>
  );
}

export interface TagInputProps {
  readonly tags: readonly string[];
  readonly placeholder?: string;
  readonly onAddTag?: (tag: string) => void;
  readonly onRemoveTag?: (tag: string) => void;
  readonly className?: string;
}

export function TagInput({
  tags,
  placeholder = "Add tag…",
  onAddTag,
  onRemoveTag,
  className,
}: TagInputProps) {
  return (
    <div
      className={cn(
        "flex min-h-10 flex-wrap items-center gap-2 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-2 py-1.5",
        className,
      )}
    >
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-[var(--radius-md)] bg-[var(--color-primary-muted)] px-2 py-0.5 text-[length:var(--text-caption)] text-[var(--color-primary-text)]"
        >
          {tag}
          {onRemoveTag && (
            <button
              type="button"
              onClick={() => onRemoveTag(tag)}
              className="rounded-[var(--radius-sm)] p-0.5 motion-hover hover:bg-[var(--color-hover)]"
              aria-label={`Remove ${tag}`}
            >
              ×
            </button>
          )}
        </span>
      ))}
      <input
        type="text"
        placeholder={placeholder}
        className="min-w-24 flex-1 bg-transparent text-[length:var(--text-body-sm)] outline-none placeholder:text-[var(--color-muted)]"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            const value = e.currentTarget.value.trim();
            if (value) {
              onAddTag?.(value);
              e.currentTarget.value = "";
            }
          }
        }}
      />
    </div>
  );
}
