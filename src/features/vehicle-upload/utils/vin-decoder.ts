import type { UploadIdentificationData } from "@/features/vehicle-upload/types/upload.types";

/** Result from a future VIN decode API integration. */
export interface VinDecodeResult {
  readonly success: boolean;
  readonly make?: string;
  readonly model?: string;
  readonly variant?: string;
  readonly year?: string;
  readonly bodyType?: string;
  readonly engine?: string;
  readonly fuel?: string;
  readonly transmission?: string;
  readonly message?: string;
}

export interface VinDecoderService {
  decode(vin: string): Promise<VinDecodeResult>;
}

/**
 * Placeholder VIN decoder — architecture ready for API integration.
 * Returns partial data for known demo VIN prefixes only.
 */
export class PlaceholderVinDecoder implements VinDecoderService {
  async decode(vin: string): Promise<VinDecodeResult> {
    const normalized = vin.trim().toUpperCase();
    if (normalized.length < 11) {
      return { success: false, message: "VIN must be at least 11 characters." };
    }

    if (normalized.startsWith("WBA")) {
      return {
        success: true,
        make: "BMW",
        model: "X5",
        variant: "xDrive40i",
        year: "2024",
        bodyType: "SUV",
        engine: "3.0L Turbo Inline-6",
        fuel: "Petrol",
        transmission: "Automatic",
        message: "VIN decoded (demo). Full API integration coming soon.",
      };
    }

    if (normalized.startsWith("WDC")) {
      return {
        success: true,
        make: "Mercedes-Benz",
        model: "GLC",
        variant: "300d 4MATIC",
        year: "2023",
        bodyType: "SUV",
        fuel: "Diesel",
        transmission: "Automatic",
        message: "VIN decoded (demo). Full API integration coming soon.",
      };
    }

    return {
      success: false,
      message: "VIN decode service not connected. Enter details manually.",
    };
  }
}

export function applyVinDecodeToIdentification(
  current: UploadIdentificationData,
  result: VinDecodeResult,
): UploadIdentificationData {
  if (!result.success) return current;
  return {
    ...current,
    make: result.make ?? current.make,
    model: result.model ?? current.model,
    variant: result.variant ?? current.variant,
    year: result.year ?? current.year,
  };
}

export const vinDecoder = new PlaceholderVinDecoder();
