import { Schema, model, models } from "mongoose";

const SaleItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    variationId: { type: Schema.Types.ObjectId },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const SaleSchema = new Schema(
  {
    shopId: { type: String, required: true, index: true },
    invoiceNumber: { type: String, required: true },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer" },
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

export const Sale = models.Sale ?? model("Sale", SaleSchema);
