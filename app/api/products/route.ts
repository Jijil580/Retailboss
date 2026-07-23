import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { Product } from "@/models/Product";

export const dynamic = "force-dynamic";

function getShopId(request: NextRequest) {
  return request.headers.get("x-shop-id")?.trim();
}

export async function GET(request: NextRequest) {
  const shopId = getShopId(request);
  if (!shopId) {
    return NextResponse.json({ error: "x-shop-id header is required" }, { status: 400 });
  }

  try {
    await connectMongo();
    const query = request.nextUrl.searchParams.get("q")?.trim();
    const filter = query
      ? { shopId, $text: { $search: query }, active: true }
      : { shopId, active: true };
    const products = await Product.find(filter).sort({ updatedAt: -1 }).limit(100).lean();
    return NextResponse.json({ products });
  } catch (error) {
    return NextResponse.json({ error: "Unable to load products" }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const shopId = getShopId(request);
  if (!shopId) {
    return NextResponse.json({ error: "x-shop-id header is required" }, { status: 400 });
  }

  try {
    const body = await request.json();
    if (!body.name?.trim() || !body.sku?.trim() || Number(body.sellingPrice) < 0) {
      return NextResponse.json(
        { error: "name, sku, and a valid sellingPrice are required" },
        { status: 400 },
      );
    }

    await connectMongo();
    const product = await Product.create({
      ...body,
      shopId,
      name: body.name.trim(),
      sku: body.sku.trim(),
    });
    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    const duplicate =
      typeof error === "object" && error !== null && "code" in error && error.code === 11000;
    return NextResponse.json(
      { error: duplicate ? "SKU or barcode already exists for this shop" : "Unable to create product" },
      { status: duplicate ? 409 : 503 },
    );
  }
}
