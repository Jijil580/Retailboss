import { Schema, model, models } from "mongoose";

export const USER_PERMISSIONS = [
  "create_sales",
  "manage_products",
  "view_inventory",
  "manage_customers",
  "manage_suppliers",
  "add_expenses",
  "view_reports",
] as const;

const UserSchema = new Schema(
  {
    shopId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ["admin", "staff"], default: "staff" },
    permissions: {
      type: [{ type: String, enum: USER_PERMISSIONS }],
      default: [],
    },
    active: { type: Boolean, default: true },
    bootstrapVersion: { type: String, default: "" },
    lastLoginAt: { type: Date },
  },
  { timestamps: true },
);

UserSchema.index({ shopId: 1, email: 1 }, { unique: true });

export const User = models.User ?? model("User", UserSchema);
