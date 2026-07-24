import { Schema, model, models } from "mongoose";

const PurchaseItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    sku: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitCost: { type: Number, required: true, min: 0 },
    taxPercent: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const SupplierSnapshotSchema = new Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, default: "" },
    gstNumber: { type: String, default: "" },
  },
  { _id: false },
);

const PaymentSchema = new Schema(
  {
    amount: { type: Number, required: true, min: 0.01 },
    mode: {
      type: String,
      enum: ["cash", "upi", "card", "bank", "credit"],
      required: true,
    },
    paidAt: { type: Date, default: Date.now },
    recordedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { _id: false },
);

const PurchaseSchema = new Schema(
  {
    shopId: { type: String, required: true, index: true },
    purchaseNumber: { type: String, required: true },
    supplierBillNumber: { type: String, trim: true, default: "" },
    supplierId: { type: Schema.Types.ObjectId, ref: "Supplier", required: true },
    supplier: { type: SupplierSnapshotSchema, required: true },
    purchaseDate: { type: Date, required: true, default: Date.now },
    items: { type: [PurchaseItemSchema], required: true },
    subtotal: { type: Number, required: true, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    paid: { type: Number, required: true, min: 0 },
    pending: { type: Number, required: true, min: 0 },
    paymentMode: {
      type: String,
      enum: ["cash", "upi", "card", "bank", "credit"],
      required: true,
    },
    payments: { type: [PaymentSchema], default: [] },
    status: {
      type: String,
      enum: ["paid", "partial", "credit", "cancelled"],
      required: true,
    },
    notes: { type: String, trim: true, default: "" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

PurchaseSchema.index({ shopId: 1, purchaseNumber: 1 }, { unique: true });
PurchaseSchema.index({ shopId: 1, purchaseDate: -1 });
PurchaseSchema.index({ shopId: 1, supplierId: 1 });

export const Purchase = models.Purchase ?? model("Purchase", PurchaseSchema);
