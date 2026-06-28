import type { LucideIcon } from "lucide-react";

import {
  Bike,
  Car,
  Gauge,
  Truck,
  Zap,
} from "@/components/ui/icons/registry";

export interface HomeCollectionCategory {
  readonly id: string;
  readonly label: string;
  readonly tagline: string;
  readonly description: string;
  readonly vehicleCount: string;
  readonly href: string;
  readonly icon: LucideIcon;
}

export const HOME_COLLECTION_CATEGORIES: readonly HomeCollectionCategory[] = [
  {
    id: "suvs",
    label: "SUVs",
    tagline: "Command every road",
    description: "Spacious, capable, and ready for any terrain.",
    vehicleCount: "2,400+",
    href: "/search?body=suv",
    icon: Car,
  },
  {
    id: "bakkies",
    label: "Bakkies",
    tagline: "Built for South Africa",
    description: "Workhorse utility with everyday comfort.",
    vehicleCount: "1,850+",
    href: "/search?body=bakkie",
    icon: Truck,
  },
  {
    id: "luxury",
    label: "Luxury",
    tagline: "Refined performance",
    description: "Prestige brands and executive specification.",
    vehicleCount: "640+",
    href: "/search?segment=luxury",
    icon: Car,
  },
  {
    id: "electric",
    label: "Electric",
    tagline: "Drive the future",
    description: "Zero-emission motoring with modern tech.",
    vehicleCount: "320+",
    href: "/search?fuel=electric",
    icon: Zap,
  },
  {
    id: "family",
    label: "Family",
    tagline: "Space for every journey",
    description: "Safety, comfort, and room for everyone.",
    vehicleCount: "1,120+",
    href: "/search?segment=family",
    icon: Car,
  },
  {
    id: "performance",
    label: "Performance",
    tagline: "Engineered to thrill",
    description: "Power, precision, and driver-focused dynamics.",
    vehicleCount: "480+",
    href: "/search?segment=performance",
    icon: Gauge,
  },
  {
    id: "commercial",
    label: "Commercial",
    tagline: "Power your business",
    description: "Fleet-ready vehicles for growing operations.",
    vehicleCount: "760+",
    href: "/search?body=commercial",
    icon: Truck,
  },
  {
    id: "motorcycles",
    label: "Motorcycles",
    tagline: "Freedom on two wheels",
    description: "Sport, adventure, and urban riders.",
    vehicleCount: "290+",
    href: "/search?type=motorcycle",
    icon: Bike,
  },
] as const;
