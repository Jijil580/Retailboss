import { Schema, model, models } from "mongoose";

const ShopSettingsSchema = new Schema(
  {
    shopId: { type: String, required: true, unique: true, index: true },
    brandName: { type: String, required: true, trim: true, default: "Shape of You" },
    legalName: { type: String, trim: true, default: "Shape of You" },
    address: { type: String, trim: true, default: "" },
    city: { type: String, trim: true, default: "" },
    state: { type: String, trim: true, default: "Kerala" },
    pincode: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, lowercase: true, default: "" },
    gstNumber: { type: String, trim: true, uppercase: true, default: "" },
    gstEnabled: { type: Boolean, default: false },
    billPrefix: { type: String, trim: true, uppercase: true, default: "SOY" },
    defaultTaxPercent: { type: Number, min: 0, max: 100, default: 5 },
    invoiceFooter: {
      type: String,
      trim: true,
      default: "Thank you for shopping with Shape of You.",
    },
  },
  { timestamps: true },
);

export const ShopSettings =
  models.ShopSettings ?? model("ShopSettings", ShopSettingsSchema);
