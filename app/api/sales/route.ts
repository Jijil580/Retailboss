import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { getSession } from "@/lib/auth";
import { connectMongo } from "@/lib/mongodb";
import { Product } from "@/models/Product";
import { Sale } from "@/models/Sale";

export const dynamic = "force-dynamic";

type ComputedSaleItem = {
  productId: Types.ObjectId;
  name: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  total: number;
};

async function requireSalesUser() {
  const session = await getSession();
  if (!session) return null;
  return session.role === "admin" || session.permissions.includes("create_sales") ? session : null;
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  await connectMongo();
  const sales = await Sale.find({ shopId: session.shopId })
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();
  return NextResponse.json({ sales });
}

export async function POST(request: NextRequest) {
  const user = await requireSalesUser();
  if (!user) return NextResponse.json({ error: "Sales access required" }, { status: 403 });

  const body = await request.json();
  const requestedItems = Array.isArray(body.items) ? body.items : [];
  const paymentMode = ["cash", "upi", "card", "bank", "credit"].includes(body.paymentMode)
    ? body.paymentMode
    : "cash";
  if (requestedItems.length === 0) {
    return NextResponse.json({ error: "Add at least one product" }, { status: 400 });
  }

  const connection = await connectMongo();
  const transaction = await connection.startSession();

  try {
    let createdSale: unknown;
    await transaction.withTransaction(async () => {
      const ids = requestedItems.map((item: { productId: string }) => item.productId);
      const products = await Product.find({
        _id: { $in: ids },
        shopId: user.shopId,
        active: true,
      }).session(transaction);

      const productMap = new Map(products.map((product) => [product._id.toString(), product]));
      const items: ComputedSaleItem[] = requestedItems.map((item: { productId: string; quantity: number }) => {
        const product = productMap.get(String(item.productId));
        const quantity = Math.max(1, Math.floor(Number(item.quantity)));
        if (!product) throw new Error("PRODUCT_NOT_FOUND");
        if (product.currentStock < quantity) throw new Error(`INSUFFICIENT_STOCK:${product.name}`);
        const unitPrice = Number(product.sellingPrice);
        const total = unitPrice * quantity;
        return {
          productId: product._id,
          name: product.name,
          quantity,
          unitPrice,
          discount: 0,
          tax: 0,
          total,
        };
      });

      for (const item of items) {
        const update = await Product.updateOne(
          {
            _id: item.productId,
            shopId: user.shopId,
            currentStock: { $gte: item.quantity },
          },
          { $inc: { currentStock: -item.quantity } },
          { session: transaction },
        );
        if (update.modifiedCount !== 1) throw new Error(`INSUFFICIENT_STOCK:${item.name}`);
      }

      const subtotal = items.reduce((sum: number, item: ComputedSaleItem) => sum + item.total, 0);
      const total = subtotal;
      const paid = paymentMode === "credit" ? 0 : total;
      const invoiceNumber = `INV-${Date.now().toString().slice(-9)}`;
      const records = await Sale.create(
        [
          {
            shopId: user.shopId,
            invoiceNumber,
            items,
            subtotal,
            discount: 0,
            tax: 0,
            total,
            paid,
            pending: total - paid,
            paymentMode,
            status: paymentMode === "credit" ? "credit" : "paid",
            createdBy: new Types.ObjectId(user.id),
          },
        ],
        { session: transaction },
      );
      createdSale = records[0].toObject();
    });
    return NextResponse.json({ sale: createdSale }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.startsWith("INSUFFICIENT_STOCK:")) {
      return NextResponse.json(
        { error: `Not enough stock for ${message.split(":")[1]}` },
        { status: 409 },
      );
    }
    if (message === "PRODUCT_NOT_FOUND") {
      return NextResponse.json({ error: "A selected product is unavailable" }, { status: 404 });
    }
    return NextResponse.json({ error: "Unable to complete sale" }, { status: 503 });
  } finally {
    await transaction.endSession();
  }
}
