import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import {
  CalendarCheck,
  GitCompare,
  Heart,
  MessageCircle,
  Phone,
  Share2,
} from "@/components/ui/icons/registry";
import { vehiclePolish } from "@/features/vehicle/config/vehicle-shared";
import { cn } from "@/utils";

export interface VehicleDetailActionsProps {
  readonly className?: string;
}

export function VehicleDetailActions({ className }: VehicleDetailActionsProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="grid gap-2.5 sm:grid-cols-2">
        <Button variant="primary" size="lg" disabled className={vehiclePolish.actionPrimary}>
          Contact Dealer
        </Button>
        <Button variant="outline" size="lg" disabled className={vehiclePolish.actionPrimary}>
          <Icon icon={Phone} size="sm" aria-hidden />
          Call Dealer
        </Button>
        <Button variant="outline" size="lg" disabled className={vehiclePolish.actionPrimary}>
          <Icon icon={MessageCircle} size="sm" aria-hidden />
          WhatsApp Dealer
        </Button>
        <Button variant="outline" size="lg" disabled className={vehiclePolish.actionPrimary}>
          <Icon icon={CalendarCheck} size="sm" aria-hidden />
          Book Test Drive
        </Button>
      </div>

      <Button variant="secondary" size="lg" disabled className="h-12 w-full">
        Reserve Vehicle
      </Button>

      <div className="flex flex-wrap gap-2">
        <Button variant="ghost" size="md" disabled className="flex-1 min-w-[120px]">
          <Icon icon={Heart} size="sm" tone="muted" aria-hidden />
          Save Vehicle
        </Button>
        <Button variant="ghost" size="md" disabled className="flex-1 min-w-[120px]">
          <Icon icon={GitCompare} size="sm" tone="muted" aria-hidden />
          Compare
        </Button>
        <Button variant="ghost" size="md" disabled className="flex-1 min-w-[120px]">
          <Icon icon={Share2} size="sm" tone="muted" aria-hidden />
          Share
        </Button>
      </div>
    </div>
  );
}
