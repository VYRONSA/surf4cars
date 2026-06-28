import type { BusinessType } from "@/features/dealer-onboarding/types/onboarding.types";

export const BUSINESS_TYPES: readonly { id: BusinessType; label: string }[] = [
  { id: "independent", label: "Independent" },
  { id: "franchise", label: "Franchise" },
  { id: "motorcycle", label: "Motorcycle" },
  { id: "commercial", label: "Commercial" },
  { id: "luxury", label: "Luxury" },
] as const;

export const SA_PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "Northern Cape",
  "North West",
  "Western Cape",
] as const;

export const SUBSCRIPTION_PACKAGES = [
  {
    id: "starter" as const,
    name: "Starter",
    description: "Essential tools to establish your premium presence.",
    highlights: [
      "Dealership profile",
      "Inventory management",
      "Basic marketing tools",
    ],
  },
  {
    id: "growth" as const,
    name: "Growth",
    description: "Everything you need to scale marketing and leads.",
    highlights: [
      "Everything in Starter",
      "Marketing Studio",
      "Lead management",
      "Analytics dashboard",
    ],
    recommended: true,
  },
  {
    id: "enterprise" as const,
    name: "Enterprise",
    description: "Full platform access for ambitious dealership groups.",
    highlights: [
      "Everything in Growth",
      "Multi-branch support",
      "AI Studio",
      "Priority support",
    ],
  },
] as const;

export { ONBOARDING_STEPS } from "@/features/dealer-onboarding/types/onboarding.types";
