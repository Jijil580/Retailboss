import { Schema, model, models } from "mongoose";

const SupplierSchema = new Schema(
  {
    shopId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    contactPerson: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, lowercase: true, default: "" },
    gstNumber: { type: String, trim: true, uppercase: true, default: "" },
    address: { type: String, trim: true, default: "" },
    city: { type: String, trim: true, default: "" },
    state: { type: String, trim: true, default: "" },
    pincode: { type: String, trim: true, default: "" },
    openingBalance: { type: Number, min: 0, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

SupplierSchema.index({ shopId: 1, name: 1 });
SupplierSchema.index({ shopId: 1, phone: 1 });

export const Supplier = models.Supplier ?? model("Supplier", SupplierSchema);
