import type { UploadStepId } from "@/features/vehicle-upload/types/upload.types";

export interface UploadStepCopy {
  readonly title: string;
  readonly description: string;
  readonly why: string;
}

export const UPLOAD_STEP_COPY: Record<UploadStepId, UploadStepCopy> = {
  identification: {
    title: "Let's identify your vehicle",
    description: "We'll use this information throughout SURF4CARS — one record powers every channel.",
    why: "Accurate identification prevents duplicate stock and enables VIN-based search across the marketplace.",
  },
  pricing: {
    title: "Set your pricing strategy",
    description: "Purchase and selling prices drive profit reporting, finance estimates, and AI market positioning.",
    why: "Dealers who set clear pricing see faster enquiries — buyers filter and compare on list price first.",
  },
  specifications: {
    title: "Complete the specifications",
    description: "Buyers expect mileage, fuel type, and drivetrain before they enquire — completeness builds trust.",
    why: "Listings with full specs rank higher in search and receive up to 34% more qualified leads.",
  },
  features: {
    title: "Highlight what makes it special",
    description: "Buyers filter by leather, sunroof, tow bar, and more. Select everything that applies.",
    why: "Feature-rich listings match more saved searches and appear in comparison tools automatically.",
  },
  media: {
    title: "Showcase your vehicle",
    description: "Professional photos are the single biggest driver of enquiries. Upload at least 10 images.",
    why: "Listings with 10+ photos receive 2.7× more views on the SURF marketplace.",
  },
  description: {
    title: "Tell the vehicle's story",
    description: "Describe condition, service history, and why this vehicle stands out in your stock.",
    why: "Detailed descriptions improve AI listing scores and help buyers decide before they call.",
  },
  publishing: {
    title: "Choose where it goes live",
    description: "Publish to the marketplace, your dealer website, or save as draft until you're ready.",
    why: "One publish action syndicates your listing across every SURF4CARS channel you've enabled.",
  },
  review: {
    title: "Review before you publish",
    description: "This is exactly how buyers will see your vehicle. Edit any section with one click.",
    why: "A final review catches missing photos or pricing errors before they cost you enquiries.",
  },
};
