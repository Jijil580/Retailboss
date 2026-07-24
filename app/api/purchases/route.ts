import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { getSession } from "@/lib/auth";
import { connectMongo } from "@/lib/mongodb";
import { Product } from "@/models/Product";
import { Purchase } from "@/models/Purchase";
import { Supplier } from "@/models/Supplier";

export const dynamic = "force-dynamic";

async function requirePurchaseUser() {
  const session = await getSession();
  if (!session) return null;
  return session.role === "admin" || session.permissions.includes("manage_suppliers")
    ? session
    : null;
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export async function GET(request: NextRequest) {
  const session = await requirePurchaseUser();
  if (!session) {
    return NextResponse.json({ error: "Purchase access required" }, { status: 403 });
  }
  await connectMongo();
  const filter: Record<string, unknown> = { shopId: session.shopId };
  const query = request.nextUrl.searchParams.get("q")?.trim();
  const supplierId = request.nextUrl.searchParams.get("supplierId");
  const month = request.nextUrl.searchParams.get("month");
  const from = request.nextUrl.searchParams.get("from");
  const to = request.nextUrl.searchParams.get("to");
  if (query) {
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { purchaseNumber: { $regex: escaped, $options: "i" } },
      { supplierBillNumber: { $regex: escaped, $options: "i" } },
      { "supplier.name": { $regex: escaped, $options: "i" } },
      { "items.name": { $regex: escaped, $options: "i" } },
      { "items.sku": { $regex: escaped, $options: "i" } },
    ];
  }
  if (supplierId && Types.ObjectId.isValid(supplierId)) {
    filter.supplierId = new Types.ObjectId(supplierId);
  }
  let start = from ? new Date(`${from}T00:00:00`) : null;
  let end = to ? new Date(`${to}T23:59:59.999`) : null;
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [year, monthNumber] = month.split("-").map(Number);
    start = new Date(year, monthNumber - 1, 1);
    end = new Date(year, monthNumber, 0, 23, 59, 59, 999);
  }
  if (start || end) {
    filter.purchaseDate = {
      ...(start && !Number.isNaN(start.getTime()) ? { $gte: start } : {}),
      ...(end && !Number.isNaN(end.getTime()) ? { $lte: end } : {}),
    };
  }
  const purchases = await Purchase.find(filter)
    .sort({ purchaseDate: -1, createdAt: -1 })
    .limit(1000)
    .lean();
  return NextResponse.json({ purchases });
}

export async function POST(request: NextRequest) {
  const user = await requirePurchaseUser();
  if (!user) {
    return NextResponse.json({ error: "Purchase access required" }, { status: 403 });
  }
  const body = (await request.json()) as Record<string, unknown>;
  const supplierId = String(body.supplierId ?? "");
  const requestedItems = Array.isArray(body.items) ? body.items : [];
  const paymentMode = ["cash", "upi", "card", "bank", "credit"].includes(
    String(body.paymentMode),
  )
    ? String(body.paymentMode)
    : "cash";
  if (!Types.ObjectId.isValid(supplierId) || requestedItems.length === 0) {
    return NextResponse.json(
      { error: "Choose a supplier and add at least one product" },
      { status: 400 },
    );
  }

  const connection = await connectMongo();
  const transaction = await connection.startSession();
  try {
    let createdPurchase: unknown;
    await transaction.withTransaction(async () => {
      const supplier = await Supplier.findOne({
        _id: supplierId,
        shopId: user.shopId,
        active: true,
      }).session(transaction);
      if (!supplier) throw new Error("SUPPLIER_NOT_FOUND");

      const ids = requestedItems.map((item: Record<string, unknown>) =>
        String(item.productId ?? ""),
      );
      if (ids.some((id: string) => !Types.ObjectId.isValid(id))) {
        throw new Error("PRODUCT_NOT_FOUND");
      }
      const products = await Product.find({
        _id: { $in: ids },
        shopId: user.shopId,
        active: true,
      }).session(transaction);
      const productMap = new Map(products.map((product) => [String(product._id), product]));
      const items = requestedItems.map((requested: Record<string, unknown>) => {
        const product = productMap.get(String(requested.productId ?? ""));
        if (!product) throw new Error("PRODUCT_NOT_FOUND");
        const quantity = Math.max(1, Math.floor(Number(requested.quantity) || 0));
        const unitCost = Math.max(0, Number(requested.unitCost) || 0);
        const taxPercent = Math.min(100, Math.max(0, Number(requested.taxPercent) || 0));
        if (unitCost <= 0) throw new Error("INVALID_COST");
        const base = roundMoney(quantity * unitCost);
        const tax = roundMoney((base * taxPercent) / 100);
        return {
          productId: product._id,
          name: product.name,
          sku: product.sku,
          quantity,
          unitCost,
          taxPercent,
          tax,
          total: roundMoney(base + tax),
        };
      });

      for (const item of items) {
        await Product.updateOne(
          { _id: item.productId, shopId: user.shopId },
          {
            $inc: { currentStock: item.quantity },
            $set: { purchasePrice: item.unitCost },
          },
          { session: transaction },
        );
      }

      const subtotal = roundMoney(
        items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0),
      );
      const tax = roundMoney(items.reduce((sum, item) => sum + item.tax, 0));
      const total = roundMoney(subtotal + tax);
      const requestedPaid = Math.max(0, Number(body.paid) || 0);
      const paid = roundMoney(Math.min(total, requestedPaid));
      const pending = roundMoney(total - paid);
      const status = pending === 0 ? "paid" : paid > 0 ? "partial" : "credit";
      const purchaseDate = body.purchaseDate
        ? new Date(String(body.purchaseDate))
        : new Date();
      const purchaseNumber = `PUR-${Date.now().toString().slice(-9)}`;
      const records = await Purchase.create(
        [
          {
            shopId: user.shopId,
            purchaseNumber,
            supplierBillNumber: String(body.supplierBillNumber ?? "").trim().slice(0, 80),
            supplierId: supplier._id,
            supplier: {
              name: supplier.name,
              phone: supplier.phone,
              gstNumber: supplier.gstNumber,
            },
            purchaseDate:
              Number.isNaN(purchaseDate.getTime()) ? new Date() : purchaseDate,
            items,
            subtotal,
            tax,
            total,
            paid,
            pending,
            paymentMode,
            payments:
              paid > 0
                ? [
                    {
                      amount: paid,
                      mode: paymentMode,
                      paidAt: new Date(),
                      recordedBy: new Types.ObjectId(user.id),
                    },
                  ]
                : [],
            status,
            notes: String(body.notes ?? "").trim().slice(0, 500),
            createdBy: new Types.ObjectId(user.id),
          },
        ],
        { session: transaction },
      );
      createdPurchase = records[0].toObject();
    });
    return NextResponse.json({ purchase: createdPurchase }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "SUPPLIER_NOT_FOUND") {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
    }
    if (message === "PRODUCT_NOT_FOUND") {
      return NextResponse.json({ error: "A selected product is unavailable" }, { status: 404 });
    }
    if (message === "INVALID_COST") {
      return NextResponse.json(
        { error: "Every purchase item needs a cost greater than zero" },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Unable to save purchase" }, { status: 503 });
  } finally {
    await transaction.endSession();
  }
}

export async function PATCH(request: NextRequest) {
  const user = await requirePurchaseUser();
  if (!user) {
    return NextResponse.json({ error: "Purchase access required" }, { status: 403 });
  }
  const body = (await request.json()) as Record<string, unknown>;
  const id = String(body.id ?? "");
  const amount = roundMoney(Math.max(0, Number(body.amount) || 0));
  const mode = ["cash", "upi", "card", "bank"].includes(String(body.mode))
    ? String(body.mode)
    : "cash";
  if (!Types.ObjectId.isValid(id) || amount <= 0) {
    return NextResponse.json({ error: "Enter a valid payment amount" }, { status: 400 });
  }
  await connectMongo();
  const purchase = await Purchase.findOne({ _id: id, shopId: user.shopId });
  if (!purchase) return NextResponse.json({ error: "Purchase not found" }, { status: 404 });
  if (purchase.status === "cancelled" || purchase.pending <= 0) {
    return NextResponse.json({ error: "This purchase has no pending balance" }, { status: 409 });
  }
  const payment = Math.min(amount, Number(purchase.pending));
  purchase.paid = roundMoney(Number(purchase.paid) + payment);
  purchase.pending = roundMoney(Number(purchase.total) - Number(purchase.paid));
  purchase.status = purchase.pending === 0 ? "paid" : "partial";
  purchase.payments.push({
    amount: payment,
    mode,
    paidAt: new Date(),
    recordedBy: new Types.ObjectId(user.id),
  });
  await purchase.save();
  return NextResponse.json({ purchase });
}
