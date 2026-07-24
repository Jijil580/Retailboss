import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { getSession } from "@/lib/auth";
import { connectMongo } from "@/lib/mongodb";
import { Product } from "@/models/Product";
import { Sale } from "@/models/Sale";
import { ShopSettings } from "@/models/ShopSettings";
import {
  cleanShopSettings,
  DEFAULT_SHOP_SETTINGS,
} from "@/lib/shop-settings";

export const dynamic = "force-dynamic";

type ComputedSaleItem = {
  productId: Types.ObjectId;
  name: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxPercent: number;
  tax: number;
  total: number;
};

async function requireSalesUser() {
  const session = await getSession();
  if (!session) return null;
  return session.role === "admin" || session.permissions.includes("create_sales") ? session : null;
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  await connectMongo();
  const id = request.nextUrl.searchParams.get("id");
  if (id) {
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }
    const sale = await Sale.findOne({ _id: id, shopId: session.shopId }).lean();
    if (!sale) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    return NextResponse.json({ sale });
  }
  const query = request.nextUrl.searchParams.get("q")?.trim();
  const from = request.nextUrl.searchParams.get("from");
  const to = request.nextUrl.searchParams.get("to");
  const month = request.nextUrl.searchParams.get("month");
  const limit = Math.min(
    1000,
    Math.max(1, Number(request.nextUrl.searchParams.get("limit")) || 500),
  );
  const filters: Record<string, unknown>[] = [];
  if (query) {
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = new RegExp(escaped, "i");
    filters.push({
      $or: [
        { invoiceNumber: match },
        { "items.name": match },
        { "customer.name": match },
        { "customer.mobile": match },
      ],
    });
  }
  let startDate = from ? new Date(`${from}T00:00:00`) : null;
  let endDate = to ? new Date(`${to}T23:59:59.999`) : null;
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [year, monthNumber] = month.split("-").map(Number);
    startDate = new Date(year, monthNumber - 1, 1);
    endDate = new Date(year, monthNumber, 0, 23, 59, 59, 999);
  }
  if (startDate && !Number.isNaN(startDate.getTime())) {
    filters.push({ createdAt: { $gte: startDate } });
  }
  if (endDate && !Number.isNaN(endDate.getTime())) {
    filters.push({ createdAt: { $lte: endDate } });
  }
  const sales = await Sale.find({
    shopId: session.shopId,
    ...(filters.length ? { $and: filters } : {}),
  })
    .sort({ createdAt: -1 })
    .limit(limit)
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
  const customerName = String(body.customerName ?? "").trim().slice(0, 100);
  const customerMobile = String(body.customerMobile ?? "")
    .replace(/[^\d+]/g, "")
    .slice(0, 16);
  if (requestedItems.length === 0) {
    return NextResponse.json({ error: "Add at least one product" }, { status: 400 });
  }

  const connection = await connectMongo();
  const transaction = await connection.startSession();

  try {
    let createdSale: unknown;
    await transaction.withTransaction(async () => {
      const storedSettings = await ShopSettings.findOne({ shopId: user.shopId })
        .session(transaction)
        .lean();
      const settings = storedSettings
        ? cleanShopSettings(storedSettings as unknown as Record<string, unknown>)
        : DEFAULT_SHOP_SETTINGS;
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
        const lineSubtotal = roundMoney(unitPrice * quantity);
        const taxPercent = settings.gstEnabled
          ? Number(product.taxPercent) || settings.defaultTaxPercent
          : 0;
        const tax = roundMoney((lineSubtotal * taxPercent) / 100);
        const total = roundMoney(lineSubtotal + tax);
        return {
          productId: product._id,
          name: product.name,
          quantity,
          unitPrice,
          discount: 0,
          taxPercent,
          tax,
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

      const subtotal = roundMoney(
        items.reduce(
          (sum: number, item: ComputedSaleItem) =>
            sum + item.unitPrice * item.quantity - item.discount,
          0,
        ),
      );
      const tax = roundMoney(
        items.reduce((sum: number, item: ComputedSaleItem) => sum + item.tax, 0),
      );
      const total = roundMoney(subtotal + tax);
      const paid = paymentMode === "credit" ? 0 : total;
      const invoiceNumber = `${settings.billPrefix}-${Date.now().toString().slice(-9)}`;
      const records = await Sale.create(
        [
          {
            shopId: user.shopId,
            invoiceNumber,
            customer: {
              name: customerName || "Walk-in customer",
              mobile: customerMobile,
            },
            items,
            subtotal,
            discount: 0,
            tax,
            total,
            paid,
            pending: total - paid,
            paymentMode,
            status: paymentMode === "credit" ? "credit" : "paid",
            seller: {
              brandName: settings.brandName,
              legalName: settings.legalName,
              address: settings.address,
              city: settings.city,
              state: settings.state,
              pincode: settings.pincode,
              phone: settings.phone,
              email: settings.email,
              gstNumber: settings.gstNumber,
              gstEnabled: settings.gstEnabled,
              invoiceFooter: settings.invoiceFooter,
            },
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
