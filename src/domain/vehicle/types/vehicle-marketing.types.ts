export const MARKETING_CHANNELS = {
  GOOGLE_ADS: "google-ads",
  FACEBOOK: "facebook",
  INSTAGRAM: "instagram",
  WHATSAPP: "whatsapp",
  TIKTOK: "tiktok",
  EMAIL: "email",
  DEALER_WEBSITE: "dealer-website",
  MARKETPLACE: "marketplace",
} as const;

export type MarketingChannel = (typeof MARKETING_CHANNELS)[keyof typeof MARKETING_CHANNELS];

export interface VehicleMarketingChannelState {
  readonly channel: MarketingChannel;
  readonly enabled: boolean;
  readonly lastPublishedAt?: string;
  readonly campaignId?: string;
}

export interface VehicleMarketingData {
  readonly channels: readonly VehicleMarketingChannelState[];
  readonly seoTitle?: string;
  readonly seoDescription?: string;
  readonly socialCaption?: string;
  readonly featured: boolean;
  readonly boosted: boolean;
}
