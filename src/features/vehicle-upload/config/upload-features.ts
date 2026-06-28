export interface UploadFeatureOption {
  readonly id: string;
  readonly label: string;
  readonly icon: string;
  readonly category: string;
}

export const UPLOAD_FEATURE_OPTIONS: readonly UploadFeatureOption[] = [
  { id: "leather", label: "Leather", icon: "Armchair", category: "Interior" },
  { id: "sunroof", label: "Sunroof", icon: "Sun", category: "Comfort" },
  { id: "navigation", label: "Navigation", icon: "MapPin", category: "Technology" },
  { id: "carplay", label: "Apple CarPlay", icon: "Smartphone", category: "Technology" },
  { id: "android", label: "Android Auto", icon: "Smartphone", category: "Technology" },
  { id: "reverse-cam", label: "Reverse Camera", icon: "Eye", category: "Safety" },
  { id: "360-cam", label: "360 Camera", icon: "Layers", category: "Safety" },
  { id: "cruise", label: "Adaptive Cruise", icon: "Gauge", category: "Safety" },
  { id: "tow-bar", label: "Tow Bar", icon: "Truck", category: "Utility" },
  { id: "roof-rails", label: "Roof Rails", icon: "Layers", category: "Exterior" },
  { id: "wireless-charging", label: "Wireless Charging", icon: "Zap", category: "Technology" },
  { id: "keyless", label: "Keyless Entry", icon: "Key", category: "Convenience" },
  { id: "heated-seats", label: "Heated Seats", icon: "Sun", category: "Comfort" },
  { id: "climate", label: "Climate Control", icon: "SlidersHorizontal", category: "Comfort" },
  { id: "lane", label: "Lane Assist", icon: "Target", category: "Safety" },
  { id: "blind-spot", label: "Blind Spot", icon: "Shield", category: "Safety" },
  { id: "panoramic-roof", label: "Panoramic Roof", icon: "Sun", category: "Comfort" },
  { id: "premium-sound", label: "Premium Sound", icon: "Megaphone", category: "Technology" },
  { id: "parking-sensors", label: "Parking Sensors", icon: "Target", category: "Safety" },
  { id: "led-headlights", label: "LED Headlights", icon: "Lightbulb", category: "Exterior" },
] as const;
