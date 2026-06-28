import type { UploadFormData } from "@/features/vehicle-upload/types/upload.types";

export interface UploadAiInsight {
  readonly id: string;
  readonly message: string;
  readonly action: string;
  readonly tone: "info" | "warning" | "success";
}

export function deriveUploadAiInsights(data: UploadFormData): readonly UploadAiInsight[] {
  const insights: UploadAiInsight[] = [];

  if (data.media.length < 10) {
    insights.push({
      id: "photos",
      message: "Add at least 10 photos for maximum buyer engagement.",
      action: "Upload more in Media step",
      tone: "warning",
    });
  }

  if (data.description.length < 120) {
    insights.push({
      id: "description",
      message: "This description is too short. Aim for 200+ characters.",
      action: "Expand your vehicle story",
      tone: "warning",
    });
  }

  if (!data.selectedFeatures.includes("leather")) {
    insights.push({
      id: "leather",
      message: "Leather seats not selected — buyers often filter for this.",
      action: "Review Features checklist",
      tone: "info",
    });
  }

  insights.push({
    id: "service-history",
    message: "Vehicles with service history receive more enquiries.",
    action: "Mention history in description",
    tone: "success",
  });

  if (data.pricing.sellingPrice && data.pricing.purchasePrice) {
    const selling = Number(data.pricing.sellingPrice.replace(/[^\d]/g, ""));
    const purchase = Number(data.pricing.purchasePrice.replace(/[^\d]/g, ""));
    if (selling > 0 && purchase > 0 && selling - purchase < selling * 0.05) {
      insights.push({
        id: "margin",
        message: "Profit margin is tight — consider reviewing your selling price.",
        action: "Adjust pricing strategy",
        tone: "info",
      });
    }
  }

  return insights.slice(0, 4);
}
