import { Schema, model, models } from "mongoose";

const VariationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, trim: true },
    barcode: { type: String, trim: true },
    attributes: { type: Map, of: String, default: {} },
    stock: { type: Number, default: 0, min: 0 },
    purchasePrice: { type: Number, default: 0, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
  },
  { _id: true },
);

const ProductSchema = new Schema(
  {
    shopId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, trim: true },
    barcode: { type: String, trim: true },
    category: { type: String, trim: true },
    brand: { type: String, trim: true },
    supplierId: { type: Schema.Types.ObjectId, ref: "Supplier" },
    purchasePrice: { type: Number, default: 0, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    wholesalePrice: { type: Number, default: 0, min: 0 },
    taxPercent: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    unit: { type: String, default: "pcs" },
    currentStock: { type: Number, default: 0, min: 0 },
    minimumStock: { type: Number, default: 0, min: 0 },
    imageUrl: { type: String },
    description: { type: String },
    active: { type: Boolean, default: true },
    variations: { type: [VariationSchema], default: [] },
  },
  { timestamps: true },
);

ProductSchema.index({ shopId: 1, sku: 1 }, { unique: true });
ProductSchema.index({ shopId: 1, barcode: 1 }, { sparse: true });
ProductSchema.index({ shopId: 1, name: "text" });

export const Product = models.Product ?? model("Product", ProductSchema);
