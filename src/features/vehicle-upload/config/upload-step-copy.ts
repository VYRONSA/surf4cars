import type { UploadStepId } from "@/features/vehicle-upload/types/upload.types";

export interface UploadStepCopy {
  readonly title: string;
  readonly description: string;
  readonly why: string;
}

export const UPLOAD_STEP_COPY: Record<UploadStepId, UploadStepCopy> = {
  media: {
    title: "Upload vehicle photos",
    description: "Drag and drop, upload from mobile, or capture directly from camera.",
    why: "Photo quality and coverage are core inputs for SURF Intelligence scoring and buyer trust.",
  },
  specifications: {
    title: "Upload licence disc",
    description: "Attach the licence disc image to prepare OCR extraction and validation.",
    why: "Licence disc data improves registration confidence and reduces manual typing errors.",
  },
  identification: {
    title: "AI vehicle identification",
    description: "Run identification pipeline for make, model, variant, year, colour, fuel, transmission, VIN, and engine size.",
    why: "All future AI enrichments depend on accurate identification metadata at listing creation time.",
  },
  features: {
    title: "SURF Intelligence review",
    description: "Run listing quality review, missing information checks, and improvement recommendations.",
    why: "This step ensures every listing meets quality standards before description and pricing workflows.",
  },
  description: {
    title: "Description builder",
    description: "Prepare title, description, highlights, and SEO fields via SURF Intelligence provider interfaces.",
    why: "Strong copy quality improves search performance and listing conversion without extra dealer effort.",
  },
  pricing: {
    title: "Pricing workspace",
    description: "Review recommended price, confidence state, and market position from Pricing Intelligence.",
    why: "Pricing decisions are most effective when informed by live demand, supply, and stock-turn signals.",
  },
  review: {
    title: "Review and publish",
    description: "Validate final data and publish directly into Inventory Intelligence.",
    why: "This is the final quality gate before your listing becomes operational in dealer inventory workflows.",
  },
};
