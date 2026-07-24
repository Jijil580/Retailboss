import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectMongo } from "@/lib/mongodb";
import {
  cleanShopSettings,
  DEFAULT_SHOP_SETTINGS,
} from "@/lib/shop-settings";
import { ShopSettings } from "@/models/ShopSettings";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  await connectMongo();
  const stored = await ShopSettings.findOne({ shopId: session.shopId }).lean();
  return NextResponse.json({
    settings: stored
      ? cleanShopSettings(stored as unknown as Record<string, unknown>)
      : DEFAULT_SHOP_SETTINGS,
  });
}

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
  if (session.role !== "admin") {
    return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
  }

  const body = (await request.json()) as Record<string, unknown>;
  const settings = cleanShopSettings(body);
  if (settings.gstEnabled && !/^[0-9A-Z]{15}$/.test(settings.gstNumber)) {
    return NextResponse.json(
      { error: "Enter a valid 15-character GSTIN, or turn GST billing off" },
      { status: 400 },
    );
  }

  await connectMongo();
  const saved = await ShopSettings.findOneAndUpdate(
    { shopId: session.shopId },
    { $set: settings, $setOnInsert: { shopId: session.shopId } },
    { new: true, upsert: true, runValidators: true },
  ).lean();

  return NextResponse.json({
    settings: cleanShopSettings(saved as unknown as Record<string, unknown>),
  });
}
