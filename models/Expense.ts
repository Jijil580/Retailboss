import { Schema, model, models } from "mongoose";

const ExpenseSchema = new Schema(
  {
    shopId: { type: String, required: true, index: true },
    expenseNumber: { type: String, required: true },
    expenseDate: { type: Date, required: true, default: Date.now },
    category: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0.01 },
    paidTo: { type: String, required: true, trim: true },
    paymentMode: {
      type: String,
      enum: ["cash", "upi", "card", "bank"],
      required: true,
    },
    referenceNumber: { type: String, trim: true, default: "" },
    description: { type: String, required: true, trim: true },
    notes: { type: String, trim: true, default: "" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    createdByName: { type: String, required: true },
  },
  { timestamps: true },
);

ExpenseSchema.index({ shopId: 1, expenseNumber: 1 }, { unique: true });
ExpenseSchema.index({ shopId: 1, expenseDate: -1 });
ExpenseSchema.index({ shopId: 1, createdBy: 1, expenseDate: -1 });

export const Expense = models.Expense ?? model("Expense", ExpenseSchema);
