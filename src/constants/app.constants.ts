export const APP_NAME = "SURF FOR CARS" as const;
export const APP_DESCRIPTION =
  "AI-powered dealership growth and automotive marketing platform" as const;
export const APP_VERSION = "0.1.0" as const;

export const APP_METADATA = {
  name: APP_NAME,
  description: APP_DESCRIPTION,
  version: APP_VERSION,
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3003",
} as const;
