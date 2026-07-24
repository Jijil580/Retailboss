import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectMongo } from "@/lib/mongodb";
import { Product } from "@/models/Product";

export const dynamic = "force-dynamic";

async function requireUser(permission?: string) {
  const session = await getSession();
  if (!session) return null;
  if (!permission || session.role === "admin" || session.permissions.includes(permission)) {
    return session;
  }
  return null;
}

function cleanNumber(value: unknown, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : fallback;
}

function productFields(body: Record<string, unknown>) {
  return {
    name: String(body.name ?? "").trim(),
    sku: String(body.sku ?? "").trim().toUpperCase(),
    barcode: String(body.barcode ?? "").trim() || undefined,
    category: String(body.category ?? "").trim(),
    brand: String(body.brand ?? "").trim(),
    purchasePrice: cleanNumber(body.purchasePrice),
    sellingPrice: cleanNumber(body.sellingPrice),
    wholesalePrice: cleanNumber(body.wholesalePrice),
    taxPercent: cleanNumber(body.taxPercent),
    discount: cleanNumber(body.discount),
    unit: String(body.unit ?? "pcs").trim() || "pcs",
    currentStock: cleanNumber(body.currentStock),
    minimumStock: cleanNumber(body.minimumStock),
    description: String(body.description ?? "").trim(),
    active: body.active !== false,
  };
}

export async function GET(request: NextRequest) {
  const session = await requireUser("view_inventory");
  if (!session) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  try {
    await connectMongo();
    const query = request.nextUrl.searchParams.get("q")?.trim();
    const filter: Record<string, unknown> = { shopId: session.shopId, active: true };
    if (query) {
      const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { name: { $regex: escaped, $options: "i" } },
        { sku: { $regex: escaped, $options: "i" } },
        { barcode: { $regex: escaped, $options: "i" } },
      ];
    }
    const products = await Product.find(filter).sort({ updatedAt: -1 }).limit(500).lean();
    return NextResponse.json({ products });
  } catch {
    return NextResponse.json({ error: "Unable to load products" }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const session = await requireUser("manage_products");
  if (!session) return NextResponse.json({ error: "Product access required" }, { status: 403 });

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const fields = productFields(body);
    if (!fields.name || !fields.sku || fields.sellingPrice <= 0) {
      return NextResponse.json(
        { error: "Name, SKU, and a selling price greater than zero are required" },
        { status: 400 },
      );
    }
    await connectMongo();
    const product = await Product.create({ ...fields, shopId: session.shopId });
    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    const duplicate =
      typeof error === "object" && error !== null && "code" in error && error.code === 11000;
    return NextResponse.json(
      { error: duplicate ? "SKU or barcode already exists" : "Unable to create product" },
      { status: duplicate ? 409 : 503 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const session = await requireUser("manage_products");
  if (!session) return NextResponse.json({ error: "Product access required" }, { status: 403 });

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const id = String(body.id ?? "");
    const fields = productFields(body);
    if (!id || !fields.name || !fields.sku || fields.sellingPrice <= 0) {
      return NextResponse.json({ error: "Invalid product details" }, { status: 400 });
    }
    await connectMongo();
    const product = await Product.findOneAndUpdate(
      { _id: id, shopId: session.shopId },
      { $set: fields },
      { new: true, runValidators: true },
    );
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    return NextResponse.json({ product });
  } catch (error) {
    const duplicate =
      typeof error === "object" && error !== null && "code" in error && error.code === 11000;
    return NextResponse.json(
      { error: duplicate ? "SKU or barcode already exists" : "Unable to update product" },
      { status: duplicate ? 409 : 503 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const session = await requireUser("manage_products");
  if (!session) return NextResponse.json({ error: "Product access required" }, { status: 403 });

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Product id is required" }, { status: 400 });
  await connectMongo();
  const product = await Product.findOneAndUpdate(
    { _id: id, shopId: session.shopId },
    { $set: { active: false } },
    { new: true },
  );
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
