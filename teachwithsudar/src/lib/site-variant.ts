/** Build-time site mode: gateway (thesudar.com) vs marketing (teachwithsudar.com). */
export type SiteVariant = "gateway" | "marketing";

export const SITE_VARIANT: SiteVariant =
  process.env.NEXT_PUBLIC_SITE_VARIANT === "gateway" ? "gateway" : "marketing";

export const IS_GATEWAY_SITE = SITE_VARIANT === "gateway";

export const SITE_URL = IS_GATEWAY_SITE
  ? "https://thesudar.com"
  : "https://teachwithsudar.com";
