import { Icon } from "@/components/ui/icons";
import { AlertCircle } from "@/components/ui/icons/registry";
import { uploadPolish } from "@/features/vehicle-upload/config/upload-shared";
import { cn } from "@/utils";

export interface UploadValidationBannerProps {
  readonly message: string | null;
  readonly className?: string;
}

export function UploadValidationBanner({ message, className }: UploadValidationBannerProps) {
  if (!message) return null;

  return (
    <div
      className={cn(uploadPolish.validationBanner, "flex items-start gap-2", className)}
      role="alert"
      aria-live="assertive"
    >
      <Icon icon={AlertCircle} size="sm" className="mt-0.5 shrink-0" aria-hidden />
      <span>{message}</span>
    </div>
  );
}
