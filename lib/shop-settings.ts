export const DEFAULT_SHOP_SETTINGS = {
  brandName: "Shape of You",
  legalName: "Shape of You",
  address: "",
  city: "Iritty, Kannur",
  state: "Kerala",
  pincode: "",
  phone: "",
  email: "",
  gstNumber: "",
  gstEnabled: false,
  billPrefix: "SOY",
  defaultTaxPercent: 5,
  invoiceFooter: "Thank you for shopping with Shape of You.",
};

export type ShopSettingsSnapshot = typeof DEFAULT_SHOP_SETTINGS;

export function cleanShopSettings(
  input: Record<string, unknown>,
): ShopSettingsSnapshot {
  const text = (key: keyof ShopSettingsSnapshot, max = 160) =>
    String(input[key] ?? DEFAULT_SHOP_SETTINGS[key]).trim().slice(0, max);
  const defaultTaxPercent = Math.min(
    100,
    Math.max(0, Number(input.defaultTaxPercent ?? 5) || 0),
  );

  return {
    brandName: "Shape of You",
    legalName: text("legalName", 120) || "Shape of You",
    address: text("address", 240),
    city: text("city", 80),
    state: text("state", 80),
    pincode: text("pincode", 12),
    phone: text("phone", 24),
    email: text("email", 120).toLowerCase(),
    gstNumber: text("gstNumber", 15).toUpperCase(),
    gstEnabled: Boolean(input.gstEnabled),
    billPrefix:
      text("billPrefix", 10)
        .toUpperCase()
        .replace(/[^A-Z0-9-]/g, "") || "SOY",
    defaultTaxPercent,
    invoiceFooter: text("invoiceFooter", 240),
  };
}
