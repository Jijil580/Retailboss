import { Schema, model, models } from "mongoose";

const SaleItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    variationId: { type: Schema.Types.ObjectId },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    taxPercent: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const SellerSnapshotSchema = new Schema(
  {
    brandName: { type: String, required: true },
    legalName: { type: String, default: "" },
    address: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    pincode: { type: String, default: "" },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    gstNumber: { type: String, default: "" },
    gstEnabled: { type: Boolean, default: false },
    invoiceFooter: { type: String, default: "" },
  },
  { _id: false },
);

const CustomerSnapshotSchema = new Schema(
  {
    name: { type: String, trim: true, default: "Walk-in customer" },
    mobile: { type: String, trim: true, default: "" },
  },
  { _id: false },
);

const SaleSchema = new Schema(
  {
    shopId: { type: String, required: true, index: true },
    invoiceNumber: { type: String, required: true },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer" },
    customer: { type: CustomerSnapshotSchema, default: () => ({}) },
    items: { type: [SaleItemSchema], required: true },
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    paid: { type: Number, required: true, min: 0 },
    pending: { type: Number, default: 0, min: 0 },
    paymentMode: {
      type: String,
      enum: ["cash", "upi", "card", "bank", "credit"],
      required: true,
    },
    seller: { type: SellerSnapshotSchema, required: true },
    status: {
      type: String,
      enum: ["paid", "partial", "credit", "cancelled", "returned"],
      default: "paid",
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

SaleSchema.index({ shopId: 1, invoiceNumber: 1 }, { unique: true });
SaleSchema.index({ shopId: 1, createdAt: -1 });
SaleSchema.index({ shopId: 1, "customer.mobile": 1 });

export const Sale = models.Sale ?? model("Sale", SaleSchema);
